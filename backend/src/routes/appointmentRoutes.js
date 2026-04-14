import { Router } from "express";
import {
  createAppointment,
  getAllAppointments,
  getAvailableSlots,
  getDoctorAppointments,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/availability",
  protect,
  authorize("patient", "doctor", "admin"),
  getAvailableSlots,
);
router.post("/", protect, authorize("patient"), createAppointment);
router.get("/my", protect, authorize("patient"), getMyAppointments);
router.get("/doctor", protect, authorize("doctor"), getDoctorAppointments);
router.get("/", protect, authorize("admin"), getAllAppointments);
router.patch(
  "/:id/status",
  protect,
  authorize("doctor", "admin"),
  updateAppointmentStatus,
);

export default router;
