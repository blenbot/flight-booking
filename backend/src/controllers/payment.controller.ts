import { Request, Response } from 'express';
import { PaymentModel } from '../models/payment.model';

export async function processPayment(req: Request, res: Response): Promise<void> {
  const { booking_id, card_type, card_number, expiration_date, cvv, name_on_card, amount } = req.body;

  try {
    const payment = await PaymentModel.create({
      booking_id,
      card_type,
      card_number,
      expiration_date,
      cvv,
      name_on_card,
      amount
    });

    res.status(201).json({
      message: "Payment processed successfully",
      payment: {
        id: payment.id,
        booking_id: payment.booking_id,
        amount: payment.amount,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Payment processing failed",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}