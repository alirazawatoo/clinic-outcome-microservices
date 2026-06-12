const mongoose = require('mongoose');
const { getOutcomeSchema } = require('../schemas/outcome');

module.exports = mongoose.model('Outcome', getOutcomeSchema());
