import { Router } from "express";
import {
  createBill,
  getAllBills,
  getMyBills,
  updateBillStatus,
} from "../controllers/billController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", protect, authorize("admin"), createBill);
router.get("/my", protect, authorize("patient"), getMyBills);
router.get("/", protect, authorize("admin"), getAllBills);
router.patch("/:id/status", protect, authorize("admin"), updateBillStatus);

export default router;
