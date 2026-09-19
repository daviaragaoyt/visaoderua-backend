import { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';

export class WebhookController {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
    this.handlePaymentWebhook = this.handlePaymentWebhook.bind(this);
  }

  async handlePaymentWebhook(req: Request, res: Response) {
    try {
      // Mercado Pago sends action and data.id in the query or body depending on webhook type
      const paymentId = req.query['data.id'] || req.body?.data?.id;
      const topic = req.query.topic || req.body?.type;

      if ((topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated') && paymentId) {
        await this.webhookService.processPayment(paymentId as string);
      }

      // MP requires 200 OK fast
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
