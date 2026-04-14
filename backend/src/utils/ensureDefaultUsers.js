import User from "../models/User.js";

const defaultUsers = [
  {
    name: "System Admin",
    email: "admin@hms.com",
    password: "Admin@123",
    role: "admin",
    phone: "+11234567890",
  },
  {
    name: "Dr. Sarah Khan",
    email: "doctor1@hms.com",
    password: "Doctor@123",
    role: "doctor",
    phone: "+11112223333",
    specialization: "Cardiology",
    gender: "Female",
    age: 39,
  },
  {
    name: "Dr. James Patel",
    email: "doctor2@hms.com",
    password: "Doctor@123",
    role: "doctor",
    phone: "+14445556666",
    specialization: "Neurology",
    gender: "Male",
    age: 43,
  },
];

export async function ensureDefaultUsers() {
  for (const userData of defaultUsers) {
    const existingUser = await User.findOne({ email: userData.email });

    if (!existingUser) {
      await User.create(userData);
      console.log(
        `Created default ${userData.role} account: ${userData.email}`,
      );
    }
  }
}
