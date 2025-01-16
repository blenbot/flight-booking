import { Request, Response } from "express";
import pool from "../db";

export async function getFlights(req: Request, res: Response): Promise<void> {
  const { page = 1, limit = 10, sort = 'departure_time', order = 'ASC' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const result = await pool.query(
      `SELECT * FROM flights 
       WHERE deleted_at IS NULL 
       ORDER BY ${sort} ${order} 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM flights WHERE deleted_at IS NULL"
    );

    res.status(200).json({
      flights: result.rows,
      total: parseInt(countResult.rows[0].count),
      currentPage: page,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getFlightById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM flights WHERE flight_id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: "Flight not found" });
      return;
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function searchFlights(req: Request, res: Response): Promise<void> {
  const { source, destination, date, price_min, price_max } = req.query;
  try {
    let query = `
      SELECT * FROM flights 
      WHERE deleted_at IS NULL
    `;
    const params: any[] = [];
    let paramCounter = 1;

    if (source) {
      query += ` AND source ILIKE $${paramCounter}`;
      params.push(`%${source}%`);
      paramCounter++;
    }

    if (destination) {
      query += ` AND destination ILIKE $${paramCounter}`;
      params.push(`%${destination}%`);
      paramCounter++;
    }

    if (date) {
      query += ` AND DATE(departure_time) = $${paramCounter}`;
      params.push(date);
      paramCounter++;
    }

    if (price_min) {
      query += ` AND price >= $${paramCounter}`;
      params.push(price_min);
      paramCounter++;
    }

    if (price_max) {
      query += ` AND price <= $${paramCounter}`;
      params.push(price_max);
    }

    query += ` ORDER BY departure_time`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
