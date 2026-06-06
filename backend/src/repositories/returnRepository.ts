import pool from '../config/db';
import { ProductRepository } from './productRepository';

export interface ReturnItemDTO {
  productId: number;
  variantId: number | null;
  quantity: number;
  refundAmount: number;
  imeis?: string[];
}

export interface ReturnDTO {
  saleId: number;
  userId: number;
  type: 'WARRANTY' | 'DAMAGED' | 'STANDARD';
  items: ReturnItemDTO[];
  notes?: string;
}

export class ReturnRepository {
  static async createReturn(ret: ReturnDTO) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Calculate total refund
      const totalRefund = ret.items.reduce((sum, item) => sum + item.refundAmount, 0);

      // 2. Insert into returns table
      const [returnResult]: any = await connection.query(
        `INSERT INTO returns (sale_id, user_id, return_date, total_refund, type, notes)
         VALUES (?, ?, NOW(), ?, ?, ?)`,
        [ret.saleId, ret.userId, totalRefund, ret.type, ret.notes || '']
      );
      const returnId = returnResult.insertId;

      // 3. Process items
      for (const item of ret.items) {
        await connection.query(
          `INSERT INTO return_items (return_id, product_id, variant_id, quantity, refund_amount)
           VALUES (?, ?, ?, ?, ?)`,
          [returnId, item.productId, item.variantId, item.quantity, item.refundAmount]
        );

        // Standard and Warranty returns restore stock. Damaged items do not increment active sellable stock.
        if (ret.type !== 'DAMAGED' && item.variantId) {
          await connection.query(
            `UPDATE product_variants 
             SET stock_quantity = stock_quantity + ? 
             WHERE id = ? AND product_id = ?`,
            [item.quantity, item.variantId, item.productId]
          );
        }

        // Handle IMEIs if specified
        if (item.imeis && item.imeis.length > 0) {
          for (const imei of item.imeis) {
            // Restore status
            const newStatus = ret.type === 'DAMAGED' ? 'RETURNED' : 'AVAILABLE';
            await connection.query(
              `UPDATE imeis_serials 
               SET status = ? 
               WHERE value = ? AND product_id = ?`,
              [newStatus, imei, item.productId]
            );
          }
        }

        // Log Stock Movement
        await ProductRepository.logStockMovement(connection, {
          productId: item.productId,
          variantId: item.variantId,
          type: 'IN',
          quantity: item.quantity,
          source: 'RETURN',
          referenceId: returnId,
          description: `Product returned (Type: ${ret.type}) for return transaction #${returnId}`
        });
      }

      // 4. Update the Customer Loyalty points / balance if applicable
      const [saleRow]: any = await connection.query("SELECT customer_id FROM sales WHERE id = ?", [ret.saleId]);
      if (saleRow.length > 0 && saleRow[0].customer_id) {
        const customerId = saleRow[0].customer_id;
        
        // Deduct points earned for this return
        const pointsToDeduct = Math.floor(totalRefund);
        await connection.query(
          `UPDATE customers 
           SET loyalty_points = GREATEST(0, loyalty_points - ?) 
           WHERE id = ?`,
          [pointsToDeduct, customerId]
        );

        // Adjust customer balance / debt if customer has outstanding debt
        const [custRow]: any = await connection.query("SELECT balance FROM customers WHERE id = ?", [customerId]);
        if (custRow.length > 0 && custRow[0].balance > 0) {
          const refundAppliedToDebt = Math.min(custRow[0].balance, totalRefund);
          await connection.query(
            `UPDATE customers 
             SET balance = balance - ? 
             WHERE id = ?`,
            [refundAppliedToDebt, customerId]
          );
        }
      }

      await connection.commit();
      return returnId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getReturnHistory(limit = 100) {
    const [rows]: any = await pool.query(
      `SELECT r.*, s.invoice_number, u.name as cashier_name
       FROM returns r
       JOIN sales s ON r.sale_id = s.id
       JOIN users u ON r.user_id = u.id
       ORDER BY r.return_date DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  static async getReturnDetails(returnId: number) {
    const [returnRows]: any = await pool.query(
      `SELECT r.*, s.invoice_number, s.sale_date, u.name as cashier_name
       FROM returns r
       JOIN sales s ON r.sale_id = s.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [returnId]
    );

    if (returnRows.length === 0) return null;
    const returnTx = returnRows[0];

    const [items]: any = await pool.query(
      `SELECT ri.*, p.name as product_name, pv.variant_name
       FROM return_items ri
       JOIN products p ON ri.product_id = p.id
       LEFT JOIN product_variants pv ON ri.variant_id = pv.id
       WHERE ri.return_id = ?`,
      [returnId]
    );

    returnTx.items = items;
    return returnTx;
  }
}
