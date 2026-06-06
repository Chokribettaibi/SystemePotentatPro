import { Request, Response, NextFunction } from 'express';
import { SupplierRepository } from '../repositories/supplierRepository';
import { AuditLogService } from '../services/auditLogService';
import { AuthenticatedRequest } from '../middleware/auth';

export class SupplierController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await SupplierRepository.listAll();
      res.status(200).json({ success: true, suppliers });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const supplier = await SupplierRepository.findById(id);
      
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      res.status(200).json({ success: true, supplier });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const supplierId = await SupplierRepository.create(req.body);

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'SUPPLIER_CREATE',
        `Created supplier ${req.body.name} (ID: ${supplierId})`,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        supplierId
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await SupplierRepository.update(id, req.body);

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'SUPPLIER_UPDATE',
        `Updated supplier details for supplier ID ${id}`,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Supplier updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async createPurchase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const purchaseId = await SupplierRepository.createPurchase(req.body);

      // Audit Log
      await AuditLogService.log(
        req.user?.id || null,
        'PURCHASE_CREATE',
        `Created supplier purchase transaction ID ${purchaseId} ref ${req.body.referenceNo}`,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Stock purchase registered and inventory updated successfully',
        purchaseId
      });
    } catch (error) {
      next(error);
    }
  }

  static async listPurchases(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const purchases = await SupplierRepository.getPurchases(limit);
      res.status(200).json({ success: true, purchases });
    } catch (error) {
      next(error);
    }
  }

  static async getPurchaseHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const supplierId = parseInt(req.params.id);
      const history = await SupplierRepository.getPurchaseHistory(supplierId);
      res.status(200).json({ success: true, history });
    } catch (error) {
      next(error);
    }
  }
}
