import { Request, Response } from 'express';
import pool from '../db';
import BookingModel from '../models/booking.model';

export async function getBookings(req: Request, res: Response): Promise<void> {
    try {
        const user_id = (req as any).user.id;
        const bookings = await BookingModel.findByUserId(user_id);
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

export async function bookFlight(req: Request, res: Response): Promise<void> {
    const user_id = (req as any).user.id;
    const { flight_id, seats } = req.body;

    try {
        const flightResult = await pool.query(
            'SELECT price FROM flights WHERE flight_id = $1',
            [flight_id]
        );

        if (flightResult.rows.length === 0) {
            res.status(404).json({ message: "Flight not found" });
            return;
        }

        const total_price = flightResult.rows[0].price * seats;

        const booking = await BookingModel.create({
            user_id,
            flight_id,
            seats,
            total_price,
            status: 'confirmed'
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

export async function createBooking(req: Request, res: Response): Promise<void> {
  const { flight_id, seats } = req.body;
  const user_id = (req as any).user.id;

  if (!flight_id || !seats || seats <= 0) {
    res.status(400).json({ message: "Invalid booking details" });
    return;
  }

  try {
    const flightCheck = await pool.query(
      "SELECT flight_id, available_seats, price FROM flights WHERE flight_id = $1 AND deleted_at IS NULL",
      [flight_id]
    );

    if (flightCheck.rows.length === 0) {
      res.status(404).json({ message: "Flight not found" });
      return;
    }

    if (flightCheck.rows[0].available_seats < seats) {
      res.status(400).json({ message: "Not enough seats available" });
      return;
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Create booking record
      const bookingResult = await pool.query(
        `INSERT INTO bookings (user_id, flight_id, seats, total_price, status, created_at) 
         VALUES ($1, $2, $3, $4, 'confirmed', CURRENT_TIMESTAMP) 
         RETURNING *`,
        [user_id, flight_id, seats, flightCheck.rows[0].price * seats]
      );

      // Update available seats
      await pool.query(
        `UPDATE flights 
         SET available_seats = available_seats - $1,
             updated_at = CURRENT_TIMESTAMP 
         WHERE flight_id = $2 AND available_seats >= $1`,
        [seats, flight_id]
      );

      await pool.query('COMMIT');

      res.status(201).json({
        message: "Booking successful",
        booking: {
          ...bookingResult.rows[0],
          total_amount: flightCheck.rows[0].price * seats
        }
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      error: "Failed to create booking",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export async function cancelBooking(req: Request, res: Response): Promise<void> {
  const booking_id = parseInt(req.params.id);
  const user_id = (req as any).user.id;

  try {
      await pool.query('BEGIN');

      try {
          const bookingResult = await pool.query(
              'SELECT * FROM bookings WHERE booking_id = $1 AND user_id = $2',
              [booking_id, user_id]
          );

          if (bookingResult.rows.length === 0) {
              res.status(404).json({ message: "Booking not found" });
              return;
          }

          const booking = bookingResult.rows[0];

          if (booking.user_id !== user_id) {
              res.status(403).json({ message: "Not authorized to cancel this booking" });
              return;
          }

          const cancelledBooking = await pool.query(
              `UPDATE bookings 
               SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
               WHERE booking_id = $1 AND status = 'confirmed' 
               RETURNING *`,
              [booking_id]
          );

          await pool.query(
              `UPDATE flights 
               SET available_seats = available_seats + $1,
                   updated_at = CURRENT_TIMESTAMP 
               WHERE flight_id = $2`,
              [booking.seats, booking.flight_id]
          );

          await pool.query('COMMIT');
          
          res.status(200).json(cancelledBooking.rows[0]);
      } catch (error) {
          await pool.query('ROLLBACK');
          throw error;
      }
  } catch (error) {
      res.status(500).json({ error: (error as Error).message });
  }
}

export async function getBookingDetails(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user_id = (req as any).user.id;

  try {
    const result = await pool.query(
      `SELECT b.*, f.flight_number, f.departure, f.arrival, f.date 
       FROM bookings b 
       JOIN flights f ON b.flight_id = f.flight_id 
       WHERE b.booking_id = $1 AND b.user_id = $2`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}