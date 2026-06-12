const mongoose = require('mongoose');
const { getOutcomeSchema } = require('../schemas/outcome');

const clinicConnections = new Map();

async function getClinicConnection(clinicId, dbName) {
  if (clinicConnections.has(clinicId)) {
    return clinicConnections.get(clinicId);
  }

  const baseUri = process.env.MONGODB_BASE_URI;
  const conn = mongoose.createConnection(`${baseUri}/${dbName}`);

  conn.model('Outcome', getOutcomeSchema());

  clinicConnections.set(clinicId, conn);

  await conn.asPromise();
  console.log(`Outcome Service: Connected to clinic DB "${dbName}" for ${clinicId}`);

  return conn;
}

function getClinicOutcomeModel(conn) {
  return conn.model('Outcome');
}

async function closeAll() {
  for (const [clinicId, conn] of clinicConnections) {
    await conn.close();
    console.log(`Closed connection for ${clinicId}`);
  }
  clinicConnections.clear();
}

module.exports = { getClinicConnection, getClinicOutcomeModel, closeAll };
