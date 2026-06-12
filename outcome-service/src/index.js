require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const outcomeRoutes = require('./routes/outcomes');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

app.use('/api/outcomes', outcomeRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'outcome-service' });
});

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

mongoose
  .connect(process.env.MONGODB_REGISTRY_URI)
  .then(() => {
    console.log('Outcome Service: Connected to registry DB');
    app.listen(PORT, () => {
      console.log(`Outcome Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Outcome Service: Registry DB connection error:', err);
    process.exit(1);
  });
