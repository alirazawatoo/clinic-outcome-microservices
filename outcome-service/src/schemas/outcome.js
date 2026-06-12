const mongoose = require('mongoose');

function getOutcomeSchema() {
  const outcomeSchema = new mongoose.Schema(
    {
      clinicId: {
        type: String,
        required: true,
        index: true,
      },
      patientName: {
        type: String,
        required: true,
        trim: true,
      },
      age: {
        type: Number,
        min: 0,
        max: 150,
      },
      diagnosis: {
        type: String,
        required: true,
        trim: true,
      },
      treatment: {
        type: String,
        required: true,
        trim: true,
      },
      outcome: {
        type: String,
        required: true,
        enum: ['improved', 'stable', 'declined'],
      },
      notes: {
        type: String,
        trim: true,
        default: '',
      },
      createdBy: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  );

  outcomeSchema.index({ clinicId: 1, createdAt: -1 });

  return outcomeSchema;
}

module.exports = { getOutcomeSchema };
