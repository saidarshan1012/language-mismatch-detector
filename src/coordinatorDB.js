/**
 * Coordinator Database Module
 * Manages the database of Business Development Coordinators and their language skills
 */

// In-memory database of Business Development Coordinators
let coordinatorDatabase = [
  { id: 1, name: 'Priya Sharma', languages: ['en', 'hi'], department: 'Sales', available: true },
  { id: 2, name: 'Rahul Kumar', languages: ['en', 'ta'], department: 'Sales', available: true },
  { id: 3, name: 'Ananya Reddy', languages: ['en', 'te'], department: 'Sales', available: true },
  { id: 4, name: 'Vikram Singh', languages: ['en', 'pa'], department: 'Sales', available: true },
];

// In-memory leads database
// Each lead has: id, name, phone, email, status, assignedCoordinatorId, requiredLanguage (nullable), callTranscriptions
let leadsDatabase = [
  { 
    id: 1, 
    name: 'Ramesh Kumar', 
    phone: '+91 98765 43210', 
    email: 'ramesh@example.com',
    status: 'new', 
    assignedCoordinatorId: 1,
    requiredLanguage: null,
    callTranscriptions: []
  },
  { 
    id: 2, 
    name: 'Sita Devi', 
    phone: '+91 87654 32109', 
    email: 'sita@example.com',
    status: 'new', 
    assignedCoordinatorId: 1,
    requiredLanguage: null,
    callTranscriptions: []
  },
  { 
    id: 3, 
    name: 'Kannan M', 
    phone: '+91 76543 21098', 
    email: 'kannan@example.com',
    status: 'new', 
    assignedCoordinatorId: 2,
    requiredLanguage: null,
    callTranscriptions: []
  },
  { 
    id: 4, 
    name: 'Lakshmi P', 
    phone: '+91 65432 10987', 
    email: 'lakshmi@example.com',
    status: 'new', 
    assignedCoordinatorId: 2,
    requiredLanguage: null,
    callTranscriptions: []
  },
  { 
    id: 5, 
    name: 'Venkat R', 
    phone: '+91 54321 09876', 
    email: 'venkat@example.com',
    status: 'new', 
    assignedCoordinatorId: 3,
    requiredLanguage: null,
    callTranscriptions: []
  },
  { 
    id: 6, 
    name: 'Harpreet Singh', 
    phone: '+91 43210 98765', 
    email: 'harpreet@example.com',
    status: 'new', 
    assignedCoordinatorId: 4,
    requiredLanguage: null,
    callTranscriptions: []
  },
  { 
    id: 7, 
    name: 'Deepa Nair', 
    phone: '+91 32109 87654', 
    email: 'deepa@example.com',
    status: 'pending_transfer', 
    assignedCoordinatorId: null,
    requiredLanguage: 'ml', // Waiting for Malayalam coordinator
    callTranscriptions: [
      { 
        id: 1, 
        timestamp: new Date().toISOString(), 
        transcript: 'Agent: Hello, this is Priya from GUVI.\nCustomer: നമസ്കാരം, എനിക്ക് നിങ്ങളുടെ കോഴ്സിനെക്കുറിച്ച് അറിയണം.\nAgent: I apologize, I don\'t speak Malayalam. Let me transfer you.',
        detectedLanguages: ['ml', 'en'],
        detectedBy: 'script'
      }
    ]
  },
];

// Pending transfers queue - leads waiting for a coordinator with specific language
// Each entry: { leadId, requiredLanguage, timestamp }
let pendingTransfers = [
  { leadId: 7, requiredLanguage: 'ml', timestamp: new Date().toISOString() }
];

/**
 * Get all coordinators
 * @returns {Array} - All coordinators
 */
function getAllCoordinators() {
  return [...coordinatorDatabase];
}

/**
 * Get coordinator by ID
 * @param {number} id - Coordinator ID
 * @returns {Object|null} - Coordinator or null
 */
function getCoordinatorById(id) {
  return coordinatorDatabase.find(c => c.id === parseInt(id)) || null;
}

/**
 * Add a new coordinator
 * @param {Object} coordinator - Coordinator details { name, languages, department }
 * @returns {Object} - Added coordinator with ID
 */
