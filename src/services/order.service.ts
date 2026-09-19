import { prisma } from '../lib/prisma';
import { paymentClient } from '../lib/mercadopago';
import { randomUUID } from 'crypto';

interface CheckoutData {
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone?: string;
  };
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    cep: string;
  };
  items: {
    productId: string;
    quantity: number;
  }[];
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  paymentData?: any;
}

/** Desconto aplicado a pagamentos via PIX. Deve bater com `site.pixDiscount` no front. */
const PIX_DISCOUNT_RATE = Number(process.env.PIX_DISCOUNT_RATE ?? '0.05');

const round2 = (n: number) => Math.round(n * 100) / 100;

export class OrderService {
  async createOrder(data: CheckoutData) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify products and stock
      let totalAmount = 0;
      const orderItems = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (!product.is_active) {
          throw new Error(`Product ${product.name} is not active`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        const unitPrice = Number(product.price);
        totalAmount += unitPrice * item.quantity;

        orderItems.push({
          product_id: product.id,
          quantity: item.quantity,
          unit_price: unitPrice,
        });
      }

      // 2. Create or Update Customer
      let customer = await tx.customer.findUnique({
        where: { email: data.customer.email }
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: data.customer.name,
            email: data.customer.email,
            cpf: data.customer.cpf,
            phone: data.customer.phone,
          }
        });
      }

      // 3. Create Address
      const address = await tx.address.create({
        data: {
          customer_id: customer.id,
          street: data.address.street,
          number: data.address.number,
          complement: data.address.complement,
          neighborhood: data.address.neighborhood,
          city: data.address.city,
          cep: data.address.cep,
        }
      });

      // 4. Create Order (desconto PIX calculado aqui, nunca confiado ao front)
      const orderNumber = `VR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const discountAmount = data.paymentMethod === 'PIX' ? round2(totalAmount * PIX_DISCOUNT_RATE) : 0;
      const amountToCharge = round2(totalAmount - discountAmount);

      const order = await tx.order.create({
        data: {
          order_number: orderNumber,
          customer_id: customer.id,
          address_id: address.id,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          payment_method: data.paymentMethod,
          status: 'PENDING',
          items: {
            create: orderItems,
          }
        }
      });

      // 5. Payment Processing
      let paymentResult: any = {};

      if (data.paymentMethod === 'PIX') {
        const paymentData = {
          transaction_amount: amountToCharge,
          description: `Pedido ${orderNumber} - Visão de Rua`,
          payment_method_id: 'pix',
          payer: {
            email: customer.email,
            first_name: customer.name.split(' ')[0],
            last_name: customer.name.split(' ').slice(1).join(' '),
            identification: {
              type: 'CPF',
              number: customer.cpf
            }
          },
          external_reference: order.id,
          // Expirar em 30 minutos
          date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };

        const mpPayment = await paymentClient.create({ body: paymentData, requestOptions: { idempotencyKey: randomUUID() } });
        
        await tx.order.update({
          where: { id: order.id },
          data: {
            payment_id: mpPayment.id?.toString(),
            pix_qr_code: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
            pix_copy_paste: mpPayment.point_of_interaction?.transaction_data?.qr_code,
          }
        });

        paymentResult = {
          qr_code_base64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
          qr_code: mpPayment.point_of_interaction?.transaction_data?.qr_code,
          ticket_url: mpPayment.point_of_interaction?.transaction_data?.ticket_url,
        };
      } else if (data.paymentMethod === 'CREDIT_CARD') {
         // Logic for Credit Card processing
         const mpPayment = await paymentClient.create({
            body: {
              transaction_amount: amountToCharge,
              token: data.paymentData?.token,
              description: `Pedido ${orderNumber} - Visão de Rua`,
              installments: data.paymentData?.installments || 1,
              payment_method_id: data.paymentData?.payment_method_id,
              issuer_id: data.paymentData?.issuer_id,
              payer: {
                email: customer.email,
                identification: {
                  type: 'CPF',
                  number: customer.cpf
                }
              },
              external_reference: order.id,
            },
            requestOptions: { idempotencyKey: randomUUID() }
         });

         await tx.order.update({
           where: { id: order.id },
           data: {
             payment_id: mpPayment.id?.toString(),
           }
         });

         paymentResult = {
           status: mpPayment.status,
           status_detail: mpPayment.status_detail,
         };
      }

      return {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        totalAmount,
        discountAmount,
        amountToCharge,
        paymentResult,
      };
    });
  }

  async getOrderStatus(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        payment_method: true,
        created_at: true,
      }
    });

    return order;
  }
}
