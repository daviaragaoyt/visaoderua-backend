import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { z } from 'zod';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
    this.checkout = this.checkout.bind(this);
    this.getStatus = this.getStatus.bind(this);
  }

  async checkout(req: Request, res: Response) {
    try {
      const checkoutSchema = z.object({
        customer: z.object({
          name: z.string(),
          email: z.string().email(),
          cpf: z.string(),
          phone: z.string().optional(),
        }),
        address: z.object({
          street: z.string(),
          number: z.string(),
          complement: z.string().optional(),
          neighborhood: z.string(),
          city: z.string(),
          cep: z.string(),
        }),
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
        })),
        paymentMethod: z.enum(['PIX', 'CREDIT_CARD']),
        paymentData: z.any().optional(), // Token for credit card
      });

      const parsedData = checkoutSchema.parse(req.body);


      const result = await this.orderService.createOrder(parsedData);
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const status = await this.orderService.getOrderStatus(id);
      
      if (!status) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.status(200).json(status);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
