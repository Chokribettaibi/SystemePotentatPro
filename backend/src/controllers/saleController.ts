import { Response, NextFunction } from 'express';
import { SaleRepository } from '../repositories/saleRepository';
import { AuditLogService } from '../services/auditLogService';
import { AuthenticatedRequest } from '../middleware/auth';

export class SaleController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Cashier user authentication missing' });
      }

      const saleData = {
        ...req.body,
        userId
      };

      const result = await SaleRepository.createSale(saleData);

      // Audit Log
      await AuditLogService.log(
        userId,
        'SALE_CREATE',
        `Completed sale. Invoice: ${result.invoiceNumber}, Total: $${result.totalAmount.toFixed(2)}`,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Sale completed successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const sales = await SaleRepository.getSaleHistory(limit);
      res.status(200).json({ success: true, sales });
    } catch (error) {
      next(error);
    }
  }

  static async getDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const saleId = parseInt(req.params.id);
      const sale = await SaleRepository.getSaleDetails(saleId);

      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale transaction not found' });
      }

      res.status(200).json({ success: true, sale });
    } catch (error) {
      next(error);
    }
  }

  static async getReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const saleId = parseInt(req.params.id);
      const sale = await SaleRepository.getSaleDetails(saleId);

      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }

      // Simple mock receipt PDF path or data structure
      res.status(200).json({
        success: true,
        receipt: {
          storeName: 'Potentat Pro Store',
          address: '777 Futuristic Blvd, Suite 101, Cyber City',
          phone: '+1-555-POTENTAT',
          invoiceNumber: sale.invoice_number,
          saleDate: sale.sale_date,
          cashier: sale.cashier_name,
          customer: sale.customer_name || 'Walk-in Customer',
          items: sale.items.map((item: any) => ({
            name: item.product_name,
            variant: item.variant_name,
            quantity: item.quantity,
            price: parseFloat(item.unit_price),
            subtotal: parseFloat(item.subtotal)
          })),
          taxAmount: parseFloat(sale.tax_amount),
          discountAmount: parseFloat(sale.discount_amount),
          totalAmount: parseFloat(sale.total_amount),
          paidAmount: parseFloat(sale.paid_amount),
          balanceDue: parseFloat(sale.total_amount) - parseFloat(sale.paid_amount),
          payments: sale.payments
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
