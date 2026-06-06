import pool from '../config/db';

export class CustomerRepository {
  static async listAll() {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    return rows;
  }

  static async findById(id: number) {
    const [rows]: any = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async create(customer: any) {
    const [result]: any = await pool.query(
      'INSERT INTO customers (name, email, phone, address, loyalty_points, balance) VALUES (?, ?, ?, ?, ?, ?)',
      [
        customer.name,
        customer.email || null,
        customer.phone || null,
        customer.address || null,
        customer.loyaltyPoints || 0,
        customer.balance || 0.00
      ]
    );
    return result.insertId;
  }

  static async update(id: number, customer: any) {
    await pool.query(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, loyalty_points = ?, balance = ? WHERE id = ?',
      [
        customer.name,
        customer.email || null,
        customer.phone || null,
        customer.address || null,
        customer.loyaltyPoints,
        customer.balance,
        id
      ]
    );
    return true;
  }

  static async getPurchaseHistory(customerId: number) {
    const [rows] = await pool.query(
      `SELECT id, invoice_number, sale_date, total_amount, paid_amount, payment_status, status 
       FROM sales 
       WHERE customer_id = ? 
       ORDER BY sale_date DESC`,
      [customerId]
    );
    return rows;
  }

  static async payDebt(customerId: number, amount: number, paymentMethod: string) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Deduct customer balance
      await connection.query(
        'UPDATE customers SET balance = GREATEST(0, balance - ?) WHERE id = ?',
        [amount, customerId]
      );

      // 2. Add standard payment log under the last partially-paid sale for tracking
      const [lastSale]: any = await connection.query(
        `SELECT id, invoice_number 
         FROM sales 
         WHERE customer_id = ? AND payment_status IN ('PARTIAL', 'UNPAID') 
         ORDER BY sale_date DESC LIMIT 1`,
        [customerId]
      );

      const saleId = lastSale.length > 0 ? lastSale[0].id : null;
      const notes = saleId 
        ? `Debt payment towards Invoice ${lastSale[0].invoice_number}` 
        : 'General debt payment';

      await connection.query(
        `INSERT INTO payments (sale_id, payment_method, amount, payment_date, notes)
         VALUES (?, ?, ?, NOW(), ?)`,
        [saleId, paymentMethod, amount, notes]
      );

      // 3. Update payment status of sales if balance became 0 (optional refinement)
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
