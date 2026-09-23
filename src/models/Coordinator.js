const mongoose = require('mongoose');

const coordinatorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  languages: { type: [String], default: ['en'] },
  department: { type: String, default: 'Sales' },
  available: { type: Boolean, default: true }
});

// Add virtual `id` field that returns _id as string
coordinatorSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtuals are included in JSON output
coordinatorSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    return ret;
  }
});

coordinatorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Coordinator ||
mongoose.model('Coordinator', coordinatorSchema);