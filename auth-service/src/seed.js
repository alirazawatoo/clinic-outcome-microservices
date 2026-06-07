require('dotenv').config();
const mongoose = require('mongoose');
const Clinic = require('./models/Clinic');
const UserRegistry = require('./models/UserRegistry');
const { getUserSchema } = require('./schemas/user');

const clinics = [
  {
    clinicId: 'clinic-sunrise',
    name: 'Sunrise Medical Center',
    address: '123 Health Ave, New York, NY 10001',
    dbName: 'patient_tracker_clinic_sunrise',
  },
  {
    clinicId: 'clinic-bayview',
    name: 'Bayview Family Clinic',
    address: '456 Wellness Blvd, San Francisco, CA 94102',
    dbName: 'patient_tracker_clinic_bayview',
  },
];

const users = [
  {
    username: 'dr.smith',
    password: 'password123',
    fullName: 'Dr. Sarah Smith',
    clinicId: 'clinic-sunrise',
    role: 'doctor',
  },
  {
    username: 'nurse.jones',
    password: 'password123',
    fullName: 'Nurse Mike Jones',
    clinicId: 'clinic-sunrise',
    role: 'nurse',
  },
  {
    username: 'dr.chen',
    password: 'password123',
    fullName: 'Dr. Lisa Chen',
    clinicId: 'clinic-bayview',
    role: 'doctor',
  },
  {
    username: 'admin.lee',
    password: 'password123',
    fullName: 'Admin Kevin Lee',
    clinicId: 'clinic-bayview',
    role: 'admin',
  },
];

async function seed() {
  const clinicConnections = [];

  try {
    await mongoose.connect(process.env.MONGODB_REGISTRY_URI);
    console.log('Connected to registry database');

    await Clinic.deleteMany({});
    await UserRegistry.deleteMany({});
    console.log('Cleared registry data');

    await Clinic.insertMany(clinics);
    console.log(`Seeded ${clinics.length} clinics in registry`);

    const registryEntries = users.map((u) => ({
      username: u.username,
      clinicId: u.clinicId,
    }));
    await UserRegistry.insertMany(registryEntries);
    console.log(`Seeded ${registryEntries.length} user registry entries`);

    const baseUri = process.env.MONGODB_BASE_URI;

    for (const clinic of clinics) {
      const conn = mongoose.createConnection(`${baseUri}/${clinic.dbName}`);
      clinicConnections.push(conn);

      await conn.asPromise();
      console.log(`\nConnected to clinic DB: ${clinic.dbName}`);

      const User = conn.model('User', getUserSchema());

      await User.deleteMany({});
      console.log(`  Cleared users in ${clinic.dbName}`);

      const clinicUsers = users.filter((u) => u.clinicId === clinic.clinicId);
      for (const userData of clinicUsers) {
        await User.create(userData);
      }
      console.log(`  Seeded ${clinicUsers.length} users`);
    }

    console.log('\n--- Auth Seed Complete ---');
    console.log('Test Credentials:');
    clinics.forEach((c) => {
      console.log(`\n  ${c.name} (${c.clinicId}) -> DB: ${c.dbName}`);
      users
        .filter((u) => u.clinicId === c.clinicId)
        .forEach((u) => {
          console.log(`    Username: ${u.username} | Password: ${u.password} | Role: ${u.role}`);
        });
    });

    for (const conn of clinicConnections) {
      await conn.close();
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    for (const conn of clinicConnections) {
      await conn.close().catch(() => {});
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seed();
