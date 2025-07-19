// Authentication service
import BaseService from '../core/base-service.js';
import { users } from '../../config/database.js';

class AuthService extends BaseService {
    constructor() {
        super();
        this.activeSessions = new Map();
    }

    async validateCredentials(username, password) {
        const user = users[username];
        if (!user || user.password !== password) {
            throw new Error('Invalid credentials');
        }
        return user;
    }

    createSession(user) {
        const sessionData = {
            id: user.id,
            username: user.username,
            role: user.role,
            fullName: user.fullName,
            loginTime: new Date().toISOString()
        };
        
        this.activeSessions.set(user.id, sessionData);
        return sessionData;
    }

    validateSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }

    destroySession(sessionId) {
        return this.activeSessions.delete(sessionId);
    }

    async login(credentials) {
        const { username, password } = credentials;
        
        const user = await this.validateCredentials(username, password);
        const sessionData = this.createSession(user);
        
        return {
            success: true,
            user: sessionData,
            message: 'Login successful'
        };
    }

    async logout(sessionId) {
        const destroyed = this.destroySession(sessionId);
        return {
            success: destroyed,
            message: destroyed ? 'Logout successful' : 'Session not found'
        };
    }

    getActiveUsers() {
        return Array.from(this.activeSessions.values());
    }
}

export default AuthService;
