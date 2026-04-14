import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

async function seed() {
  await connectDB();

  await User.deleteMany({ role: { $in: ['admin', 'doctor'] } });

  await User.create({
    name: 'System Admin',
    email: 'admin@hms.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '1234567890'
  });

  await User.create({
    name: 'Dr. Sarah Khan',
    email: 'doctor1@hms.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '1112223333',
    specialization: 'Cardiology'
  });

  await User.create({
    name: 'Dr. James Patel',
    email: 'doctor2@hms.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '4445556666',
    specialization: 'Neurology'
  });

  console.log('Seed data inserted successfully');
  await mongoose.connection.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
