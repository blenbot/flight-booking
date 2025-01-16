import express, { Request, Response } from 'express';
import { registerUser, loginUser, forgotPassword, resetPassword } from '../controllers/user.controller';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
	await registerUser(req, res);
});
router.post('/login', async (req: Request, res: Response) => {
	await loginUser(req, res);
});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


export default router;
