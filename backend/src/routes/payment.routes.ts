import express from 'express';
import { processPayment } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, processPayment);

export default router;