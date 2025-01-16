import pool from '../db';

export interface Booking {
    booking_id: number;
    user_id: number;
    flight_id: number;
    seats: number;
    total_price: number;
    status: 'confirmed' | 'cancelled';
    created_at: Date;
    updated_at: Date;
}

export class BookingModel {
    static async create(booking: Omit<Booking, 'booking_id' | 'created_at' | 'updated_at'>): Promise<Booking> {
        const result = await pool.query(
            `INSERT INTO bookings (
                user_id, flight_id, seats, total_price, status
            ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [booking.user_id, booking.flight_id, booking.seats, booking.total_price, booking.status]
        );
        return result.rows[0];
    }

    static async findById(booking_id: number): Promise<Booking | null> {
        const result = await pool.query(
            'SELECT * FROM bookings WHERE booking_id = $1',
            [booking_id]
        );
        return result.rows[0] || null;
    }

    static async findByUserId(user_id: number): Promise<Booking[]> {
        const result = await pool.query(
            'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
            [user_id]
        );
        return result.rows;
    }

    static async update(booking_id: number, data: Partial<Booking>): Promise<Booking | null> {
        const result = await pool.query(
            'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE booking_id = $2 RETURNING *',
            [data.status, booking_id]
        );
        return result.rows[0] || null;
    }

    static async cancel(booking_id: number): Promise<Booking | null> {
        const result = await pool.query(
            `UPDATE bookings 
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
             WHERE booking_id = $1 AND status = 'confirmed' 
             RETURNING *`,
            [booking_id]
        );
        return result.rows[0] || null;
    }
}

export default BookingModel;