// server/services/core/cache-service.js
class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map();
    }

    set(key, value, ttlMs = 300000) { // 5 minutes default
        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + ttlMs);
    }

    get(key) {
        const expiry = this.ttl.get(key);
        if (expiry && Date.now() > expiry) {
            this.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    delete(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
    }

    clear() {
        this.cache.clear();
        this.ttl.clear();
    }

    has(key) {
        const expiry = this.ttl.get(key);
        if (expiry && Date.now() > expiry) {
            this.delete(key);
            return false;
        }
        return this.cache.has(key);
    }

    size() {
        return this.cache.size;
    }

    cleanup() {
        const now = Date.now();
        for (const [key, expiry] of this.ttl.entries()) {
            if (now > expiry) {
                this.delete(key);
            }
        }
    }
}

export default new CacheService();
