import pool from '../config/db';

export class AuditLogService {
  static async log(userId: number | null, action: string, details: string, ipAddress?: string) {
    try {
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, action, details, ipAddress || null]
      );
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  static async getLogs(limit = 100, offset = 0) {
    const [rows]: any = await pool.query(
      `SELECT al.*, u.name as user_name, u.email as user_email, r.name as role_name 
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY al.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }
}
