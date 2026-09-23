const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  transcript: String,
  detectedLanguages: [String],
  detectedBy: String,
  speakerDetails: mongoose.Schema.Types.Mixed
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  status: { type: String, default: 'new' },
  assignedCoordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coordinator', default: null },
  requiredLanguage: { type: String, default: null },
  callTranscriptions: { type: [transcriptionSchema], default: [] }
});

// Add virtual `id` field that returns _id as string
leadSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtuals are included in JSON output
leadSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    return ret;
  }
});

leadSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Lead ||
  mongoose.model('Lead', leadSchema);