"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
const productRepository_1 = require("./productRepository");
class SupplierRepository {
    static async listAll() {
        const [rows] = await db_1.default.query('SELECT * FROM suppliers ORDER BY name ASC');
        return rows;
    }
    static async findById(id) {
        const [rows] = await db_1.default.query('SELECT * FROM suppliers WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    static async create(supplier) {
        const [result] = await db_1.default.query('INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES (?, ?, ?, ?, ?)', [
            supplier.name,
            supplier.contactName || null,
            supplier.email || null,
            supplier.phone || null,
            supplier.address || null
        ]);
        return result.insertId;
    }
    static async update(id, supplier) {
        await db_1.default.query('UPDATE suppliers SET name = ?, contact_name = ?, email = ?, phone = ?, address = ? WHERE id = ?', [
            supplier.name,
            supplier.contactName || null,
            supplier.email || null,
            supplier.phone || null,
            supplier.address || null,
            id
        ]);
        return true;
    }
    static async getPurchaseHistory(supplierId) {
        const [rows] = await db_1.default.query(`SELECT * FROM purchases WHERE supplier_id = ? ORDER BY purchase_date DESC`, [supplierId]);
        return rows;
    }
    static async createPurchase(purchase) {
        const connection = await db_1.default.getConnection();
        await connection.beginTransaction();
        try {
            // 1. Calculate total purchase cost
            const totalAmount = purchase.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
            // Payment status
            let paymentStatus = 'PAID';
            if (purchase.paidAmount === 0) {
                paymentStatus = 'UNPAID';
            }
            else if (purchase.paidAmount < totalAmount) {
                paymentStatus = 'PARTIAL';
            }
            // 2. Insert purchase record
            const [purchResult] = await connection.query(`INSERT INTO purchases (supplier_id, reference_no, purchase_date, status, total_amount, paid_amount, payment_status, notes)
         VALUES (?, ?, ?, 'COMPLETED', ?, ?, ?, ?)`, [
                purchase.supplierId,
                purchase.referenceNo,
                purchase.purchaseDate,
                totalAmount,
                purchase.paidAmount,
                paymentStatus,
                purchase.notes || ''
            ]);
            const purchaseId = purchResult.insertId;
            // 3. Process items and increase stock automatically
            for (const item of purchase.items) {
                const itemTotal = item.costPrice * item.quantity;
                await connection.query(`INSERT INTO purchase_items (purchase_id, product_id, variant_id, quantity, cost_price, total_amount)
           VALUES (?, ?, ?, ?, ?, ?)`, [
                    purchaseId,
                    item.productId,
                    item.variantId,
                    item.quantity,
                    item.costPrice,
                    itemTotal
                ]);
                // Update product variant stock (Increase stock automatically)
                if (item.variantId) {
                    await connection.query(`UPDATE product_variants 
             SET stock_quantity = stock_quantity + ?, cost_price = ?
             WHERE id = ? AND product_id = ?`, [item.quantity, item.costPrice, item.variantId, item.productId]);
                }
                // Add IMEIs if supplied
                if (item.imeis && item.imeis.length > 0) {
                    for (const imei of item.imeis) {
                        await connection.query(`INSERT INTO imeis_serials (product_id, variant_id, type, value, status)
               VALUES (?, ?, 'IMEI', ?, 'AVAILABLE')
               ON DUPLICATE KEY UPDATE status = 'AVAILABLE'`, [item.productId, item.variantId, imei]);
                    }
                }
                // Log Stock Movement
                await productRepository_1.ProductRepository.logStockMovement(connection, {
                    productId: item.productId,
                    variantId: item.variantId,
                    type: 'IN',
                    quantity: item.quantity,
                    source: 'PURCHASE',
                    referenceId: purchaseId,
                    description: `Stock replenished from Supplier purchase ref ${purchase.referenceNo}`
                });
            }
            // 4. Record payment log
            if (purchase.paidAmount > 0) {
                await connection.query(`INSERT INTO payments (purchase_id, payment_method, amount, payment_date, notes)
           VALUES (?, 'BANK_TRANSFER', ?, NOW(), ?)`, [
                    purchaseId,
                    purchase.paidAmount,
                    `Payment for purchase ref ${purchase.referenceNo}`
                ]);
            }
            await connection.commit();
            return purchaseId;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async getPurchases(limit = 100) {
        const [rows] = await db_1.default.query(`SELECT p.*, s.name as supplier_name 
       FROM purchases p 
       JOIN suppliers s ON p.supplier_id = s.id 
       ORDER BY p.purchase_date DESC 
       LIMIT ?`, [limit]);
        return rows;
    }
}
exports.SupplierRepository = SupplierRepository;
