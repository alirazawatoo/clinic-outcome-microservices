require('dotenv').config();
const mongoose = require('mongoose');
const Clinic = require('./models/Clinic');
const { getOutcomeSchema } = require('./schemas/outcome');

const outcomes = [
  {
    clinicId: 'clinic-sunrise',
    patientName: 'John Doe',
    age: 45,
    diagnosis: 'Type 2 Diabetes',
    treatment: 'Metformin 500mg twice daily + diet modification',
    outcome: 'improved',
    notes: 'HbA1c dropped from 8.2 to 6.9 over 3 months',
    createdBy: 'dr.smith',
  },
  {
    clinicId: 'clinic-sunrise',
    patientName: 'Jane Wilson',
    age: 62,
    diagnosis: 'Hypertension',
    treatment: 'Lisinopril 10mg daily + lifestyle changes',
    outcome: 'stable',
    notes: 'Blood pressure maintained at 130/85',
    createdBy: 'dr.smith',
  },
  {
    clinicId: 'clinic-sunrise',
    patientName: 'Robert Brown',
    age: 38,
    diagnosis: 'Chronic Lower Back Pain',
    treatment: 'Physical therapy 3x/week + NSAIDs',
    outcome: 'improved',
    notes: 'Pain level reduced from 7/10 to 3/10',
    createdBy: 'nurse.jones',
  },
  {
    clinicId: 'clinic-sunrise',
    patientName: 'Emily Davis',
    age: 29,
    diagnosis: 'Generalized Anxiety Disorder',
    treatment: 'CBT sessions + Sertraline 50mg',
    outcome: 'improved',
    notes: 'GAD-7 score improved from 15 to 7',
    createdBy: 'dr.smith',
  },
  {
    clinicId: 'clinic-bayview',
    patientName: 'Michael Chang',
    age: 55,
    diagnosis: 'Coronary Artery Disease',
    treatment: 'Aspirin 81mg + Atorvastatin 40mg + cardiac rehab',
    outcome: 'stable',
    notes: 'Stress test shows no new ischemia',
    createdBy: 'dr.chen',
  },
  {
    clinicId: 'clinic-bayview',
    patientName: 'Sarah Martinez',
    age: 42,
    diagnosis: 'Rheumatoid Arthritis',
    treatment: 'Methotrexate 15mg weekly + folic acid',
    outcome: 'improved',
    notes: 'Joint swelling significantly reduced, DAS28 score dropped',
    createdBy: 'dr.chen',
  },
  {
    clinicId: 'clinic-bayview',
    patientName: 'David Kim',
    age: 70,
    diagnosis: 'COPD Stage III',
    treatment: 'Tiotropium inhaler + pulmonary rehabilitation',
    outcome: 'declined',
    notes: 'FEV1 decreased by 5% despite treatment. Considering escalation.',
    createdBy: 'dr.chen',
  },
  {
    clinicId: 'clinic-bayview',
    patientName: 'Lisa Nguyen',
    age: 34,
    diagnosis: 'Migraine with Aura',
    treatment: 'Sumatriptan 50mg PRN + Topiramate 25mg prophylaxis',
    outcome: 'improved',
    notes: 'Migraine frequency reduced from 8/month to 2/month',
    createdBy: 'admin.lee',
  },
];

async function seed() {
  const clinicConnections = [];

  try {
    await mongoose.connect(process.env.MONGODB_REGISTRY_URI);
    console.log('Connected to registry database');

    const clinics = await Clinic.find({});
    if (clinics.length === 0) {
      console.error('No clinics found in registry. Run auth-service seed first.');
      process.exit(1);
    }

    const baseUri = process.env.MONGODB_BASE_URI;

    for (const clinic of clinics) {
      const conn = mongoose.createConnection(`${baseUri}/${clinic.dbName}`);
      clinicConnections.push(conn);

      await conn.asPromise();
      console.log(`\nConnected to clinic DB: ${clinic.dbName}`);

      const Outcome = conn.model('Outcome', getOutcomeSchema());

      await Outcome.deleteMany({});
      console.log(`  Cleared outcomes in ${clinic.dbName}`);

      const clinicOutcomes = outcomes.filter((o) => o.clinicId === clinic.clinicId);
      if (clinicOutcomes.length > 0) {
        await Outcome.insertMany(clinicOutcomes);
        console.log(`  Seeded ${clinicOutcomes.length} outcomes`);
      } else {
        console.log(`  No outcomes to seed`);
      }
    }

    console.log('\n--- Outcome Seed Complete ---');
    clinics.forEach((c) => {
      const count = outcomes.filter((o) => o.clinicId === c.clinicId).length;
      console.log(`  ${c.name} (${c.dbName}): ${count} outcomes`);
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
