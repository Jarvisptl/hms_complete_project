import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    diagnosis: { type: String, default: "" },
    prescription: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("MedicalRecord", medicalRecordSchema);
