/**
 * Web Server Entry Point
 * Express server for Business Development Coordinator Management System
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'), false);
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Helper to get fresh analyzer (bypass cache for development)
 */
function getFreshAnalyzer() {
  const modulePaths = [
    require.resolve('./analyzer.js'),
    require.resolve('./languageDetector.js'),
    require.resolve('./coordinatorDB.js')
  ];
  
  modulePaths.forEach(mp => {
    if (require.cache[mp]) {
      delete require.cache[mp];
    }
  });
  
  Object.keys(require.cache).forEach(key => {
    if (key.includes('guvi-problem\\src') || key.includes('guvi-problem/src')) {
      delete require.cache[key];
    }
  });
  
  return require('./analyzer.js');
}

// ============ Coordinator Endpoints ============

/**
 * GET /api/coordinators - Get all coordinators
 */
app.get('/api/coordinators', (req, res) => {
  try {
    const { getAllCoordinators } = require('./coordinatorDB.js');
    const coordinators = getAllCoordinators();
    res.json(coordinators);
  } catch (error) {
    console.error('Error fetching coordinators:', error);
    res.status(500).json({ error: 'Failed to fetch coordinators' });
  }
});

/**
 * GET /api/coordinators/:id - Get coordinator by ID
 */
app.get('/api/coordinators/:id', (req, res) => {
  try {
    const { getCoordinatorById } = require('./coordinatorDB.js');
    const coordinator = getCoordinatorById(req.params.id);
    if (!coordinator) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }
    res.json(coordinator);
  } catch (error) {
    console.error('Error fetching coordinator:', error);
    res.status(500).json({ error: 'Failed to fetch coordinator' });
  }
});

/**
 * POST /api/coordinators - Add new coordinator
 */
app.post('/api/coordinators', (req, res) => {
  try {
    const { addCoordinator } = require('./coordinatorDB.js');
    const coordinator = addCoordinator(req.body);
    res.status(201).json(coordinator);
  } catch (error) {
    console.error('Error adding coordinator:', error);
    res.status(500).json({ error: 'Failed to add coordinator' });
  }
});

/**
 * PUT /api/coordinators/:id - Update coordinator
 */
app.put('/api/coordinators/:id', (req, res) => {
  try {
    const { updateCoordinator } = require('./coordinatorDB.js');
    const coordinator = updateCoordinator(req.params.id, req.body);
    if (!coordinator) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }
    res.json(coordinator);
  } catch (error) {
    console.error('Error updating coordinator:', error);
    res.status(500).json({ error: 'Failed to update coordinator' });
  }
});

/**
 * DELETE /api/coordinators/:id - Delete coordinator
 */
app.delete('/api/coordinators/:id', (req, res) => {
  try {
    const { deleteCoordinator } = require('./coordinatorDB.js');
    const success = deleteCoordinator(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }
    res.json({ success: true, message: 'Coordinator deleted' });
  } catch (error) {
    console.error('Error deleting coordinator:', error);
    res.status(500).json({ error: 'Failed to delete coordinator' });
  }
});

// ============ Lead Endpoints ============

/**
 * GET /api/leads - Get all leads or leads for a coordinator
 */
