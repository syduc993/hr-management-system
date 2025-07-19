// Session management service
import BaseService from '../core/base-service.js';

class SessionService extends BaseService {
    constructor() {
        super();
        this.sessions = new Map();
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    createSession(user, req) {
        const sessionId = this.generateId('sess_');
        const sessionData = {
            id: sessionId,
            userId: user.id,
            user: user,
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        };

        this.sessions.set(sessionId, sessionData);
        return sessionData;
    }

    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // Check if session is expired
        const now = Date.now();
        const lastAccessed = new Date(session.lastAccessed).getTime();
        if (now - lastAccessed > this.sessionTimeout) {
            this.destroySession(sessionId);
            return null;
        }

        // Update last accessed
        session.lastAccessed = new Date().toISOString();
        this.sessions.set(sessionId, session);
        
        return session;
    }

    destroySession(sessionId) {
        return this.sessions.delete(sessionId);
    }

    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            const lastAccessed = new Date(session.lastAccessed).getTime();
            if (now - lastAccessed > this.sessionTimeout) {
                this.destroySession(sessionId);
            }
        }
    }

    getActiveSessions() {
        return Array.from(this.sessions.values());
    }

    getUserSessions(userId) {
        return Array.from(this.sessions.values()).filter(session => session.userId === userId);
    }
}

export default SessionService;
