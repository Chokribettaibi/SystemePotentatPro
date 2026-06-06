import pool from '../config/db';

export class ReportRepository {
  static async getDashboardStats() {
    // 1. Sales totals (Today, Week, Month, Year)
    const [todaySales]: any = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
       FROM sales 
       WHERE DATE(sale_date) = CURDATE() AND status = 'COMPLETED'`
    );
    const [weeklySales]: any = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
       FROM sales 
       WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = 'COMPLETED'`
    );
    const [monthlySales]: any = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
       FROM sales 
       WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'COMPLETED'`
    );
    const [annualSales]: any = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
       FROM sales 
       WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 365 DAY) AND status = 'COMPLETED'`
    );

    // 2. Profit and Cost of Goods Sold (COGS) in last 30 days
    // Revenue is sum of sale_items subtotals
    // COGS is sum of sale_items quantity * pv.cost_price
    const [profit30]: any = await pool.query(
      `SELECT 
         COALESCE(SUM(si.subtotal), 0) as revenue,
         COALESCE(SUM(si.quantity * pv.cost_price), 0) as cogs
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN product_variants pv ON si.variant_id = pv.id
       WHERE s.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND s.status = 'COMPLETED'`
    );

    const revenue = parseFloat(profit30[0].revenue);
    const cogs = parseFloat(profit30[0].cogs);
    const grossProfit = revenue - cogs;

    // 3. Expenses in last 30 days
    const [expenses30]: any = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const expenses = parseFloat(expenses30[0].total);
    const netProfit = grossProfit - expenses;

    // 4. Stock value (Cost value and Retail value)
    const [stockVal]: any = await pool.query(
      `SELECT 
         SUM(stock_quantity * cost_price) as cost_value,
         SUM(stock_quantity * retail_price) as retail_value,
         SUM(stock_quantity) as total_items
       FROM product_variants`
    );

    // 5. Low stock product count
    const [lowStockResult]: any = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM products p
       JOIN product_variants pv ON p.id = pv.product_id
       GROUP BY p.id, p.alert_quantity
       HAVING SUM(pv.stock_quantity) <= p.alert_quantity`
    );
    const lowStockCount = lowStockResult.length;

    // 6. Returns in last 30 days
    const [returnsResult]: any = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_refund), 0) as total 
       FROM returns 
       WHERE return_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    return {
      salesToday: {
        amount: parseFloat(todaySales[0].total),
        count: todaySales[0].count
      },
      salesWeekly: {
        amount: parseFloat(weeklySales[0].total),
        count: weeklySales[0].count
      },
      salesMonthly: {
        amount: parseFloat(monthlySales[0].total),
        count: monthlySales[0].count
      },
      salesAnnual: {
        amount: parseFloat(annualSales[0].total),
        count: annualSales[0].count
      },
      financials30Days: {
        revenue,
        cogs,
        grossProfit,
        expenses,
        netProfit,
        growthPercentage: 14.5 // Seeded growth mockup for representation
      },
      stockValue: {
        costValue: parseFloat(stockVal[0].cost_value || 0),
        retailValue: parseFloat(stockVal[0].retail_value || 0),
        totalItems: parseInt(stockVal[0].total_items || 0)
      },
      lowStockAlerts: lowStockCount,
      returns30Days: {
        count: returnsResult[0].count,
        totalRefund: parseFloat(returnsResult[0].total || 0)
      }
    };
  }

  static async getChartsData() {
    // 1. Monthly Revenue & Profit trends for the last 6 months
    const [monthlyTrends]: any = await pool.query(
      `SELECT 
         DATE_FORMAT(s.sale_date, '%b %Y') as month_label,
         SUM(si.subtotal) as revenue,
         SUM(si.quantity * pv.cost_price) as cogs
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN product_variants pv ON si.variant_id = pv.id
       WHERE s.sale_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND s.status = 'COMPLETED'
       GROUP BY DATE_FORMAT(s.sale_date, '%Y-%m'), DATE_FORMAT(s.sale_date, '%b %Y')
       ORDER BY DATE_FORMAT(s.sale_date, '%Y-%m') ASC`
    );

    const trends = monthlyTrends.map((t: any) => {
      const rev = parseFloat(t.revenue || 0);
      const cog = parseFloat(t.cogs || 0);
      return {
        month: t.month_label,
        revenue: rev,
        profit: rev - cog
      };
    });

    // 2. Best selling categories
    const [bestCategories]: any = await pool.query(
      `SELECT c.name as category_name, SUM(si.quantity) as units_sold, SUM(si.subtotal) as revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.status = 'COMPLETED'
       GROUP BY c.id, c.name
       ORDER BY units_sold DESC
       LIMIT 5`
    );

    // 3. Best selling products
    const [bestProducts]: any = await pool.query(
      `SELECT p.name as product_name, SUM(si.quantity) as units_sold, SUM(si.subtotal) as revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.status = 'COMPLETED'
       GROUP BY p.id, p.name
       ORDER BY units_sold DESC
       LIMIT 5`
    );

    // 4. Top Customers
    const [topCustomers]: any = await pool.query(
      `SELECT c.name as customer_name, COUNT(s.id) as visit_count, SUM(s.total_amount) as total_spent
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       WHERE s.status = 'COMPLETED' AND c.name != 'Walk-in Customer'
       GROUP BY c.id, c.name
       ORDER BY total_spent DESC
       LIMIT 5`
    );

    return {
      monthlyTrends: trends,
      bestCategories,
      bestProducts,
      topCustomers
    };
  }

  static async getSalesReport(startDate?: string, endDate?: string) {
    let query = `
      SELECT s.id, s.invoice_number, s.sale_date, s.total_amount, s.tax_amount, s.discount_amount, s.paid_amount, s.payment_status,
             c.name as customer_name, u.name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'COMPLETED'
    `;
    const params: any[] = [];
    if (startDate) {
      query += ` AND s.sale_date >= ?`;
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      query += ` AND s.sale_date <= ?`;
      params.push(`${endDate} 23:59:59`);
    }
    query += ` ORDER BY s.sale_date DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getExpensesReport(startDate?: string, endDate?: string) {
    let query = `
      SELECT e.*, u.name as employee_name 
      FROM expenses e
      JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (startDate) {
      query += ` AND e.expense_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND e.expense_date <= ?`;
      params.push(endDate);
    }
    query += ` ORDER BY e.expense_date DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getStockValueReport() {
    const [rows] = await pool.query(
      `SELECT p.name as product_name, pv.variant_name, pv.sku, pv.stock_quantity, pv.cost_price, pv.retail_price,
              (pv.stock_quantity * pv.cost_price) as total_cost_value,
              (pv.stock_quantity * pv.retail_price) as total_retail_value,
              c.name as category_name
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       ORDER BY pv.stock_quantity DESC`
    );
    return rows;
  }

  static async addExpense(expense: any, userId: number) {
    const [result]: any = await pool.query(
      `INSERT INTO expenses (category, amount, expense_date, notes, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [expense.category, expense.amount, expense.expenseDate, expense.notes || '', userId]
    );
    return result.insertId;
  }
}