app.get('/api/leads', (req, res) => {
  try {
    const { getAllLeads, getLeadsByCoordinator } = require('./coordinatorDB.js');
    const coordinatorId = req.query.coordinatorId;
    
    const leads = coordinatorId 
      ? getLeadsByCoordinator(coordinatorId)
      : getAllLeads();
    
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

/**
 * GET /api/leads/:id - Get lead by ID
 */
app.get('/api/leads/:id', (req, res) => {
  try {
    const { getLeadById } = require('./coordinatorDB.js');
    const lead = getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

/**
 * POST /api/leads - Create new lead
 */
app.post('/api/leads', (req, res) => {
  try {
    const { createLead } = require('./coordinatorDB.js');
    const lead = createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

/**
 * PUT /api/leads/:id/status - Update lead status
 */
app.put('/api/leads/:id/status', (req, res) => {
  try {
    const { updateLeadStatus } = require('./coordinatorDB.js');
    const lead = updateLeadStatus(req.params.id, req.body.status);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// ============ Transcription & Analysis Endpoints ============

/**
 * POST /api/analyze - Analyze a transcript
 */
app.post('/api/analyze', upload.single('transcript'), (req, res) => {
  try {
    let transcriptText = '';

    if (req.file) {
      transcriptText = fs.readFileSync(req.file.path, 'utf-8');
      fs.unlinkSync(req.file.path);
    } else if (req.body.transcript) {
      transcriptText = req.body.transcript;
    } else {
      return res.status(400).json({ error: 'No transcript provided.' });
    }

    if (!transcriptText.trim()) {
      return res.status(400).json({ error: 'Transcript is empty.' });
    }

    const { analyzeCallTranscript } = getFreshAnalyzer();
    const result = analyzeCallTranscript(transcriptText);
    
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze transcript', details: error.message });
  }
});

/**
 * POST /api/leads/:id/transcription - Upload transcription and transfer lead if needed
 */
app.post('/api/leads/:id/transcription', upload.single('transcript'), (req, res) => {
  try {
    let transcriptText = '';

    if (req.file) {
      transcriptText = fs.readFileSync(req.file.path, 'utf-8');
      fs.unlinkSync(req.file.path);
    } else if (req.body.transcript) {
      transcriptText = req.body.transcript;
    } else {
      return res.status(400).json({ error: 'No transcript provided.' });
    }

    if (!transcriptText.trim()) {
      return res.status(400).json({ error: 'Transcript is empty.' });
    }

    // Analyze the transcript
    const { analyzeCallTranscript } = getFreshAnalyzer();
    const analysisResult = analyzeCallTranscript(transcriptText);
    
    // Import transfer function
    const { transferLead } = require('./coordinatorDB.js');
    
    // Check if there's a language mismatch and transfer if needed
    let transferResult = null;
    if (analysisResult.hasLanguageMismatch) {
      // Find the customer's language
      const customerEntry = Object.entries(analysisResult.roles || {})
        .find(([_, r]) => r.role === 'customer');
      
      if (customerEntry) {
        const customerLanguage = analysisResult.speakers[customerEntry[0]]?.code;
        if (customerLanguage) {
          transferResult = transferLead(req.params.id, customerLanguage, analysisResult);
        }
      }
    }
    
    res.json({
      analysis: analysisResult,
      transfer: transferResult
    });
  } catch (error) {
    console.error('Transcription upload error:', error);
    res.status(500).json({ error: 'Failed to process transcription', details: error.message });
  }
});

// ============ Pending Transfers Endpoint ============

/**
 * GET /api/pending-transfers - Get all pending transfers
 */
app.get('/api/pending-transfers', (req, res) => {
  try {
    const { getPendingTransfers } = require('./coordinatorDB.js');
    const pending = getPendingTransfers();
    res.json(pending);
  } catch (error) {
    console.error('Error fetching pending transfers:', error);
    res.status(500).json({ error: 'Failed to fetch pending transfers' });
  }
});

// ============ Serve React App ============

/**
 * Serve the main HTML page for all routes (SPA support)
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   Business Development Coordinator Management System            ║
║   Server running at: http://localhost:${PORT}                     ║
╚═══════════════════════════════════════════════════════════════╝

API Endpoints:
  Coordinators:
    GET    /api/coordinators        - List all coordinators
    GET    /api/coordinators/:id    - Get coordinator by ID
    POST   /api/coordinators        - Add new coordinator
    PUT    /api/coordinators/:id    - Update coordinator
    DELETE /api/coordinators/:id    - Delete coordinator

  Leads:
    GET    /api/leads               - List all leads
    GET    /api/leads?coordinatorId=X - Leads for coordinator
    GET    /api/leads/:id           - Get lead by ID
    POST   /api/leads               - Create new lead
    PUT    /api/leads/:id/status    - Update lead status

  Transcriptions:
    POST   /api/analyze             - Analyze transcript
    POST   /api/leads/:id/transcription - Upload & analyze, auto-transfer

  Pending Transfers:
    GET    /api/pending-transfers   - List pending transfers
`);
});
