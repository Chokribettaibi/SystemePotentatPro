"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
const productRepository_1 = require("./productRepository");
class SaleRepository {
    static async createSale(sale) {
        const connection = await db_1.default.getConnection();
        await connection.beginTransaction();
        try {
            // 1. Generate Invoice Number (Format: INV-YYYYMMDD-XXXX)
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const [countResult] = await connection.query("SELECT COUNT(*) as count FROM sales WHERE DATE(sale_date) = CURDATE()");
            const seq = (countResult[0].count + 1).toString().padStart(4, '0');
            const invoiceNumber = `INV-${dateStr}-${seq}`;
            // 2. Calculate totals
            let totalItemsCost = 0;
            for (const item of sale.items) {
                totalItemsCost += (item.unitPrice * item.quantity) - item.discountAmount;
            }
            const totalAmount = totalItemsCost + sale.taxAmount - sale.discountAmount;
            // Determine Payment Status
            let paymentStatus = 'PAID';
            if (sale.paidAmount === 0) {
                paymentStatus = 'UNPAID';
            }
            else if (sale.paidAmount < totalAmount) {
                paymentStatus = 'PARTIAL';
            }
            // 3. Create Sale
            const [saleResult] = await connection.query(`INSERT INTO sales (customer_id, user_id, invoice_number, sale_date, total_amount, tax_amount, discount_amount, paid_amount, payment_status, status, notes)
         VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, 'COMPLETED', ?)`, [
                sale.customerId || null,
                sale.userId,
                invoiceNumber,
                totalAmount,
                sale.taxAmount,
                sale.discountAmount,
                sale.paidAmount,
                paymentStatus,
                sale.notes || ''
            ]);
            const saleId = saleResult.insertId;
            // 4. Save items & Update Inventory
            for (const item of sale.items) {
                const itemSubtotal = (item.unitPrice * item.quantity) - item.discountAmount;
                // Insert sale_items record
                await connection.query(`INSERT INTO sale_items (sale_id, product_id, variant_id, quantity, unit_price, discount_amount, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                    saleId,
                    item.productId,
                    item.variantId,
                    item.quantity,
                    item.unitPrice,
                    item.discountAmount,
                    itemSubtotal
                ]);
                // Update inventory stock (Reduce stock automatically)
                if (item.variantId) {
                    await connection.query(`UPDATE product_variants 
             SET stock_quantity = stock_quantity - ? 
             WHERE id = ? AND product_id = ?`, [item.quantity, item.variantId, item.productId]);
                }
                // Handle IMEIs if provided
                if (item.imeis && item.imeis.length > 0) {
                    for (const imei of item.imeis) {
                        await connection.query(`UPDATE imeis_serials 
               SET status = 'SOLD' 
               WHERE value = ? AND product_id = ?`, [imei, item.productId]);
                    }
                }
                // Log Stock Movement
                await productRepository_1.ProductRepository.logStockMovement(connection, {
                    productId: item.productId,
                    variantId: item.variantId,
                    type: 'OUT',
                    quantity: item.quantity,
                    source: 'SALE',
                    referenceId: saleId,
                    description: `Sold via Invoice ${invoiceNumber}`
                });
            }
            // 5. Record payments
            for (const pay of sale.payments) {
                await connection.query(`INSERT INTO payments (sale_id, payment_method, amount, transaction_ref, payment_date, notes)
           VALUES (?, ?, ?, ?, NOW(), ?)`, [
                    saleId,
                    pay.paymentMethod,
                    pay.amount,
                    pay.transactionRef || null,
                    `Payment for invoice ${invoiceNumber}`
                ]);
            }
            // 6. Create Invoice record
            await connection.query(`INSERT INTO invoices (sale_id, invoice_number, invoice_date, total_amount, tax_amount, discount_amount, paid_amount, status)
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`, [
                saleId,
                invoiceNumber,
                totalAmount,
                sale.taxAmount,
                sale.discountAmount,
                sale.paidAmount,
                paymentStatus
            ]);
            // 7. Award loyalty points to customer
            if (sale.customerId) {
                // Simple setting lookup: 1 point per $1 spent on total amount
                const pointsEarned = Math.floor(totalAmount);
                await connection.query(`UPDATE customers 
           SET loyalty_points = loyalty_points + ? 
           WHERE id = ?`, [pointsEarned, sale.customerId]);
                // Track debt if payment status is UNPAID or PARTIAL
                if (paymentStatus === 'PARTIAL' || paymentStatus === 'UNPAID') {
                    const debtAmount = totalAmount - sale.paidAmount;
                    await connection.query(`UPDATE customers 
             SET balance = balance + ? 
             WHERE id = ?`, [debtAmount, sale.customerId]);
                }
            }
            await connection.commit();
            return { saleId, invoiceNumber, totalAmount };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async getSaleHistory(limit = 100) {
        const [rows] = await db_1.default.query(`SELECT s.*, c.name as customer_name, u.name as cashier_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       JOIN users u ON s.user_id = u.id
       ORDER BY s.sale_date DESC
       LIMIT ?`, [limit]);
        return rows;
    }
    static async getSaleDetails(saleId) {
        const [saleRows] = await db_1.default.query(`SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, u.name as cashier_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`, [saleId]);
        if (saleRows.length === 0)
            return null;
        const sale = saleRows[0];
        const [items] = await db_1.default.query(`SELECT si.*, p.name as product_name, pv.variant_name, p.sku as base_sku, pv.sku as variant_sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN product_variants pv ON si.variant_id = pv.id
       WHERE si.sale_id = ?`, [saleId]);
        const [payments] = await db_1.default.query(`SELECT * FROM payments WHERE sale_id = ?`, [saleId]);
        sale.items = items;
        sale.payments = payments;
        return sale;
    }
    static async getInvoice(saleId) {
        const [rows] = await db_1.default.query(`SELECT * FROM invoices WHERE sale_id = ?`, [saleId]);
        return rows.length > 0 ? rows[0] : null;
    }
}
exports.SaleRepository = SaleRepository;
