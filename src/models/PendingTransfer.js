const mongoose = require('mongoose');

const pendingTransferSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  requiredLanguage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.models.PendingTransfer || mongoose.model('PendingTransfer', pendingTransferSchema);