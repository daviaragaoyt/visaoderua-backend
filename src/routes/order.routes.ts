import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const orderController = new OrderController();

router.post('/checkout', orderController.checkout);
router.get('/:id/status', orderController.getStatus);

export default router;
