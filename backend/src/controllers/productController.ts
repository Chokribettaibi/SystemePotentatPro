import { Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../repositories/productRepository';
import { AuditLogService } from '../services/auditLogService';
import { AuthenticatedRequest } from '../middleware/auth';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const brandId = req.query.brandId ? parseInt(req.query.brandId as string) : undefined;
      const search = req.query.search as string | undefined;
      const lowStockOnly = req.query.lowStock === 'true';

      const products = await ProductRepository.listProducts({
        categoryId,
        brandId,
        search,
        lowStockOnly
      });

      res.status(200).json({ success: true, products });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const product = await ProductRepository.findById(id);
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.status(200).json({ success: true, product });
    } catch (error) {
      next(error);
    }
  }

  static async lookupProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Scan code is required' });
      }

      const lookup = await ProductRepository.findBySkuOrBarcode(code);
      if (!lookup) {
        return res.status(404).json({ success: false, message: 'No product or variant found matching the code' });
      }

      res.status(200).json({ success: true, match: lookup });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const productId = await ProductRepository.createProduct(req.body);

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'PRODUCT_CREATE',
        `Created product ${req.body.name} (SKU: ${req.body.sku}) with ID ${productId}`,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        productId
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await ProductRepository.updateProduct(id, req.body);

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'PRODUCT_UPDATE',
        `Updated product details for product ID ${id}`,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Product updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ProductRepository.listCategories();
      res.status(200).json({ success: true, categories });
    } catch (error) {
      next(error);
    }
  }

  static async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await ProductRepository.listBrands();
      res.status(200).json({ success: true, brands });
    } catch (error) {
      next(error);
    }
  }

  static async getStockMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const movements = await ProductRepository.getStockMovements(productId);
      res.status(200).json({ success: true, movements });
    } catch (error) {
      next(error);
    }
  }
}
