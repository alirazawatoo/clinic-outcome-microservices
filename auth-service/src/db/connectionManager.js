const mongoose = require('mongoose');
const { getUserSchema } = require('../schemas/user');

const clinicConnections = new Map();

function getRegistryConnection() {
  return mongoose.connection;
}

async function getClinicConnection(clinicId, dbName) {
  if (clinicConnections.has(clinicId)) {
    return clinicConnections.get(clinicId);
  }

  const baseUri = process.env.MONGODB_BASE_URI;
  const conn = mongoose.createConnection(`${baseUri}/${dbName}`);

  conn.model('User', getUserSchema());

  clinicConnections.set(clinicId, conn);

  await conn.asPromise();
  console.log(`Auth Service: Connected to clinic DB "${dbName}" for ${clinicId}`);

  return conn;
}

function getClinicUserModel(conn) {
  return conn.model('User');
}

async function closeAll() {
  for (const [clinicId, conn] of clinicConnections) {
    await conn.close();
    console.log(`Closed connection for ${clinicId}`);
  }
  clinicConnections.clear();
}

module.exports = { getRegistryConnection, getClinicConnection, getClinicUserModel, closeAll };
