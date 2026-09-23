/**
 * Coordinator Database Module
 * Now backed by MongoDB via Mongoose
 */

const Coordinator = require('./models/Coordinator.js');
const Lead = require('./models/Lead.js');
const PendingTransfer = require('./models/PendingTransfer.js');

// ============ Coordinator operations ============
async function getAllCoordinators() {
  return Coordinator.find();
}

async function getCoordinatorById(id) {
  return Coordinator.findById(id);
}

async function addCoordinator(coordinator) {
  const newCoordinator = await Coordinator.create({
    name: coordinator.name,
    languages: coordinator.languages || ['en'],
    department: coordinator.department || 'Sales',
    available: true
  });

  await processPendingTransfers();

  return newCoordinator;
}

async function updateCoordinator(id, updates) {
  return Coordinator.findByIdAndUpdate(id, updates, { new: true });
}

async function deleteCoordinator(id) {
  const coordinator = await Coordinator.findById(id);
  if (!coordinator) return false;

  const coordinatorLeads = await Lead.find({ assignedCoordinatorId: id });

  for (const lead of coordinatorLeads) {
    lead.assignedCoordinatorId = null;
    lead.status = 'pending_transfer';
    await lead.save();

    if (lead.requiredLanguage) {
      await PendingTransfer.create({
        leadId: lead._id,
        requiredLanguage: lead.requiredLanguage
      });
    }
  }

  await Coordinator.findByIdAndDelete(id);
  return true;
}

/**
 * Find coordinators who speak the given languages
 * @param {Array<string>} languages - Language codes to match
 * @param {Object} options - { matchAny, availableOnly, department }
 */
async function findCoordinatorsByLanguages(languages, options = {}) {
  const {
    matchAny = true,
    availableOnly = true,
    department = null
  } = options;

  if (!Array.isArray(languages)) languages = [languages];

  const query = {};
  if (availableOnly) query.available = true;
  if (department) query.department = department;

  // matchAny: at least one language overlaps ($in)
  // matchAll: every language must be present ($all)
  query.languages = matchAny ? { $in: languages } : { $all: languages };

  return Coordinator.find(query);
}

// ============ Lead operations ============

async function getLeadsByCoordinator(coordinatorId) {
  return Lead.find({ assignedCoordinatorId: coordinatorId });
}

async function getAllLeads() {
  return Lead.find();
}

async function getLeadById(id) {
  return Lead.findById(id);
}

async function addTranscriptionToLead(leadId, transcript, analysisResult) {
  const lead = await Lead.findById(leadId);
  if (!lead) return null;

  lead.callTranscriptions.push({
    transcript: transcript,
    detectedLanguages: analysisResult.languages,
    detectedBy: analysisResult.method || 'analysis',
    speakerDetails: analysisResult.speakerDetails
  });

  await lead.save();
  return lead;
}

/**
 * Transfer lead to another coordinator or queue for transfer
 */
async function transferLead(leadId, targetLanguage, analysisResult) {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    return { success: false, message: 'Lead not found' };
  }

  await addTranscriptionToLead(leadId, analysisResult.transcript, analysisResult);

  const currentCoordinatorId = lead.assignedCoordinatorId?.toString();

  const matchingCoordinator = await Coordinator.findOne({
    _id: { $ne: currentCoordinatorId },
    languages: targetLanguage,
    available: true
  });

  if (matchingCoordinator) {
    lead.assignedCoordinatorId = matchingCoordinator._id;
    lead.status = 'transferred';
    lead.requiredLanguage = targetLanguage;
    await lead.save();

    return {
      success: true,
      message: `Lead transferred to ${matchingCoordinator.name}`,
      targetCoordinator: matchingCoordinator,
      queued: false
    };
  } else {
    lead.assignedCoordinatorId = null;
    lead.status = 'pending_transfer';
    lead.requiredLanguage = targetLanguage;
    await lead.save();

    const existingPending = await PendingTransfer.findOne({ leadId: lead._id });
    if (!existingPending) {
      await PendingTransfer.create({
        leadId: lead._id,
        requiredLanguage: targetLanguage
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
 * Process pending transfers when a new coordinator is added
 */
async function processPendingTransfers() {
  const pending = await PendingTransfer.find();

  for (const p of pending) {
    const lead = await Lead.findById(p.leadId);
    if (!lead) {
      await PendingTransfer.findByIdAndDelete(p._id);
      continue;
    }

    const matchingCoordinator = await Coordinator.findOne({
      languages: p.requiredLanguage,
      available: true
    });

    if (matchingCoordinator) {
      lead.assignedCoordinatorId = matchingCoordinator._id;
      lead.status = 'transferred';
      lead.requiredLanguage = null;
      await lead.save();
      await PendingTransfer.findByIdAndDelete(p._id);
    }
  }
}

async function getPendingTransfers() {
  const pending = await PendingTransfer.find();

  const results = [];
  for (const p of pending) {
    const lead = await Lead.findById(p.leadId);
    results.push({
      leadId: p.leadId,
      requiredLanguage: p.requiredLanguage,
      timestamp: p.timestamp,
      lead: lead || { id: p.leadId, name: 'Unknown' }
    });
  }
  return results;
}

async function createLead(leadData) {
  return Lead.create({
    name: leadData.name,
    phone: leadData.phone || '',
    email: leadData.email || '',
    status: 'new',
    assignedCoordinatorId: leadData.assignedCoordinatorId || null,
    requiredLanguage: null,
    callTranscriptions: []
  });
}

async function updateLeadStatus(leadId, status) {
  return Lead.findByIdAndUpdate(leadId, { status }, { new: true });
}

module.exports = {
  getAllCoordinators,
  getCoordinatorById,
  addCoordinator,
  updateCoordinator,
  deleteCoordinator,
  findCoordinatorsByLanguages,

  getAllLeads,
  getLeadById,
  getLeadsByCoordinator,
  createLead,
  updateLeadStatus,
  addTranscriptionToLead,
  transferLead,

  getPendingTransfers,
  processPendingTransfers
};