import pool from '../config/db';

export interface UserDTO {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role_id: number;
  role_name?: string;
  status: string;
  created_at?: Date;
}

export class UserRepository {
  static async findByEmail(email: string): Promise<UserDTO | null> {
    const [rows]: any = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findById(id: number): Promise<UserDTO | null> {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.name, u.email, u.role_id, u.status, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async create(user: UserDTO): Promise<number> {
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password, role_id, status) VALUES (?, ?, ?, ?, ?)',
      [user.name, user.email, user.password, user.role_id, user.status || 'ACTIVE']
    );
    return result.insertId;
  }

  static async listAll(): Promise<UserDTO[]> {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.name, u.email, u.role_id, u.status, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id`
    );
    return rows;
  }

  static async listRoles(): Promise<any[]> {
    const [rows] = await pool.query('SELECT * FROM roles');
    return rows as any[];
  }
}
