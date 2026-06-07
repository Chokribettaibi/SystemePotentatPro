"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class UserRepository {
    static async findByEmail(email) {
        const [rows] = await db_1.default.query(`SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`, [email]);
        return rows.length > 0 ? rows[0] : null;
    }
    static async findById(id) {
        const [rows] = await db_1.default.query(`SELECT u.id, u.name, u.email, u.role_id, u.status, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`, [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    static async create(user) {
        const [result] = await db_1.default.query('INSERT INTO users (name, email, password, role_id, status) VALUES (?, ?, ?, ?, ?)', [user.name, user.email, user.password, user.role_id, user.status || 'ACTIVE']);
        return result.insertId;
    }
    static async listAll() {
        const [rows] = await db_1.default.query(`SELECT u.id, u.name, u.email, u.role_id, u.status, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id`);
        return rows;
    }
    static async listRoles() {
        const [rows] = await db_1.default.query('SELECT * FROM roles');
        return rows;
    }
}
exports.UserRepository = UserRepository;
