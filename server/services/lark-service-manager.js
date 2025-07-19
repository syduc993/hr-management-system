// server/services/lark-service-manager.js
import { EmployeeService, WorkHistoryService } from './employees/index.js';
import { AttendanceService } from './attendance/index.js';
import { RecruitmentService } from './recruitment/index.js';
import { StoreService, PositionService } from './master-data/index.js';
import { AuthService, SessionService } from './auth/index.js';
import { validateLarkConfig } from '../config/lark-config.js';

class LarkServiceManager {
    constructor() {
        this.services = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing Lark Service Manager...');
            
            // Validate configuration first
            validateLarkConfig();
            
            // Initialize all services
            this.services.employee = new EmployeeService();
            this.services.workHistory = new WorkHistoryService();
            this.services.attendance = new AttendanceService();
            this.services.recruitment = new RecruitmentService();
            this.services.store = new StoreService();
            this.services.position = new PositionService();
            this.services.auth = new AuthService();
            this.services.session = new SessionService();

            // Initialize each service
            await Promise.all([
                this.services.employee.init(),
                this.services.workHistory.init(),
                this.services.attendance.init(),
                this.services.recruitment.init(),
                this.services.store.init(),
                this.services.position.init(),
                this.services.auth.init(),
                this.services.session.init()
            ]);

            this.initialized = true;
            console.log('✅ All Lark services initialized successfully');
            
        } catch (error) {
            console.error('❌ Lark Service Manager initialization failed:', error);
            throw new Error(`Service Manager initialization failed: ${error.message}`);
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }

    // Get specific service for advanced operations
    getService(serviceName) {
        if (!this.services[serviceName]) {
            throw new Error(`Service '${serviceName}' not found. Available services: ${Object.keys(this.services).join(', ')}`);
        }
        return this.services[serviceName];
    }

    // ==================== EMPLOYEE METHODS ====================
    async getAllEmployees() {
        await this.ensureInitialized();
        return await this.services.employee.getAllEmployees();
    }

    async addEmployee(employeeData) {
        await this.ensureInitialized();
        return await this.services.employee.addEmployee(employeeData);
    }

    async updateEmployee(id, employeeData) {
        await this.ensureInitialized();
        return await this.services.employee.updateEmployee(id, employeeData);
    }

    async deleteEmployee(id) {
        await this.ensureInitialized();
        return await this.services.employee.deleteEmployee(id);
    }

    async checkEmployeeIdExists(employeeId) {
        await this.ensureInitialized();
        return await this.services.employee.checkEmployeeIdExists(employeeId);
    }

    async searchEmployees(query) {
        await this.ensureInitialized();
        return await this.services.employee.searchEmployees(query);
    }

    // ==================== WORK HISTORY METHODS ====================
    async getWorkHistoryByEmployee(employeeId) {
        await this.ensureInitialized();
        return await this.services.workHistory.getWorkHistoryByEmployee(employeeId);
    }

    async addWorkHistory(workHistoryData) {
        await this.ensureInitialized();
        return await this.services.workHistory.addWorkHistory(workHistoryData);
    }

    async checkWorkHistoryExists(employeeId, requestNo) {
        await this.ensureInitialized();
        return await this.services.workHistory.checkWorkHistoryExists(employeeId, requestNo);
    }
    
    // ==================== ATTENDANCE METHODS ====================
    async getAttendanceLogs(filters = {}) {
        await this.ensureInitialized();
        return await this.services.attendance.getAttendanceLogs(filters);
    }

    async addAttendanceLog(attendanceData) {
        await this.ensureInitialized();
        return await this.services.attendance.addAttendanceLog(attendanceData);
    }

    async getEmployeeHours() {
        await this.ensureInitialized();
        return await this.services.attendance.getEmployeeHours();
    }

    // ==================== RECRUITMENT METHODS ====================
    async getRecruitmentRequests(filters = {}) {
        await this.ensureInitialized();
        return await this.services.recruitment.getRecruitmentRequests(filters);
    }

    async addRecruitmentRequest(requestData) {
        await this.ensureInitialized();
        return await this.services.recruitment.addRecruitmentRequest(requestData);
    }

    // ==================== STORE METHODS ====================
    async getAllStores() {
        await this.ensureInitialized();
        return await this.services.store.getAllStores();
    }

    async addStore(storeData) {
        await this.ensureInitialized();
        return await this.services.store.addStore(storeData);
    }

    async updateStore(id, storeData) {
        await this.ensureInitialized();
        return await this.services.store.updateStore(id, storeData);
    }

    async deleteStore(id) {
        await this.ensureInitialized();
        return await this.services.store.deleteStore(id);
    }

    // ==================== POSITION METHODS ====================
    async getAllPositions() {
        await this.ensureInitialized();
        return await this.services.position.getAllPositions();
    }

    async addPosition(positionData) {
        await this.ensureInitialized();
        return await this.services.position.addPosition(positionData);
    }

    async updatePosition(id, positionData) {
        await this.ensureInitialized();
        return await this.services.position.updatePosition(id, positionData);
    }

    async deletePosition(id) {
        await this.ensureInitialized();
        return await this.services.position.deletePosition(id);
    }

    // ==================== RECRUITMENT METHODS ====================
    async getRecruitmentRequests(filters = {}) {
        await this.ensureInitialized();
        return await this.services.recruitment.getRecruitmentRequests(filters);
    }

    async addRecruitmentRequest(requestData) {
        await this.ensureInitialized();
        return await this.services.recruitment.addRecruitmentRequest(requestData);
    }

    async updateRecruitmentRequest(id, requestData) {
        await this.ensureInitialized();
        return await this.services.recruitment.updateRecruitmentRequest(id, requestData);
    }
}

export default new LarkServiceManager();
