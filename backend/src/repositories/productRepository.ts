import pool from '../config/db';
import { Pool, PoolConnection } from 'mysql2/promise';

export interface ProductFilter {
  categoryId?: number;
  brandId?: number;
  search?: string;
  lowStockOnly?: boolean;
}

export class ProductRepository {
  static async listProducts(filters: ProductFilter = {}) {
    let query = `
      SELECT p.*, c.name as category_name, b.name as brand_name,
             (SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = p.id) as total_stock
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(filters.categoryId);
    }
    if (filters.brandId) {
      query += ` AND p.brand_id = ?`;
      params.push(filters.brandId);
    }
    if (filters.search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.qr_code LIKE ?)`;
      const searchWild = `%${filters.search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild);
    }

    const [rows]: any = await pool.query(query, params);

    // Apply low stock filter in JS/SQL
    let products = rows;
    if (filters.lowStockOnly) {
      products = rows.filter((p: any) => (p.total_stock || 0) <= p.alert_quantity);
    }

    // Fetch variants for each product
    for (const p of products) {
      const [variants]: any = await pool.query(
        'SELECT * FROM product_variants WHERE product_id = ?',
        [p.id]
      );
      p.variants = variants;
    }

    return products;
  }

  static async findById(id: number) {
    const [products]: any = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN brands b ON p.brand_id = b.id
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) return null;
    const product = products[0];

    const [variants]: any = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = ?',
      [id]
    );
    product.variants = variants;

    const [imeis]: any = await pool.query(
      'SELECT * FROM imeis_serials WHERE product_id = ? AND status = "AVAILABLE"',
      [id]
    );
    product.imeis = imeis;

    return product;
  }

  static async findBySkuOrBarcode(code: string) {
    // 1. Check in variants first
    const [variantRows]: any = await pool.query(
      `SELECT pv.*, p.name as product_name, p.has_variants, p.category_id, p.brand_id
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       WHERE pv.sku = ? OR pv.barcode = ? OR pv.qr_code = ?`,
      [code, code, code]
    );

    if (variantRows.length > 0) {
      return {
        type: 'variant',
        data: variantRows[0]
      };
    }

    // 2. Check in products base
    const [productRows]: any = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN brands b ON p.brand_id = b.id
       WHERE p.sku = ? OR p.barcode = ? OR p.qr_code = ?`,
      [code, code, code]
    );

    if (productRows.length > 0) {
      const product = productRows[0];
      const [variants]: any = await pool.query(
        'SELECT * FROM product_variants WHERE product_id = ?',
        [product.id]
      );
      product.variants = variants;
      return {
        type: 'product',
        data: product
      };
    }

    // 3. Check by IMEI/Serial
    const [imeiRows]: any = await pool.query(
      `SELECT iser.*, p.name as product_name, pv.variant_name, pv.retail_price, pv.cost_price
       FROM imeis_serials iser
       JOIN products p ON iser.product_id = p.id
       LEFT JOIN product_variants pv ON iser.variant_id = pv.id
       WHERE iser.value = ? AND iser.status = 'AVAILABLE'`,
      [code]
    );

    if (imeiRows.length > 0) {
      return {
        type: 'imei',
        data: imeiRows[0]
      };
    }

