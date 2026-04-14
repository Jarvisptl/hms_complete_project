import Appointment from "../models/Appointment.js";
import Bill from "../models/Bill.js";
import MedicalRecord from "../models/MedicalRecord.js";
import User from "../models/User.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const ALLOWED_GENDERS = ["Male", "Female", "Other"];

function normalizePhone(phone) {
  const digitsOnly = String(phone || "").replace(/\D/g, "");
  if (!digitsOnly) return "";

  const localDigits =
    digitsOnly.length === 11 && digitsOnly.startsWith("1")
      ? digitsOnly.slice(1)
      : digitsOnly;

  if (!LOCAL_PHONE_REGEX.test(localDigits)) {
    return null;
  }

  return `+1${localDigits}`;
}

function getPhoneLookupVariants(phone) {
  if (!phone) return [];

  const digitsOnly = String(phone).replace(/\D/g, "");
  const localDigits =
    digitsOnly.length === 11 && digitsOnly.startsWith("1")
      ? digitsOnly.slice(1)
      : digitsOnly;

  return Array.from(
    new Set([phone, localDigits, `+1${localDigits}`, `1${localDigits}`]),
  );
}

export async function getAllUsers(req, res) {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
}

export async function getDoctors(req, res) {
  const doctors = await User.find({ role: "doctor" })
    .select("-password")
    .sort({ name: 1 });
  res.json(doctors);
}

export async function createDoctor(req, res) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const phoneInput = String(req.body.phone || "").trim();
  const phone = phoneInput ? normalizePhone(phoneInput) : "";
  const specialization = String(req.body.specialization || "").trim();
  const gender = String(req.body.gender || "").trim();
  const age = Number(req.body.age);

  if (
    !name ||
    !email ||
    !password ||
    !specialization ||
    !gender ||
    Number.isNaN(age)
  ) {
    return res.status(400).json({
      message:
        "Name, email, password, specialization, age, and gender are required.",
    });
  }

  if (name.length < 2) {
    return res
      .status(400)
      .json({ message: "Please enter a valid doctor name." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address." });
  }

  if (phoneInput && !phone) {
    return res.status(400).json({
      message:
        "Phone number must be exactly 10 digits. Country code +1 is added automatically.",
    });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    });
  }

  if (!Number.isInteger(age) || age < 21 || age > 100) {
    return res.status(400).json({
      message: "Doctor age must be between 21 and 100.",
    });
  }

  if (!ALLOWED_GENDERS.includes(gender)) {
    return res.status(400).json({ message: "Please select a valid gender." });
  }

  const phoneLookupVariants = getPhoneLookupVariants(phone);

  const duplicateUser = await User.findOne({
    $or: phone
      ? [{ email }, { phone: { $in: phoneLookupVariants } }]
      : [{ email }],
  });

  if (duplicateUser) {
    if (duplicateUser.email === email) {
      return res
        .status(400)
        .json({ message: "This email is already registered." });
    }

    if (phone && phoneLookupVariants.includes(duplicateUser.phone)) {
      return res
        .status(400)
        .json({ message: "This phone number is already registered." });
    }
  }

  const doctor = await User.create({
    name,
    email,
    password,
    phone,
    specialization,
    gender,
    age,
    role: "doctor",
  });

  res.status(201).json({
    _id: doctor._id,
    name: doctor.name,
    email: doctor.email,
    role: doctor.role,
    phone: doctor.phone,
    age: doctor.age,
    gender: doctor.gender,
    specialization: doctor.specialization,
  });
}

export async function getPatients(req, res) {
  if (req.user.role === "doctor") {
    const patientIds = await Appointment.find({
      doctorId: req.user._id,
    }).distinct("patientId");
    const patients = await User.find({
      _id: { $in: patientIds },
      role: "patient",
    })
      .select("-password")
      .sort({ name: 1 });
    return res.json(patients);
  }

  const patients = await User.find({ role: "patient" })
    .select("-password")
    .sort({ name: 1 });
  res.json(patients);
}

export async function deleteUser(req, res) {
  const userToDelete = await User.findById(req.params.id).select("-password");

  if (!userToDelete) {
    return res.status(404).json({ message: "User not found." });
  }

  if (userToDelete.role === "admin") {
    return res.status(400).json({
      message: "Admin accounts cannot be deleted from this panel.",
    });
  }

  if (userToDelete._id.toString() === req.user._id.toString()) {
    return res
      .status(400)
      .json({ message: "You cannot delete your own account." });
  }

  const relatedAppointments = await Appointment.find({
    $or: [{ patientId: userToDelete._id }, { doctorId: userToDelete._id }],
  }).select("_id");

  const appointmentIds = relatedAppointments.map(
    (appointment) => appointment._id,
  );

  if (appointmentIds.length) {
    await MedicalRecord.deleteMany({ appointmentId: { $in: appointmentIds } });
    await Bill.deleteMany({ appointmentId: { $in: appointmentIds } });
    await Appointment.deleteMany({ _id: { $in: appointmentIds } });
  }

  if (userToDelete.role === "patient") {
    await MedicalRecord.deleteMany({ patientId: userToDelete._id });
    await Bill.deleteMany({ patientId: userToDelete._id });
  }

  if (userToDelete.role === "doctor") {
    await MedicalRecord.deleteMany({ doctorId: userToDelete._id });
  }

  await User.findByIdAndDelete(userToDelete._id);

  res.json({
    message: `${userToDelete.role === "doctor" ? "Doctor" : "User"} deleted successfully.`,
  });
}

export async function getMyProfile(req, res) {
  res.json(req.user);
}

export async function changeMyPassword(req, res) {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current password and new password are required.",
    });
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password is incorrect." });
  }

  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    return res.status(400).json({
      message: "New password must be different from the current password.",
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password changed successfully." });
}

export async function updateMyProfile(req, res) {
  const updates = {};

  if (req.body.name !== undefined) {
    const name = String(req.body.name || "").trim();
    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Please enter a valid name." });
    }
    updates.name = name;
  }

  if (req.body.phone !== undefined) {
    const phoneInput = String(req.body.phone || "").trim();
    const phone = phoneInput ? normalizePhone(phoneInput) : "";

    if (phoneInput && !phone) {
      return res.status(400).json({
        message:
          "Phone number must be exactly 10 digits. Country code +1 is added automatically.",
      });
    }

    if (phone) {
      const existingPhoneUser = await User.findOne({
        phone: { $in: getPhoneLookupVariants(phone) },
        _id: { $ne: req.user._id },
      });

      if (existingPhoneUser) {
        return res
          .status(400)
          .json({ message: "This phone number is already registered." });
      }
    }

    updates.phone = phone;
  }

  if (req.body.age !== undefined) {
    const age = Number(req.body.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return res
        .status(400)
        .json({ message: "Age must be between 1 and 120." });
    }
    updates.age = age;
  }

  if (req.body.gender !== undefined) {
    const gender = String(req.body.gender || "").trim();
    if (gender && !ALLOWED_GENDERS.includes(gender)) {
      return res.status(400).json({ message: "Please select a valid gender." });
    }
    updates.gender = gender;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
  }).select("-password");
  res.json(user);
}
