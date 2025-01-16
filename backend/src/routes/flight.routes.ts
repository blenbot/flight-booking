import express from "express";
import { 
  getFlights,
  getFlightById,
  searchFlights 
} from "../controllers/flight.controller";

const router = express.Router();

router.get("/", getFlights);
router.get("/search", searchFlights);
router.get("/:id", getFlightById);

export default router;