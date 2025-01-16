import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';
import { getAllUsers, getAllFlights, addFlight, updateFlight, deleteFlight } from '../controllers/admin.controller';

const router = Router();

// Apply middlewares to individual routes instead of using router.use()
router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);
router.get('/flights', authenticateToken, authorizeAdmin, getAllFlights);
router.post('/flights', authenticateToken, authorizeAdmin, addFlight);
router.put('/flights/:id', authenticateToken, authorizeAdmin, updateFlight);
router.delete('/flights/:id', authenticateToken, authorizeAdmin, deleteFlight);

export default router;
