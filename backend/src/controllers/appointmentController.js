import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

const VALID_STATUSES = ["Pending", "Completed", "Cancelled"];
const WORKING_HOURS = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  "11:30 AM - 12:00 PM",
  "01:00 PM - 01:30 PM",
  "01:30 PM - 02:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:00 PM - 03:30 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
  "04:30 PM - 05:00 PM",
];
const HOLIDAY_MONTH_DAYS = new Set(["01-01", "07-01", "12-25", "12-26"]);

function parseLocalDate(dateString) {
  const [year, month, day] = String(dateString || "")
    .split("-")
    .map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPastDate(dateString) {
  const appointmentDate = parseLocalDate(dateString);
  if (!appointmentDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointmentDate.setHours(0, 0, 0, 0);
  return appointmentDate < today;
}

function isHolidayDate(dateString) {
  const appointmentDate = parseLocalDate(dateString);
  if (!appointmentDate) return false;

  const dayOfWeek = appointmentDate.getDay();
  const month = String(appointmentDate.getMonth() + 1).padStart(2, "0");
  const day = String(appointmentDate.getDate()).padStart(2, "0");
  return (
    dayOfWeek === 0 ||
    dayOfWeek === 6 ||
    HOLIDAY_MONTH_DAYS.has(`${month}-${day}`)
  );
}

async function buildSlotAvailability(doctorId, appointmentDate) {
  const existingAppointments = await Appointment.find({
    doctorId,
    appointmentDate,
    status: { $ne: "Cancelled" },
  }).select("timeSlot -_id");

  const takenSlots = new Set(existingAppointments.map((item) => item.timeSlot));
  const isHoliday = isHolidayDate(appointmentDate);

  return {
    isHoliday,
    slots: WORKING_HOURS.map((slot) => {
      const slotTaken = takenSlots.has(slot);
      return {
        label: slot,
        available: !isHoliday && !slotTaken,
        reason: isHoliday
          ? "Hospital closed"
          : slotTaken
            ? "Already booked"
            : "Available",
      };
    }),
  };
}

export async function getAvailableSlots(req, res) {
  const doctorId = String(req.query.doctorId || "").trim();
  const appointmentDate = String(req.query.appointmentDate || "").trim();

  if (!doctorId || !appointmentDate) {
    return res.status(400).json({
      message:
        "Doctor and appointment date are required to view available slots.",
    });
  }

  const doctor = await User.findOne({ _id: doctorId, role: "doctor" }).select(
    "_id name specialization",
  );

  if (!doctor) {
    return res.status(404).json({ message: "Selected doctor was not found." });
  }

  if (isPastDate(appointmentDate)) {
    return res.status(400).json({
      message: "Please choose today or a future date.",
      isHoliday: false,
      slots: [],
    });
  }

  const availability = await buildSlotAvailability(doctorId, appointmentDate);

  res.json({
    ...availability,
    doctor,
    workingHours: WORKING_HOURS,
  });
}

export async function createAppointment(req, res) {
  const doctorId = String(req.body.doctorId || "").trim();
  const appointmentDate = String(req.body.appointmentDate || "").trim();
  const timeSlot = String(req.body.timeSlot || "").trim();
  const reason = String(req.body.reason || "").trim();

  if (!doctorId || !appointmentDate || !timeSlot || !reason) {
    return res
      .status(400)
      .json({ message: "Doctor, date, time slot, and reason are required." });
  }

  const doctor = await User.findOne({ _id: doctorId, role: "doctor" }).select(
    "_id name specialization",
  );
  if (!doctor) {
    return res.status(404).json({ message: "Selected doctor was not found." });
  }

  if (isPastDate(appointmentDate)) {
    return res
      .status(400)
      .json({ message: "Please choose today or a future date." });
  }

  if (isHolidayDate(appointmentDate)) {
    return res.status(400).json({
      message:
        "Appointments are unavailable on weekends and hospital holidays.",
    });
  }

  if (!WORKING_HOURS.includes(timeSlot)) {
    return res.status(400).json({
      message:
        "Please choose a valid working-hour time slot from the dropdown.",
    });
  }

  const availability = await buildSlotAvailability(doctorId, appointmentDate);
  const selectedSlot = availability.slots.find(
    (slot) => slot.label === timeSlot,
  );

  if (!selectedSlot?.available) {
    return res.status(409).json({
      message:
        "This time slot is no longer available. Please choose another slot.",
    });
  }

  const existingAppointment = await Appointment.findOne({
    doctorId,
    appointmentDate,
    timeSlot,
    status: { $ne: "Cancelled" },
  });

  if (existingAppointment) {
    return res.status(409).json({
      message:
        "This doctor is already booked for the selected date and time slot.",
    });
  }

  const appointment = await Appointment.create({
    patientId: req.user._id,
    doctorId,
    appointmentDate,
    timeSlot,
    reason,
    status: "Pending",
  });

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("patientId", "name email phone age gender")
    .populate("doctorId", "name specialization email");

  res.status(201).json(populatedAppointment);
}

export async function getMyAppointments(req, res) {
  const appointments = await Appointment.find({ patientId: req.user._id })
    .populate("doctorId", "name specialization email")
    .sort({ createdAt: -1 });
  res.json(appointments);
}

export async function getDoctorAppointments(req, res) {
  const appointments = await Appointment.find({ doctorId: req.user._id })
    .populate("patientId", "name email phone age gender")
    .sort({ createdAt: -1 });
  res.json(appointments);
}

export async function getAllAppointments(req, res) {
  const appointments = await Appointment.find()
    .populate("patientId", "name email phone")
    .populate("doctorId", "name specialization email")
    .sort({ createdAt: -1 });
  res.json(appointments);
}

export async function updateAppointmentStatus(req, res) {
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid appointment status." });
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (
    req.user.role === "doctor" &&
    appointment.doctorId.toString() !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ message: "You can only update appointments assigned to you." });
  }

  appointment.status = status;
  await appointment.save();

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("patientId", "name email phone age gender")
    .populate("doctorId", "name specialization email");

  res.json(populatedAppointment);
}
