import User from "../models/User.js";
import { normalizeUSPhone } from "./phoneUtils.js";

export async function repairUserPhones() {
  const users = await User.find()
    .select("_id email phone createdAt")
    .sort({ createdAt: 1, _id: 1 });

  const seenPhones = new Set();
  const operations = [];

  for (const user of users) {
    const currentPhone = String(user.phone || "").trim();
    if (!currentPhone) continue;

    const normalizedPhone = normalizeUSPhone(currentPhone);

    if (!normalizedPhone) {
      operations.push({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { phone: "" } },
        },
      });
      continue;
    }

    if (seenPhones.has(normalizedPhone)) {
      operations.push({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { phone: "" } },
        },
      });
      continue;
    }

    seenPhones.add(normalizedPhone);

    if (currentPhone !== normalizedPhone) {
      operations.push({
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { phone: normalizedPhone } },
        },
      });
    }
  }

  if (operations.length) {
    await User.bulkWrite(operations);
    console.log(
      `Phone normalization applied to ${operations.length} user record(s).`,
    );
  }
}