function addCoordinator(coordinator) {
  const newCoordinator = {
    id: Math.max(...coordinatorDatabase.map(c => c.id), 0) + 1,
    name: coordinator.name,
    languages: coordinator.languages || ['en'],
    department: coordinator.department || 'Sales',
    available: true
  };
  coordinatorDatabase.push(newCoordinator);
  
  // Check if any pending transfers can be fulfilled
  processPendingTransfers();
  
  return newCoordinator;
}

/**
 * Update coordinator
 * @param {number} id - Coordinator ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated coordinator or null
 */
function updateCoordinator(id, updates) {
  const index = coordinatorDatabase.findIndex(c => c.id === parseInt(id));
  if (index === -1) return null;
  
  coordinatorDatabase[index] = { ...coordinatorDatabase[index], ...updates };
  return coordinatorDatabase[index];
}

/**
 * Delete coordinator
 * @param {number} id - Coordinator ID
 * @returns {boolean} - Success status
 */
function deleteCoordinator(id) {
  const index = coordinatorDatabase.findIndex(c => c.id === parseInt(id));
  if (index === -1) return false;
  
  // Reassign leads to pending transfer
  const coordinatorLeads = leadsDatabase.filter(l => l.assignedCoordinatorId === parseInt(id));
  coordinatorLeads.forEach(lead => {
    lead.assignedCoordinatorId = null;
    lead.status = 'pending_transfer';
    if (lead.requiredLanguage) {
      pendingTransfers.push({
        leadId: lead.id,
        requiredLanguage: lead.requiredLanguage,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  coordinatorDatabase.splice(index, 1);
  return true;
}

/**
 * Find coordinators who speak the given languages
 * @param {Array<string>} languages - Language codes to match against
 * @param {Object} options - Matching options
 * @param {boolean} options.matchAny - true: match coordinators who speak ANY of the languages.
 *                                      false: match coordinators who speak ALL of the languages.
 * @param {boolean} options.availableOnly - Only include available coordinators
 * @param {string} [options.department] - Optionally filter by department
 * @returns {Array} - Matching coordinators
 */
function findCoordinatorsByLanguages(languages, options = {}) {
  const {
    matchAny = true,
    availableOnly = true,
    department = null
  } = options;

  if (!Array.isArray(languages)) languages = [languages];

  return coordinatorDatabase.filter(c => {
    if (availableOnly && !c.available) return false;
    if (department && c.department !== department) return false;

    return matchAny
      ? languages.some(lang => c.languages.includes(lang))
      : languages.every(lang => c.languages.includes(lang));
  });
}
/**
 * Get leads assigned to a coordinator
 * @param {number} coordinatorId - Coordinator ID
 * @returns {Array} - Assigned leads
 */
function getLeadsByCoordinator(coordinatorId) {
  return leadsDatabase.filter(l => l.assignedCoordinatorId === parseInt(coordinatorId));
}

/**
 * Get all leads
 * @returns {Array} - All leads
 */
function getAllLeads() {
  return [...leadsDatabase];
}

/**
 * Get lead by ID
 * @param {number} id - Lead ID
 * @returns {Object|null} - Lead or null
 */
function getLeadById(id) {
  return leadsDatabase.find(l => l.id === parseInt(id)) || null;
}

/**
 * Add call transcription to a lead
 * @param {number} leadId - Lead ID
 * @param {string} transcript - Call transcript text
 * @param {Object} analysisResult - Analysis result from analyzer
 * @returns {Object|null} - Updated lead or null
 */
function addTranscriptionToLead(leadId, transcript, analysisResult) {
  const lead = leadsDatabase.find(l => l.id === parseInt(leadId));
  if (!lead) return null;
  
  const transcription = {
    id: (lead.callTranscriptions?.length || 0) + 1,
    timestamp: new Date().toISOString(),
    transcript: transcript,
    detectedLanguages: analysisResult.languages,
    detectedBy: analysisResult.method || 'analysis',
    speakerDetails: analysisResult.speakerDetails
  };
  
  if (!lead.callTranscriptions) {
    lead.callTranscriptions = [];
  }
  lead.callTranscriptions.push(transcription);
  
  return lead;
}

/**
 * Transfer lead to another coordinator or queue for transfer
 * @param {number} leadId - Lead ID
 * @param {string} targetLanguage - Target language detected
 * @param {Object} analysisResult - Full analysis result
 * @returns {Object} - Transfer result { success, message, targetCoordinator?, queued? }
 */
function transferLead(leadId, targetLanguage, analysisResult) {
  const lead = leadsDatabase.find(l => l.id === parseInt(leadId));
  if (!lead) {
    return { success: false, message: 'Lead not found' };
  }
  
  // Add transcription first
  addTranscriptionToLead(leadId, analysisResult.transcript, analysisResult);
  
  // Find coordinator who speaks the target language (excluding current if same)
  const currentCoordinatorId = lead.assignedCoordinatorId;
  const matchingCoordinator = coordinatorDatabase.find(c => 
    c.id !== currentCoordinatorId &&
    c.languages.includes(targetLanguage) &&
    c.available
  );
  
  if (matchingCoordinator) {
    // Transfer immediately
    lead.assignedCoordinatorId = matchingCoordinator.id;
    lead.status = 'transferred';
    lead.requiredLanguage = null;
    
    return {
      success: true,
      message: `Lead transferred to ${matchingCoordinator.name}`,
      targetCoordinator: matchingCoordinator,
      queued: false
    };
  } else {
    // Queue for transfer when coordinator becomes available
    lead.assignedCoordinatorId = null;
    lead.status = 'pending_transfer';
    lead.requiredLanguage = targetLanguage;
    
    // Add to pending transfers
    const existingPending = pendingTransfers.find(p => p.leadId === lead.id);
    if (!existingPending) {
      pendingTransfers.push({
        leadId: lead.id,
        requiredLanguage: targetLanguage,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      success: true,
      message: `No coordinator available for ${targetLanguage}. Lead queued for transfer.`,
      queued: true,
      requiredLanguage: targetLanguage
    };
  }
}

/**
 * Process pending transfers when new coordinator is added
 */
function processPendingTransfers() {
  const processed = [];
  
  pendingTransfers.forEach((pending, index) => {
    const lead = leadsDatabase.find(l => l.id === pending.leadId);
    if (!lead) {
      processed.push(index);
      return;
    }
    
    const matchingCoordinator = coordinatorDatabase.find(c => 
      c.languages.includes(pending.requiredLanguage) &&
      c.available
    );
    
    if (matchingCoordinator) {
      lead.assignedCoordinatorId = matchingCoordinator.id;
      lead.status = 'transferred';
      lead.requiredLanguage = null;
      processed.push(index);
    }
  });
  
  // Remove processed transfers (in reverse order to maintain indices)
  processed.sort((a, b) => b - a).forEach(index => {
    pendingTransfers.splice(index, 1);
  });
}

/**
 * Get pending transfers
 * @returns {Array} - Pending transfers with lead details
 */
function getPendingTransfers() {
  return pendingTransfers.map(pending => {
    const lead = leadsDatabase.find(l => l.id === pending.leadId);
    return {
      ...pending,
      lead: lead || { id: pending.leadId, name: 'Unknown' }
    };
  });
}

/**
 * Create a new lead
 * @param {Object} leadData - Lead details
 * @returns {Object} - Created lead
 */
function createLead(leadData) {
  const newLead = {
    id: Math.max(...leadsDatabase.map(l => l.id), 0) + 1,
    name: leadData.name,
    phone: leadData.phone || '',
    email: leadData.email || '',
    status: 'new',
    assignedCoordinatorId: leadData.assignedCoordinatorId || null,
    requiredLanguage: null,
    callTranscriptions: []
  };
  leadsDatabase.push(newLead);
  return newLead;
}

/**
 * Update lead status
 * @param {number} leadId - Lead ID
 * @param {string} status - New status
 * @returns {Object|null} - Updated lead or null
 */
function updateLeadStatus(leadId, status) {
  const lead = leadsDatabase.find(l => l.id === parseInt(leadId));
  if (!lead) return null;
  lead.status = status;
  return lead;
}

module.exports = {
  // Coordinator operations
  getAllCoordinators,
  getCoordinatorById,
  addCoordinator,
  updateCoordinator,
  deleteCoordinator,
  findCoordinatorsByLanguages,
  
  // Lead operations
  getAllLeads,
  getLeadById,
  getLeadsByCoordinator,
  createLead,
  updateLeadStatus,
  addTranscriptionToLead,
  transferLead,
  
  // Transfer operations
  getPendingTransfers,
  processPendingTransfers
};