    return null;
  }

  static async createProduct(productData: any) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [prodResult]: any = await connection.query(
        `INSERT INTO products (name, sku, barcode, qr_code, category_id, brand_id, cost_price, retail_price, alert_quantity, status, description, has_variants)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productData.name,
          productData.sku,
          productData.barcode || null,
          productData.qrCode || null,
          productData.categoryId,
          productData.brandId,
          productData.costPrice,
          productData.retailPrice,
          productData.alertQuantity || 5,
          'ACTIVE',
          productData.description || '',
          productData.hasVariants || false
        ]
      );

      const productId = prodResult.insertId;

      // Handle variants
      if (productData.hasVariants && productData.variants && productData.variants.length > 0) {
        for (const variant of productData.variants) {
          const [varResult]: any = await connection.query(
            `INSERT INTO product_variants (product_id, variant_name, sku, barcode, qr_code, cost_price, retail_price, stock_quantity)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              variant.variantName,
              variant.sku,
              variant.barcode || null,
              variant.qrCode || null,
              variant.costPrice,
              variant.retailPrice,
              variant.stockQuantity || 0
            ]
          );

          // Add initial stock movements
          if (variant.stockQuantity > 0) {
            await connection.query(
              `INSERT INTO stock_movements (product_id, variant_id, type, quantity, source, description)
               VALUES (?, ?, 'IN', ?, 'ADJUSTMENT', 'Initial variant stock setup')`,
              [productId, varResult.insertId, variant.stockQuantity]
            );
          }
        }
      } else {
        // Create standard default variant representing the single product pricing and stock
        const [varResult]: any = await connection.query(
          `INSERT INTO product_variants (product_id, variant_name, sku, barcode, qr_code, cost_price, retail_price, stock_quantity)
           VALUES (?, 'Standard', ?, ?, ?, ?, ?, ?)`,
          [
            productId,
            productData.sku,
            productData.barcode || null,
            productData.qrCode || null,
            productData.costPrice,
            productData.retailPrice,
            0 // Starting stock is 0, will increase on purchase or adjustments
          ]
        );

        // Seed initial IMEIs if supplied for a single product model
        if (productData.imeis && productData.imeis.length > 0) {
          const defaultVariantId = varResult.insertId;
          for (const imei of productData.imeis) {
            await connection.query(
              `INSERT INTO imeis_serials (product_id, variant_id, type, value, status)
               VALUES (?, ?, 'IMEI', ?, 'AVAILABLE')`,
              [productId, defaultVariantId, imei]
            );
          }

          // Update stock qty
          await connection.query(
            `UPDATE product_variants SET stock_quantity = ? WHERE id = ?`,
            [productData.imeis.length, defaultVariantId]
          );

          // Log stock movement
          await connection.query(
            `INSERT INTO stock_movements (product_id, variant_id, type, quantity, source, description)
             VALUES (?, ?, 'IN', ?, 'ADJUSTMENT', 'Initial stock IMEI tracking')`,
            [productId, defaultVariantId, productData.imeis.length]
          );
        }
      }

      await connection.commit();
      return productId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateProduct(id: number, productData: any) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `UPDATE products 
         SET name = ?, category_id = ?, brand_id = ?, cost_price = ?, retail_price = ?, alert_quantity = ?, description = ?, status = ?
         WHERE id = ?`,
        [
          productData.name,
          productData.categoryId,
          productData.brandId,
          productData.costPrice,
          productData.retailPrice,
          productData.alertQuantity,
          productData.description || '',
          productData.status || 'ACTIVE',
          id
        ]
      );

      // Handle variants update if provided
      if (productData.variants && productData.variants.length > 0) {
        for (const variant of productData.variants) {
          if (variant.id) {
            // Update existing variant
            await connection.query(
              `UPDATE product_variants 
               SET variant_name = ?, sku = ?, barcode = ?, qr_code = ?, cost_price = ?, retail_price = ?, stock_quantity = ?
               WHERE id = ? AND product_id = ?`,
              [
                variant.variantName,
                variant.sku,
                variant.barcode || null,
                variant.qrCode || null,
                variant.costPrice,
                variant.retailPrice,
                variant.stockQuantity,
                variant.id,
                id
              ]
            );
          } else {
            // Create new variant
            const [varResult]: any = await connection.query(
              `INSERT INTO product_variants (product_id, variant_name, sku, barcode, qr_code, cost_price, retail_price, stock_quantity)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                variant.variantName,
                variant.sku,
                variant.barcode || null,
                variant.qrCode || null,
                variant.costPrice,
                variant.retailPrice,
                variant.stockQuantity || 0
              ]
            );

            if (variant.stockQuantity > 0) {
              await connection.query(
                `INSERT INTO stock_movements (product_id, variant_id, type, quantity, source, description)
                 VALUES (?, ?, 'IN', ?, 'ADJUSTMENT', 'Added new variant stock')`,
                [id, varResult.insertId, variant.stockQuantity]
              );
            }
          }
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async logStockMovement(connection: PoolConnection | Pool, movement: {
    productId: number;
    variantId: number | null;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    source: 'SALE' | 'PURCHASE' | 'RETURN' | 'ADJUSTMENT';
    referenceId?: number;
    description: string;
  }) {
    await connection.query(
      `INSERT INTO stock_movements (product_id, variant_id, type, quantity, source, reference_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        movement.productId,
        movement.variantId,
        movement.type,
        movement.quantity,
        movement.source,
        movement.referenceId || null,
        movement.description
      ]
    );
  }

  static async getStockMovements(productId?: number, limit = 50) {
    let query = `
      SELECT sm.*, p.name as product_name, pv.variant_name 
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN product_variants pv ON sm.variant_id = pv.id
    `;
    const params: any[] = [];
    if (productId) {
      query += ` WHERE sm.product_id = ?`;
      params.push(productId);
    }
    query += ` ORDER BY sm.created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async listCategories() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  }

  static async listBrands() {
    const [rows] = await pool.query('SELECT * FROM brands ORDER BY name ASC');
    return rows;
  }
}
