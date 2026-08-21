import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/orderController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Protected route to create order
router.post('/create', verifyToken, createOrder);

// Protected route to verify payment
router.post('/verify', verifyToken, verifyPayment);

export default router;
