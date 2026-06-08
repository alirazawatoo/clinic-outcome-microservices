const express = require('express');
const { body } = require('express-validator');
const Clinic = require('../models/Clinic');
const { getClinicConnection, getClinicOutcomeModel } = require('../db/connectionManager');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

async function resolveOutcomeModel(clinicId) {
  const clinic = await Clinic.findOne({ clinicId });
  if (!clinic) throw new Error(`Clinic not found: ${clinicId}`);
  const conn = await getClinicConnection(clinicId, clinic.dbName);
  return getClinicOutcomeModel(conn);
}

const createValidation = [
  body('patientName').trim().notEmpty().withMessage('Patient name is required'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('treatment').trim().notEmpty().withMessage('Treatment is required'),
  body('outcome')
    .isIn(['improved', 'stable', 'declined'])
    .withMessage('Outcome must be improved, stable, or declined'),
  body('notes').optional().trim(),
];

router.get('/', async (req, res) => {
  try {
    const Outcome = await resolveOutcomeModel(req.user.clinicId);
    const { page = 1, limit = 20, outcome: outcomeFilter } = req.query;
    const filter = { clinicId: req.user.clinicId };

    if (outcomeFilter && ['improved', 'stable', 'declined'].includes(outcomeFilter)) {
      filter.outcome = outcomeFilter;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [outcomes, total] = await Promise.all([
      Outcome.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Outcome.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        outcomes,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get outcomes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch outcomes' });
  }
});

router.post('/', createValidation, validate, async (req, res) => {
  try {
    const Outcome = await resolveOutcomeModel(req.user.clinicId);
    const { patientName, age, diagnosis, treatment, outcome, notes } = req.body;

    const newOutcome = await Outcome.create({
      clinicId: req.user.clinicId,
      patientName,
      age,
      diagnosis,
      treatment,
      outcome,
      notes,
      createdBy: req.user.username,
    });

    res.status(201).json({
      success: true,
      message: 'Outcome created successfully',
      data: newOutcome,
    });
  } catch (error) {
    console.error('Create outcome error:', error);
    res.status(500).json({ success: false, message: 'Failed to create outcome' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const Outcome = await resolveOutcomeModel(req.user.clinicId);
    const stats = await Outcome.aggregate([
      { $match: { clinicId: req.user.clinicId } },
      {
        $group: {
          _id: '$outcome',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { improved: 0, stable: 0, declined: 0 };
    stats.forEach((s) => {
      result[s._id] = s.count;
    });
    result.total = result.improved + result.stable + result.declined;

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
