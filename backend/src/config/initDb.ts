import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'potentat_user',
  password: process.env.DB_PASSWORD || 'potentat_secure_pass',
};

const DB_NAME = process.env.DB_NAME || 'potentat_db';

async function initializeDatabase() {
  let connection: any;
  try {
    console.log(`Connecting to MySQL at ${connectionConfig.host}:${connectionConfig.port}...`);
    connection = await mysql.createConnection(connectionConfig);

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`Database \`${DB_NAME}\` checked/created successfully.`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    // Helper to check table exists
    const checkTableExists = async (tableName: string): Promise<boolean> => {
      const [rows]: any = await connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
      `, [DB_NAME, tableName]);
      return rows[0].count > 0;
    };

    // Define and execute Table creation
    console.log('Creating tables...');

    // 1. Roles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2. Users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      ) ENGINE=InnoDB;
    `);

    // 3. Categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 4. Brands
    await connection.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 5. Suppliers
    await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 6. Products
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        barcode VARCHAR(50) DEFAULT NULL,
        qr_code VARCHAR(100) DEFAULT NULL,
        category_id INT NOT NULL,
        brand_id INT NOT NULL,
        cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        retail_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        alert_quantity INT DEFAULT 5,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        description TEXT,
        has_variants BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (brand_id) REFERENCES brands(id)
      ) ENGINE=InnoDB;
    `);

    // 7. Product Variants
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        variant_name VARCHAR(100) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        barcode VARCHAR(50) DEFAULT NULL,
        qr_code VARCHAR(100) DEFAULT NULL,
        cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        retail_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        stock_quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 8. IMEIs / Serials
    await connection.query(`
      CREATE TABLE IF NOT EXISTS imeis_serials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        variant_id INT DEFAULT NULL,
        type ENUM('IMEI', 'SERIAL') NOT NULL,
        value VARCHAR(100) UNIQUE NOT NULL,
        status ENUM('AVAILABLE', 'SOLD', 'RETURNED') DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // 9. Purchases
    await connection.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT NOT NULL,
        reference_no VARCHAR(100) UNIQUE NOT NULL,
        purchase_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      ) ENGINE=InnoDB;
    `);

    // 10. Purchase Items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT DEFAULT NULL,
        quantity INT NOT NULL,
        cost_price DECIMAL(10, 2) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // 11. Customers
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        loyalty_points INT DEFAULT 0,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 12. Sales
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT DEFAULT NULL,
        user_id INT NOT NULL,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        sale_date DATETIME NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID',
        status VARCHAR(50) DEFAULT 'COMPLETED',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

    // 13. Sale Items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT DEFAULT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0.00,
        subtotal DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // 14. Payments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT DEFAULT NULL,
        purchase_id INT DEFAULT NULL,
        payment_method VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        transaction_ref VARCHAR(100),
        payment_date DATETIME NOT NULL,
        notes TEXT,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 15. Returns
    await connection.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        user_id INT NOT NULL,
        return_date DATETIME NOT NULL,
        total_refund DECIMAL(10, 2) NOT NULL,
        type ENUM('WARRANTY', 'DAMAGED', 'STANDARD') NOT NULL DEFAULT 'STANDARD',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

    // 16. Return Items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT DEFAULT NULL,
        quantity INT NOT NULL,
        refund_amount DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // 17. Stock Movements
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        variant_id INT DEFAULT NULL,
        type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
        quantity INT NOT NULL,
        source ENUM('SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT') NOT NULL,
        reference_id INT DEFAULT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // 18. Expenses
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        expense_date DATE NOT NULL,
        notes TEXT,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

    // 19. Invoices
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        invoice_date DATETIME NOT NULL,
        due_date DATETIME,
        total_amount DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PAID',
        pdf_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 20. Settings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) UNIQUE NOT NULL,
        key_value TEXT NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 21. Audit Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        action VARCHAR(150) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    console.log('Tables verified/created successfully.');

    // Seed Data Setup
    console.log('Checking and seeding data...');

    // Seed Roles
    const [rolesCheck]: any = await connection.query('SELECT COUNT(*) as count FROM roles');
    if (rolesCheck[0].count === 0) {
      await connection.query(`
        INSERT INTO roles (name, description) VALUES
        ('Admin', 'Administrator with full system access'),
        ('Manager', 'Manager with access to inventory, reports and POS'),
        ('Cashier', 'Cashier with access to POS and returns'),
        ('Employee', 'Employee with standard view permissions');
      `);
      console.log('Seeded roles.');
    }

    // Seed Users
    const [usersCheck]: any = await connection.query('SELECT COUNT(*) as count FROM users');
    if (usersCheck[0].count === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123', salt);

      // Get role IDs
      const [adminRole]: any = await connection.query("SELECT id FROM roles WHERE name = 'Admin'");
      const [managerRole]: any = await connection.query("SELECT id FROM roles WHERE name = 'Manager'");
      const [cashierRole]: any = await connection.query("SELECT id FROM roles WHERE name = 'Cashier'");

      await connection.query(`
        INSERT INTO users (name, email, password, role_id, status) VALUES
        ('Admin User', 'admin@potentat.com', ?, ?, 'ACTIVE'),
        ('Manager User', 'manager@potentat.com', ?, ?, 'ACTIVE'),
        ('Cashier User', 'cashier@potentat.com', ?, ?, 'ACTIVE');
      `, [
        hashedPassword, adminRole[0].id,
        hashedPassword, managerRole[0].id,
        hashedPassword, cashierRole[0].id
      ]);
      console.log('Seeded default users (Password: Password123).');
    }

    // Seed Categories
    const [categoriesCheck]: any = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (categoriesCheck[0].count === 0) {
      const categories = [
        'Smartphones', 'Tablets', 'Smart Watches', 'Chargers', 
        'Fast Chargers', 'Power Banks', 'Earphones', 'Wireless Earbuds', 
        'Bluetooth Speakers', 'Phone Cases', 'Screen Protectors', 
        'Cables', 'Accessories', 'SIM Cards'
      ];
      for (const cat of categories) {
        await connection.query('INSERT INTO categories (name, description) VALUES (?, ?)', [cat, `${cat} category`]);
      }
      console.log('Seeded categories.');
    }

    // Seed Brands
    const [brandsCheck]: any = await connection.query('SELECT COUNT(*) as count FROM brands');
    if (brandsCheck[0].count === 0) {
      const brands = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'OnePlus', 'Anker', 'JBL', 'Baseus', 'Generic'];
      for (const brand of brands) {
        await connection.query('INSERT INTO brands (name, description) VALUES (?, ?)', [brand, `${brand} brand`]);
      }
      console.log('Seeded brands.');
    }

    // Seed Suppliers
    const [suppliersCheck]: any = await connection.query('SELECT COUNT(*) as count FROM suppliers');
    if (suppliersCheck[0].count === 0) {
      await connection.query(`
        INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES
        ('TechDistributors Corp', 'John Miller', 'sales@techdist.com', '+1-555-0199', '120 Technology Drive, San Jose, CA'),
        ('MobileWorld Wholesale', 'Sara Connor', 'wholesale@mobileworld.com', '+1-555-0188', '45 Industry Blvd, Dallas, TX'),
        ('AccessoryHub Ltd', 'David Chen', 'orders@accessoryhub.net', '+86-755-8888', 'Building B4, Futian District, Shenzhen, China');
      `);
      console.log('Seeded suppliers.');
    }

    // Seed Settings
    const [settingsCheck]: any = await connection.query('SELECT COUNT(*) as count FROM settings');
    if (settingsCheck[0].count === 0) {
      await connection.query(`
        INSERT INTO settings (key_name, key_value) VALUES
        ('store_name', 'Potentat Pro Store'),
        ('store_phone', '+1-555-POTENTAT'),
        ('store_email', 'contact@potentatpro.com'),
        ('store_address', '777 Futuristic Blvd, Suite 101, Cyber City'),
        ('currency_symbol', '$'),
        ('currency_code', 'USD'),
        ('tax_rate', '12.5'),
        ('logo_url', '/images/logo-neon.png'),
        ('loyalty_points_per_dollar', '1');
      `);
      console.log('Seeded store settings.');
    }

    // Seed Sample Products
    const [productsCheck]: any = await connection.query('SELECT COUNT(*) as count FROM products');
    if (productsCheck[0].count === 0) {
      // Get category and brand IDs
      const [phoneCat]: any = await connection.query("SELECT id FROM categories WHERE name = 'Smartphones'");
      const [chargerCat]: any = await connection.query("SELECT id FROM categories WHERE name = 'Fast Chargers'");
      const [earbudCat]: any = await connection.query("SELECT id FROM categories WHERE name = 'Wireless Earbuds'");

      const [appleBrand]: any = await connection.query("SELECT id FROM brands WHERE name = 'Apple'");
      const [samsungBrand]: any = await connection.query("SELECT id FROM brands WHERE name = 'Samsung'");
      const [ankerBrand]: any = await connection.query("SELECT id FROM brands WHERE name = 'Anker'");

      // Insert Apple iPhone 15 Pro (Has Variants)
      const [iphoneResult]: any = await connection.query(`
        INSERT INTO products (name, sku, barcode, qr_code, category_id, brand_id, cost_price, retail_price, alert_quantity, status, description, has_variants)
        VALUES ('iPhone 15 Pro', 'IPHONE15PRO', '190199123456', 'QR-IPH15P', ?, ?, 800.00, 999.00, 3, 'ACTIVE', 'Apple iPhone 15 Pro titanium finish', TRUE)
      `, [phoneCat[0].id, appleBrand[0].id]);
      const iphoneId = iphoneResult.insertId;

      // Variants
      await connection.query(`
        INSERT INTO product_variants (product_id, variant_name, sku, barcode, qr_code, cost_price, retail_price, stock_quantity)
        VALUES 
        (?, 'Natural Titanium 128GB', 'IPH15PRO-NT-128', '190199123457', 'QR-IPH15P-NT128', 800.00, 999.00, 10),
        (?, 'Blue Titanium 256GB', 'IPH15PRO-BT-256', '190199123458', 'QR-IPH15P-BT256', 900.00, 1099.00, 5);
      `, [iphoneId, iphoneId]);

      // Seed IMEIs
      const [varNT]: any = await connection.query("SELECT id FROM product_variants WHERE sku = 'IPH15PRO-NT-128'");
      await connection.query(`
        INSERT INTO imeis_serials (product_id, variant_id, type, value, status) VALUES
        (?, ?, 'IMEI', '358765109876541', 'AVAILABLE'),
        (?, ?, 'IMEI', '358765109876542', 'AVAILABLE'),
        (?, ?, 'IMEI', '358765109876543', 'AVAILABLE')
      `, [iphoneId, varNT[0].id]);

      // Insert Samsung Galaxy S24 Ultra (No Variants for simplicity, or with variants)
      const [s24Result]: any = await connection.query(`
        INSERT INTO products (name, sku, barcode, qr_code, category_id, brand_id, cost_price, retail_price, alert_quantity, status, description, has_variants)
        VALUES ('Galaxy S24 Ultra', 'S24ULTRA', '8806091234567', 'QR-S24U', ?, ?, 950.00, 1199.00, 2, 'ACTIVE', 'Samsung Galaxy S24 Ultra AI Smartphone', FALSE)
      `, [phoneCat[0].id, samsungBrand[0].id]);
      const s24Id = s24Result.insertId;

      // Single Variant mapping for stock if no variants
      await connection.query(`
        INSERT INTO product_variants (product_id, variant_name, sku, barcode, qr_code, cost_price, retail_price, stock_quantity)
        VALUES (?, 'Standard Black 256GB', 'S24ULTRA-BK-256', '8806091234567', 'QR-S24U', 950.00, 1199.00, 8)
      `, [s24Id]);

      // Insert Anker Nano Charger
      const [chargerResult]: any = await connection.query(`
        INSERT INTO products (name, sku, barcode, qr_code, category_id, brand_id, cost_price, retail_price, alert_quantity, status, description, has_variants)
        VALUES ('Anker Nano II 65W', 'ANKERNANO65W', '848061023456', 'QR-ANKN65', ?, ?, 15.00, 29.99, 10, 'ACTIVE', 'Anker GaN II fast wall charger 65W', FALSE)
      `, [chargerCat[0].id, ankerBrand[0].id]);
      const chargerId = chargerResult.insertId;

      await connection.query(`
        INSERT INTO product_variants (product_id, variant_name, sku, barcode, qr_code, cost_price, retail_price, stock_quantity)
        VALUES (?, 'Standard White', 'ANKERNANO65W-WHT', '848061023456', 'QR-ANKN65', 15.00, 29.99, 50)
      `, [chargerId]);

      // Seed Initial Stock Movements
      console.log('Seeded sample products with stock.');
    }

    // Seed default Customer
    const [customersCheck]: any = await connection.query('SELECT COUNT(*) as count FROM customers');
    if (customersCheck[0].count === 0) {
      await connection.query(`
        INSERT INTO customers (name, email, phone, address, loyalty_points, balance) VALUES
        ('Walk-in Customer', 'walkin@potentat.com', 'N/A', 'N/A', 0, 0.00),
        ('John Doe', 'john.doe@gmail.com', '+1-555-0123', '456 Elm St, Metropia', 120, 0.00),
        ('Alice Smith', 'alice@example.com', '+1-555-9876', '789 Oak Ave, Forestville', 50, 150.00);
      `);
      console.log('Seeded customers.');
    }

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
