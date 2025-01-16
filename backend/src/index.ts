import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin.routes";
import userRoutes from "./routes/user.routes";
import bookingRoutes from "./routes/booking.routes";
import flightRoutes from "./routes/flight.routes";
import paymentRoutes from './routes/payment.routes';

dotenv.config();

const app = express();


app.use(express.json());
app.use(cors());


app.get('/', (req, res) => {
  res.json({ message: "Welcome to Flight Booking API" });
});


app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/flights", flightRoutes);


app.use("/api/v1/payments", paymentRoutes);




app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
