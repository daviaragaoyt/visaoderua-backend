import { prisma } from '../lib/prisma';

export class ProductService {
  async listActiveProducts() {
    return prisma.product.findMany({
      where: {
        is_active: true,
        stock_quantity: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        stock_quantity: true,
        image_url: true,
        lens_color: true,
        frame_type: true,
      },
    });
  }
}
