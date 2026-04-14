import { Router } from "express";
import {
  getMyMedicalRecords,
  getPatientMedicalRecords,
  upsertMedicalRecord,
} from "../controllers/medicalRecordController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", protect, authorize("doctor"), upsertMedicalRecord);
router.get("/my", protect, authorize("patient"), getMyMedicalRecords);
router.get(
  "/patient/:patientId",
  protect,
  authorize("doctor", "admin", "patient"),
  getPatientMedicalRecords,
);

export default router;
