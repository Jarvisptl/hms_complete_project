import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import { ensureDefaultUsers } from "./utils/ensureDefaultUsers.js";
import { repairUserPhones } from "./utils/repairUserPhones.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Hospital Management System API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/medical-records", medicalRecordRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error occurred." });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await ensureDefaultUsers();
    await repairUserPhones();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
