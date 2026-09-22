/**
 * Web Server Entry Point
 * Express server for Language Mismatch Detection Web Application
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

// In-memory storage for analysis history
let analysisHistory = [];

/**
 * Helper to get fresh module (bypass cache for development)
 */
function getFreshAnalyzer() {
  // Clear cache for our modules
  const modulePaths = [
    require.resolve('./analyzer.js'),
    require.resolve('./languageDetector.js'),
    require.resolve('./coordinatorDB.js')
  ];
  
  console.log('[DEBUG] Clearing module cache for:', modulePaths);
  
  modulePaths.forEach(mp => {
    if (require.cache[mp]) {
      console.log('[DEBUG] Deleting from cache:', mp);
      delete require.cache[mp];
    } else {
      console.log('[DEBUG] Not in cache:', mp);
    }
  });
  
  // Also clear any modules in the src directory
  Object.keys(require.cache).forEach(key => {
    if (key.includes('guvi-problem\\src') || key.includes('guvi-problem/src')) {
      console.log('[DEBUG] Clearing additional cached module:', key);
      delete require.cache[key];
    }
  });
  
  const analyzer = require('./analyzer.js');
  console.log('[DEBUG] Loaded analyzer. analyzeCallTranscript type:', typeof analyzer.analyzeCallTranscript);
  
  return analyzer;
}

/**
 * API Endpoint: Analyze transcript
 * POST /api/analyze
 */
app.post('/api/analyze', upload.single('transcript'), (req, res) => {
  console.log('[DEBUG] ===== NEW REQUEST =====');
  console.log('[DEBUG] Request received');
  
  try {
    let transcriptText = '';

    if (req.file) {
      transcriptText = fs.readFileSync(req.file.path, 'utf-8');
      fs.unlinkSync(req.file.path);
      console.log('[DEBUG] Read from file, length:', transcriptText.length);
    } else if (req.body.transcript) {
      transcriptText = req.body.transcript;
      console.log('[DEBUG] Read from body, length:', transcriptText.length);
    } else {
      return res.status(400).json({ error: 'No transcript provided.' });
    }

    if (!transcriptText.trim()) {
      return res.status(400).json({ error: 'Transcript is empty.' });
    }

    console.log('[DEBUG] About to get fresh analyzer...');
    // Get fresh analyzer to ensure latest code is used
    const { analyzeCallTranscript } = getFreshAnalyzer();
    console.log('[DEBUG] Got analyzer, calling analyzeCallTranscript...');
    
    const result = analyzeCallTranscript(transcriptText);
    
    console.log('[DEBUG] Analysis complete. Roles:', JSON.stringify(result.roles));

    // Add to history
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      hasMismatch: result.hasLanguageMismatch,
      languages: result.languages,
      speakerCount: Object.keys(result.speakerDetails).length
    };
    analysisHistory.unshift(historyEntry);
    if (analysisHistory.length > 50) analysisHistory.pop();

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze transcript', details: error.message });
  }
});

/**
 * API Endpoint: Get all coordinators
 * GET /api/coordinators
 */
app.get('/api/coordinators', (req, res) => {
  try {
    const { getAllCoordinators } = require('./coordinatorDB.js');
    const coordinators = getAllCoordinators();
    res.json(coordinators);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coordinators' });
  }
});

/**
 * API Endpoint: Get analysis history
 * GET /api/history
 */
app.get('/api/history', (req, res) => {
  res.json(analysisHistory);
});

/**
 * Serve the main HTML page
 */
app.get('/', (req, res) => {
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
╔═══════════════════════════════════════════════════════════╗
║   Language Mismatch Detection Web Application              ║
║   Server running at: http://localhost:${PORT}                 ║
╚═══════════════════════════════════════════════════════════╝

Endpoints:
  GET  /              - Web interface
  POST /api/analyze   - Analyze a transcript (file upload or JSON body)
  GET  /api/coordinators - Get all coordinators
  GET  /api/history   - Get analysis history
`);
});
