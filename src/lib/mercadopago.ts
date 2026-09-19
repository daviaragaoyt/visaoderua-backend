import { MercadoPagoConfig, Payment } from 'mercadopago';

// Get your access token from the environment variable
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export const paymentClient = new Payment(client);
