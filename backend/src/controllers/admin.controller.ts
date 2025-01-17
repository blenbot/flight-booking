import { Request, Response, NextFunction } from "express";
import pool from "../db";


export async function addFlight(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      airline_name, 
      source, 
      destination, 
      departure_time, 
      arrival_time, 
      total_seats, 
      price 
    } = req.body;

    // Validate required fields
    if (!airline_name || !source || !destination || !departure_time || !arrival_time || !total_seats || !price) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Validate date formats
    const departureDate = new Date(departure_time);
    const arrivalDate = new Date(arrival_time);

    if (departureDate >= arrivalDate) {
      res.status(400).json({ message: "Departure time must be before arrival time" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO flights (
        airline_name,
        source,
        destination,
        departure_time,
        arrival_time,
        total_seats,
        available_seats,
        price,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        airline_name,
        source,
        destination,
        departure_time,
        arrival_time,
        total_seats,
        total_seats, // Initially available_seats equals total_seats
        price,
        'scheduled' // Default status
      ]
    );

    res.status(201).json({ 
      message: "Flight added successfully", 
      flight: result.rows[0] 
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFlight(req: Request, res: Response): Promise<void> {
  // Verify admin role
  if ((req as any).user.role !== 'admin') {
    res.status(403).json({ message: "Access denied: Admin only" });
    return;
  }

  const { id } = req.params;
  const { 
    airline_name, 
    source, 
    destination, 
    departure_time, 
    arrival_time, 
    total_seats, 
    price 
  } = req.body;

  // Validate input data
  if (!airline_name || !source || !destination || !departure_time || !arrival_time || !total_seats || !price) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  // Validate business rules
  if (departure_time >= arrival_time) {
    res.status(400).json({ message: "Departure time must be before arrival time" });
    return;
  }

  if (price <= 0 || total_seats <= 0) {
    res.status(400).json({ message: "Price and seats must be positive numbers" });
    return;
  }

  try {
    await pool.query('BEGIN');

    // Check current bookings
    const bookingCheck = await pool.query(
      "SELECT COUNT(*) as booking_count FROM bookings WHERE flight_id = $1",
      [id]
    );

    if (parseInt(bookingCheck.rows[0].booking_count) > total_seats) {
      await pool.query('ROLLBACK');
      res.status(400).json({ 
        message: "Cannot reduce seats below current booking count" 
      });
      return;
    }

    const result = await pool.query(
      `UPDATE flights 
       SET airline_name = $1, 
           source = $2, 
           destination = $3, 
           departure_time = $4, 
           arrival_time = $5, 
           total_seats = $6, 
           price = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE flight_id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [airline_name, source, destination, departure_time, arrival_time, total_seats, price, id]
    );

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      res.status(404).json({ message: "Flight not found or already deleted" });
      return;
    }

    await pool.query('COMMIT');
    res.status(200).json({ 
      message: "Flight updated successfully", 
      flight: result.rows[0] 
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error updating flight:", error);
    res.status(500).json({ 
      error: "Error updating flight",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export async function deleteFlight(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM flights WHERE flight_id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Flight not found" });
      return;
    }

    res.status(200).json({ message: "Flight deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getAllFlights(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      "SELECT * FROM flights WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    // Return array of flights directly
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const query = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    if (!result.rows) {
      throw new Error('No users found');
    }

    console.log("Users found:", result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      message: "Failed to fetch users",
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
}
