import express from "express";
import { 
  getBookings, 
  createBooking, 
  cancelBooking, 
  getBookingDetails 
} from "../controllers/booking.controller";
import { authenticateToken, authorizeCustomer } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, authorizeCustomer, getBookings);
router.post("/", authenticateToken, authorizeCustomer, createBooking);
router.delete("/:id", authenticateToken, authorizeCustomer, cancelBooking);
router.get("/:id", authenticateToken, authorizeCustomer, getBookingDetails);

export default router;
