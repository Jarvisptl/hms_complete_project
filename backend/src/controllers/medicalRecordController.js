import Appointment from "../models/Appointment.js";
import MedicalRecord from "../models/MedicalRecord.js";

const VALID_STATUSES = ["Pending", "Completed", "Cancelled"];

export async function upsertMedicalRecord(req, res) {
  const {
    appointmentId,
    diagnosis,
    prescription,
    notes,
    status = "Completed",
  } = req.body;

  if (!appointmentId) {
    return res.status(400).json({ message: "Appointment is required." });
  }

  if (!diagnosis && !prescription && !notes) {
    return res
      .status(400)
      .json({ message: "Add at least one medical note before saving." });
  }

  const appointment = await Appointment.findById(appointmentId)
    .populate("patientId", "name email phone age gender")
    .populate("doctorId", "name specialization email");

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (appointment.doctorId._id.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({
        message: "You can only update records for your own appointments.",
      });
  }

  const record = await MedicalRecord.findOneAndUpdate(
    { appointmentId },
    {
      appointmentId,
      patientId: appointment.patientId._id,
      doctorId: req.user._id,
      diagnosis: diagnosis || "",
      prescription: prescription || "",
      notes: notes || "",
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
    .populate("patientId", "name email phone age gender")
    .populate("doctorId", "name specialization email")
    .populate("appointmentId");

  if (VALID_STATUSES.includes(status)) {
    appointment.status = status;
    await appointment.save();
  }

  res.json(record);
}

export async function getPatientMedicalRecords(req, res) {
  const { patientId } = req.params;

  if (req.user.role === "patient" && req.user._id.toString() !== patientId) {
    return res
      .status(403)
      .json({ message: "You can only view your own medical records." });
  }

  const filter = { patientId };
  if (req.user.role === "doctor") {
    filter.doctorId = req.user._id;
  }

  const records = await MedicalRecord.find(filter)
    .populate("patientId", "name email phone age gender")
    .populate("doctorId", "name specialization email")
    .populate("appointmentId")
    .sort({ createdAt: -1 });

  res.json(records);
}

export async function getMyMedicalRecords(req, res) {
  const records = await MedicalRecord.find({ patientId: req.user._id })
    .populate("patientId", "name email phone age gender")
    .populate("doctorId", "name specialization email")
    .populate("appointmentId")
    .sort({ createdAt: -1 });

  res.json(records);
}
