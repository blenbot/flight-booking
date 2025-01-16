import pool from '../db';

export interface Payment {
  id: number;
  booking_id: number;
  card_type: string;
  card_number: string;
  expiration_date: string;
  cvv: string;
  name_on_card: string;
  amount: number;
  created_at: Date;
}

export const PaymentModel = {
  create: async (payment: Omit<Payment, 'id' | 'created_at'>) => {
    const result = await pool.query(
      `INSERT INTO payment_details (
        booking_id, card_type, card_number, expiration_date, 
        cvv, name_on_card, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        payment.booking_id,
        payment.card_type,
        payment.card_number,
        payment.expiration_date,
        payment.cvv,
        payment.name_on_card,
        payment.amount
      ]
    );
    return result.rows[0];
  },

  findByBookingId: async (bookingId: number) => {
    const result = await pool.query(
      'SELECT * FROM payment_details WHERE booking_id = $1',
      [bookingId]
    );
    return result.rows[0];
  }
};