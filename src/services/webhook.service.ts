import { prisma } from '../lib/prisma';
import { paymentClient } from '../lib/mercadopago';

export class WebhookService {
  async processPayment(paymentId: string) {
    // 1. Get payment details from Mercado Pago
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment || !payment.external_reference) {
      return;
    }

    const orderId = payment.external_reference;

    // 2. Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      console.error(`Order ${orderId} not found for payment ${paymentId}`);
      return;
    }

    // 3. Process status
    if (payment.status === 'approved' && order.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        // Update order status to PAID
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PAID' }
        });

        // Deduct stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.product_id },
            data: {
              stock_quantity: {
                decrement: item.quantity
              }
            }
          });
        }
        
        // Log ou agendamento de expedição pode ser feito aqui
        console.log(`Order ${orderId} payment approved. Scheduled for delivery in 4 business days.`);
      });
    } else if (payment.status === 'cancelled' || payment.status === 'rejected') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });
    }
  }
}
