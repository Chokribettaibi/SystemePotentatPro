"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRepository_1 = require("../repositories/userRepository");
const auditLogService_1 = require("../services/auditLogService");
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await userRepository_1.UserRepository.findByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            if (user.status !== 'ACTIVE') {
                return res.status(403).json({ success: false, message: 'Your account is deactivated' });
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password || '');
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            const secret = process.env.JWT_SECRET || 'potentat_pro_secret_key_2026_enterprise_pos';
            const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role_name, name: user.name }, secret, { expiresIn: expiresIn });
            // Log action
            await auditLogService_1.AuditLogService.log(user.id || null, 'USER_LOGIN', `User ${user.email} logged in successfully`, req.ip);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role_name
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async register(req, res, next) {
        try {
            const { name, email, password, roleId } = req.body;
            const existingUser = await userRepository_1.UserRepository.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(password, salt);
            const userId = await userRepository_1.UserRepository.create({
                name,
                email,
                password: hashedPassword,
                role_id: roleId,
                status: 'ACTIVE'
            });
            // Log action
            const actingUserId = req.user?.id || null;
            await auditLogService_1.AuditLogService.log(actingUserId, 'USER_REGISTER', `Registered new user: ${email} with role ID ${roleId}`, req.ip);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                userId
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getProfile(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const user = await userRepository_1.UserRepository.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.status(200).json({
                success: true,
                user
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getRoles(req, res, next) {
        try {
            const roles = await userRepository_1.UserRepository.listRoles();
            res.status(200).json({ success: true, roles });
        }
        catch (error) {
            next(error);
        }
    }
    static async getUsers(req, res, next) {
        try {
            const users = await userRepository_1.UserRepository.listAll();
            res.status(200).json({ success: true, users });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
