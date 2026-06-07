"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class SettingsRepository {
    static async getSettings() {
        const [rows] = await db_1.default.query('SELECT key_name, key_value FROM settings');
        const settings = {};
        for (const row of rows) {
            settings[row.key_name] = row.key_value;
        }
        return settings;
    }
    static async updateSettings(settings) {
        const connection = await db_1.default.getConnection();
        await connection.beginTransaction();
        try {
            for (const [key, value] of Object.entries(settings)) {
                await connection.query(`INSERT INTO settings (key_name, key_value) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE key_value = ?`, [key, value, value]);
            }
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
}
exports.SettingsRepository = SettingsRepository;
