import pool from '../config/db';

export class SettingsRepository {
  static async getSettings(): Promise<Record<string, string>> {
    const [rows]: any = await pool.query('SELECT key_name, key_value FROM settings');
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key_name] = row.key_value;
    }
    return settings;
  }

  static async updateSettings(settings: Record<string, string>): Promise<boolean> {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const [key, value] of Object.entries(settings)) {
        await connection.query(
          `INSERT INTO settings (key_name, key_value) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE key_value = ?`,
          [key, value, value]
        );
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
}
