import { Router } from "express";
import {
  changeMyPassword,
  createDoctor,
  deleteUser,
  getAllUsers,
  getDoctors,
  getPatients,
  getMyProfile,
  updateMyProfile,
} from "../controllers/userController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);
router.put("/me/password", protect, changeMyPassword);
router.get("/doctors", protect, getDoctors);
router.post("/doctors", protect, authorize("admin"), createDoctor);
router.get("/patients", protect, authorize("doctor", "admin"), getPatients);
router.delete("/:id", protect, authorize("admin"), deleteUser);
router.get("/", protect, authorize("admin"), getAllUsers);

export default router;
