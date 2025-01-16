import express, { Request, Response } from 'express';
import { registerUser, loginUser, forgotPassword, resetPassword, updateUserProfile, deleteUser } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
	await registerUser(req, res);
});
router.post('/login', async (req: Request, res: Response) => {
	await loginUser(req, res);
});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profile', authenticateToken, updateUserProfile);
router.delete('/profile', authenticateToken, deleteUser);

export default router;
