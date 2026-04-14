import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

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

function formatUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    age: user.age,
    gender: user.gender,
    specialization: user.specialization,
  };
}

export async function register(req, res) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const phoneInput = String(req.body.phone || "").trim();
  const gender = String(req.body.gender || "").trim();
  const age = Number(req.body.age);
  const phone = normalizePhone(phoneInput);

  if (!name || !email || !password || !phone || !gender || Number.isNaN(age)) {
    return res.status(400).json({
      message: "Name, email, phone, age, gender, and password are required.",
    });
  }

  if (name.length < 2) {
    return res.status(400).json({ message: "Please enter a valid full name." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address." });
  }

  if (!phone) {
    return res.status(400).json({
      message:
        "Phone number must be exactly 10 digits. Country code +1 is added automatically.",
    });
  }

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    return res.status(400).json({ message: "Age must be between 1 and 120." });
  }

  if (!ALLOWED_GENDERS.includes(gender)) {
    return res.status(400).json({ message: "Please select a valid gender." });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    });
  }

  const phoneLookupVariants = getPhoneLookupVariants(phone);

  const existingUser = await User.findOne({
    $or: [{ email }, { phone: { $in: phoneLookupVariants } }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return res
        .status(400)
        .json({ message: "This email is already registered." });
    }

    if (phoneLookupVariants.includes(existingUser.phone)) {
      return res
        .status(400)
        .json({ message: "This phone number is already registered." });
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    age,
    gender,
    role: "patient",
  });

  res.status(201).json({
    token: generateToken(user._id),
    user: formatUser(user),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({
    token: generateToken(user._id),
    user: formatUser(user),
  });
}

export function logout(req, res) {
  res.json({ message: "Logged out successfully." });
}
