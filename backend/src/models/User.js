import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { normalizeUSPhone } from "../utils/phoneUtils.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    phone: { type: String, default: "", trim: true },
    age: { type: Number, default: 0 },
    gender: { type: String, default: "" },
    specialization: { type: String, default: "" },
  },
  { timestamps: true },
);

userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string", $ne: "" } },
  },
);

userSchema.pre("save", async function prepareUser(next) {
  if (this.isModified("phone")) {
    const normalizedPhone = normalizeUSPhone(this.phone);
    this.phone = normalizedPhone || "";
  }

  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre("findOneAndUpdate", function normalizePhoneInUpdate(next) {
  const update = this.getUpdate() || {};
  const phoneValue = update.phone ?? update.$set?.phone;

  if (phoneValue !== undefined) {
    const normalizedPhone = normalizeUSPhone(phoneValue);

    if (update.$set) {
      update.$set.phone = normalizedPhone || "";
    } else {
      update.phone = normalizedPhone || "";
    }

    this.setUpdate(update);
  }

  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
