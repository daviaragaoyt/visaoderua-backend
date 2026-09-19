import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
    // Bind methods
    this.listProducts = this.listProducts.bind(this);
  }

  async listProducts(req: Request, res: Response) {
    try {
      const products = await this.productService.listActiveProducts();
      res.status(200).json(products);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
