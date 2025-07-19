// Service factory for dependency injection
import { EmployeeService } from '../employee/index.js';
import { WorkHistoryService } from '../employee/index.js';
import { AttendanceService } from '../attendance/index.js';
import { RecruitmentService } from '../recruitment/index.js';
import { StoreService, PositionService } from '../master-data/index.js';
import { AuthService, SessionService } from '../auth/index.js';

class ServiceFactory {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }

    // Register a service class
    register(name, ServiceClass, singleton = true) {
        this.services.set(name, { ServiceClass, singleton });
    }

    // Get service instance
    get(name) {
        const serviceConfig = this.services.get(name);
        if (!serviceConfig) {
            throw new Error(`Service '${name}' not found`);
        }

        const { ServiceClass, singleton } = serviceConfig;

        if (singleton) {
            if (!this.singletons.has(name)) {
                this.singletons.set(name, new ServiceClass());
            }
            return this.singletons.get(name);
        }

        return new ServiceClass();
    }

    // Initialize all services
    async initialize() {
        for (const [name, config] of this.services.entries()) {
            const service = this.get(name);
            if (service.init && typeof service.init === 'function') {
                await service.init();
            }
        }
    }

    // Clear all singleton instances
    clear() {
        this.singletons.clear();
    }

    // Get all service names
    getServiceNames() {
        return Array.from(this.services.keys());
    }

    // Check if service exists
    has(name) {
        return this.services.has(name);
    }
}

// Create and configure the global service factory
const serviceFactory = new ServiceFactory();

// Register core services
serviceFactory.register('employee', EmployeeService, true);
serviceFactory.register('workHistory', WorkHistoryService, true);
serviceFactory.register('attendance', AttendanceService, true);
serviceFactory.register('recruitment', RecruitmentService, true);
serviceFactory.register('store', StoreService, true);
serviceFactory.register('position', PositionService, true);
serviceFactory.register('auth', AuthService, true);
serviceFactory.register('session', SessionService, true);

// Helper functions for common service access
export const getEmployeeService = () => serviceFactory.get('employee');
export const getWorkHistoryService = () => serviceFactory.get('workHistory');
export const getAttendanceService = () => serviceFactory.get('attendance');
export const getRecruitmentService = () => serviceFactory.get('recruitment');
export const getStoreService = () => serviceFactory.get('store');
export const getPositionService = () => serviceFactory.get('position');
export const getAuthService = () => serviceFactory.get('auth');
export const getSessionService = () => serviceFactory.get('session');

export default serviceFactory;
