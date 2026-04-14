import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, unique: true },
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
    description: { type: String, required: true },
    notes: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
  },
  { timestamps: true },
);

export default mongoose.model("Bill", billSchema);
