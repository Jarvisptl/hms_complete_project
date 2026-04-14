import Appointment from "../models/Appointment.js";
import Bill from "../models/Bill.js";

function generateBillNo() {
  return `BILL-${Date.now()}`;
}

export async function createBill(req, res) {
  const { appointmentId, amount, description, notes, status } = req.body;

  if (!appointmentId || !amount || !description) {
    return res
      .status(400)
      .json({ message: "Appointment, amount, and description are required." });
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (appointment.status !== "Completed") {
    return res.status(400).json({
      message: "A bill can only be created after the appointment is completed.",
    });
  }

  const existingBill = await Bill.findOne({ appointmentId });
  if (existingBill) {
    return res.status(400).json({
      message: "A bill has already been created for this appointment.",
    });
  }

  const bill = await Bill.create({
    billNo: generateBillNo(),
    appointmentId,
    patientId: appointment.patientId,
    description,
    notes: notes || "",
    amount: Number(amount),
    status: status === "Paid" ? "Paid" : "Unpaid",
  });

  const populatedBill = await Bill.findById(bill._id)
    .populate("patientId", "name email")
    .populate({
      path: "appointmentId",
      populate: { path: "doctorId", select: "name specialization" },
    });

  res.status(201).json(populatedBill);
}

export async function getMyBills(req, res) {
  const bills = await Bill.find({ patientId: req.user._id })
    .populate("patientId", "name email")
    .populate({
      path: "appointmentId",
      populate: [
        { path: "doctorId", select: "name specialization" },
        { path: "patientId", select: "name email" },
      ],
    })
    .sort({ createdAt: -1 });
  res.json(bills);
}

export async function getAllBills(req, res) {
  const bills = await Bill.find()
    .populate("patientId", "name email")
    .populate({
      path: "appointmentId",
      populate: [
        { path: "doctorId", select: "name specialization" },
        { path: "patientId", select: "name email" },
      ],
    })
    .sort({ createdAt: -1 });
  res.json(bills);
}

export async function updateBillStatus(req, res) {
  const { status } = req.body;

  if (!["Paid", "Unpaid"].includes(status)) {
    return res.status(400).json({ message: "Invalid bill status." });
  }

  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ message: "Bill not found." });
  }

  bill.status = status;
  await bill.save();

  const populatedBill = await Bill.findById(bill._id)
    .populate("patientId", "name email")
    .populate({
      path: "appointmentId",
      populate: { path: "doctorId", select: "name specialization" },
    });

  res.json(populatedBill);
}
