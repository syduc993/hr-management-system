//hr-management-system\server\services\recruitment\recruitment-service.js

// Recruitment service
import BaseService from '../core/base-service.js';
import LarkClient from '../core/lark-client.js';
import CacheService from '../core/cache-service.js';
import larkServiceManager from '../lark-service-manager.js';
import { larkConfig } from '../../config/lark-config.js';

// **HÀM TIỆN ÍCH ĐỊNH DẠNG NGÀY**
const formatDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

class RecruitmentService extends BaseService {
    constructor() {
        super();
        this.baseId = process.env.LARK_BASE_ID;
        this.tableId = process.env.LARK_RECRUITMENT_TABLE_ID;
        this.hoursSummaryTableId = process.env.LARK_HOURS_SUMMARY_TABLE_ID;
    }

    async initializeService() {
        console.log('Initializing Recruitment Service...');
    }


    async getRecruitmentRequests(filters = {}) {
        try {
            console.log('📡 RECRUITMENT: Fetching ALL recruitment requests from Lark...');
            
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.tableId}/records`
            );

            let requests = this.transformRecruitmentData(response.data?.items || []);
            console.log(`✅ RECRUITMENT: Retrieved ${requests.length} total records from Lark`);
            
            // ✅ SỬA: Filter ở application level - chỉ lấy chính xác "Approved" và "Under Review"
            if (filters.status) {
                const statusArray = Array.isArray(filters.status) 
                    ? filters.status 
                    : filters.status.split(',').map(s => s.trim());
                
                console.log('🔍 RECRUITMENT: Filtering by status:', statusArray);
                
                requests = requests.filter(request => {
                    const requestStatus = request.status;
                    console.log(`📝 Checking: ${request.requestNo} - Status: "${requestStatus}"`);
                    
                    // ✅ ĐƠN GIẢN: Chỉ kiểm tra exact match
                    return statusArray.includes(requestStatus);
                });
            }

            console.log(`✅ RECRUITMENT: After filtering: ${requests.length} records`);
            return requests;
            
        } catch (error) {
            console.error('❌ Error fetching recruitment requests:', error);
            throw error;
        }
    }



    async addRecruitmentRequest(requestData) {
        // Giữ nguyên logic
    }

    async updateRecruitmentRequest(id, requestData) {
        // Giữ nguyên logic
    }


    async getRequestByNo(requestNo) {
        console.log('🔍 RECRUITMENT: Searching for request number:', requestNo);

        const allRequests = await this.getRecruitmentRequests();
        
        if (!allRequests || allRequests.length === 0) {
            console.log('⚠️ RECRUITMENT: No requests found to search in.');
            return null;
        }

        // ✅ THAY ĐỔI: Tìm TẤT CẢ records có cùng requestNo
        const matchingRecords = allRequests.filter(record => {
            const requestValue = record.requestNo;
            return String(requestValue || '').trim() === String(requestNo).trim();
        });

        if (matchingRecords.length === 0) {
            console.log('🔍 RECRUITMENT: Search result: NOT_FOUND');
            return null;
        }

        // ✅ THÊM: Logic merge giống Frontend
        if (matchingRecords.length === 1) {
            return matchingRecords[0];
        }

        // Merge multiple records
        const allFromDates = matchingRecords
            .map(r => r.fromDate)
            .filter(date => date && typeof date === 'number')
            .sort((a, b) => a - b);
            
        const allToDates = matchingRecords
            .map(r => r.toDate)
            .filter(date => date && typeof date === 'number') 
            .sort((a, b) => a - b);

        const minFromDate = allFromDates[0];
        const maxToDate = allToDates[allToDates.length - 1];

        // ✅ TRẢ VỀ: Record đã merge
        const mergedRecord = {
            ...matchingRecords[0], // Base record
            fromDate: minFromDate,
            toDate: maxToDate,
            fromDateFormatted: this.formatDate(minFromDate),
            toDateFormatted: this.formatDate(maxToDate),
            originalRecordCount: matchingRecords.length
        };

        console.log('✅ RECRUITMENT: Merged record:', {
            requestNo,
            fromDate: mergedRecord.fromDateFormatted,
            toDate: mergedRecord.toDateFormatted,
            recordCount: matchingRecords.length
        });

        return mergedRecord;
    }

    // ✅ THÊM: Helper method format ngày
    formatDate(timestamp) {
        if (!timestamp || typeof timestamp !== 'number') return null;
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return null;
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return null;
        }
    }


    // ✅ THAY ĐỔI LOGIC CỐT LÕI TẠI ĐÂY
    async getRecruitmentHoursSummary() {
        try {
            console.log('📊 Getting recruitment hours summary with NEW logic...');

            // 1. Lấy tất cả recruitment requests
            const recruitmentRequests = await this.getRecruitmentRequests();
            console.log('📋 RECRUITMENT REQUESTS:', recruitmentRequests.length, 'requests found');

            // 2. Lấy services cần thiết
            const employeeService = larkServiceManager.getService('employee');

            // 3. Lấy dữ liệu cần thiết để mapping
            const allWorkHistory = await this.getAllWorkHistory();
            const allEmployees = await employeeService.getAllEmployees();
            console.log('📚 WORK HISTORY:', allWorkHistory.length, 'records');
            console.log('👥 EMPLOYEES:', allEmployees.length, 'employees');

            // ✅ CẬP NHẬT: Lấy cả hours và salary maps
            const mapsResult = await this.getEmployeeHoursFromSummaryTable();
            const employeeHoursMap = mapsResult.hoursMap;
            const employeeSalaryMap = mapsResult.salaryMap;
            console.log('⏰ EMPLOYEE HOURS MAP:', employeeHoursMap.size, 'entries');
            console.log('💰 EMPLOYEE SALARY MAP:', employeeSalaryMap.size, 'entries');

            // 4. Tạo map để lookup nhanh
            const employeeMap = new Map(allEmployees.map(emp => [emp.employeeId, emp]));
            console.log('👤 EMPLOYEE MAP:', employeeMap.size, 'entries');

            // ✅ THÊM: Group requests by requestNo để merge
            const groupedRequests = new Map();
            recruitmentRequests.forEach(request => {
                if (!groupedRequests.has(request.requestNo)) {
                    groupedRequests.set(request.requestNo, []);
                }
                groupedRequests.get(request.requestNo).push(request);
            });

            // 5. Xử lý từng grouped recruitment request
            const hoursSummary = [];
            let totalCalculatedHours = 0;
            let totalCalculatedSalary = 0; // ✅ THÊM: Tracking tổng lương

            // ✅ CẬP NHẬT: Process theo grouped requests
            for (const [requestNo, requestGroup] of groupedRequests.entries()) {
                console.log(`\n🔄 Processing merged request: ${requestNo} (${requestGroup.length} records)`);
                
                // ✅ MERGE: Lấy thông tin từ record đầu tiên, merge ngày tháng
                const baseRequest = requestGroup[0];
                const allFromDates = requestGroup
                    .map(r => r.fromDate)
                    .filter(date => date && typeof date === 'number')
                    .sort((a, b) => a - b);
                    
                const allToDates = requestGroup
                    .map(r => r.toDate)
                    .filter(date => date && typeof date === 'number')
                    .sort((a, b) => a - b);

                const minFromDate = allFromDates[0];
                const maxToDate = allToDates[allToDates.length - 1];

                const mergedRequest = {
                    ...baseRequest,
                    fromDate: minFromDate,
                    toDate: maxToDate,
                    fromDateFormatted: this.formatDate(minFromDate),
                    toDateFormatted: this.formatDate(maxToDate)
                };

                const requestSummary = await this.calculateRequestHours(
                    mergedRequest,
                    allWorkHistory,
                    employeeMap,
                    employeeHoursMap,
                    employeeSalaryMap // ✅ THÊM: Pass salary map
                );

                console.log(`📊 Request ${requestNo} summary:`, {
                    totalEmployees: requestSummary.totalEmployees,
                    totalHoursNumeric: requestSummary.totalHoursNumeric,
                    totalSalaryNumeric: requestSummary.totalSalaryNumeric // ✅ THÊM
                });

                totalCalculatedHours += requestSummary.totalHoursNumeric;
                totalCalculatedSalary += requestSummary.totalSalaryNumeric; // ✅ THÊM

                if (requestSummary.employees.length > 0) {
                    hoursSummary.push(requestSummary);
                }
            }

            console.log(`\n📊 FINAL CALCULATION RESULT:`);
            console.log(`- Total requests: ${hoursSummary.length}`);
            console.log(`- Total hours: ${totalCalculatedHours}`);
            console.log(`- Total salary: ${totalCalculatedSalary}`); // ✅ THÊM

            return hoursSummary;

        } catch (error) {
            console.error('❌ Error getting recruitment hours summary:', error);
            throw error;
        }
    }


    // ✅ HÀM MỚI: Lấy dữ liệu từ bảng tổng hợp giờ công
    async getEmployeeHoursFromSummaryTable() {
        console.log('📡 Fetching data from hours summary table...');
        const cacheKey = 'hours_summary_table_data';
        let cachedData = CacheService.get(cacheKey);
        if (cachedData) {
            console.log('✅ Loaded hours summary from cache.');
            console.log('🗂️ CACHED HOURS MAP:', Array.from(cachedData.hoursMap.entries()));
            console.log('💰 CACHED SALARY MAP:', Array.from(cachedData.salaryMap.entries()));
            return cachedData;
        }

        try {
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.hoursSummaryTableId}/records`
            );
            const records = response.data?.items || [];
            console.log('📄 RAW HOURS SUMMARY RECORDS:', records.length, 'records');

            const employeeHoursMap = new Map();
            const employeeSalaryMap = new Map();
            const employeeHourlyRateMap = new Map();

            records.forEach((record, index) => {
                const fields = record.fields;
                console.log(`\n📝 Record #${index + 1} FULL FIELDS:`, fields);
                
                const employeeIdField = fields['Mã nhân viên'];
                console.log(`Record #${index + 1} - Mã nhân viên:`, employeeIdField, '| Type:', typeof employeeIdField);
                
                let employeeId = '';
                if (Array.isArray(employeeIdField) && employeeIdField.length > 0) {
                    employeeId = employeeIdField[0]?.text;
                } else if (typeof employeeIdField === 'string') {
                    employeeId = employeeIdField;
                }

                const totalHours = fields['Tổng số giờ làm'] || 0;
                // ✅ THÊM: Lấy cột lương với nhiều tên có thể
                const salary = fields['Lương'] || 0;
                const hourlyRate = fields['Mức lương/giờ'] || 0;
                console.log(`📊 Record #${index + 1} - Employee: "${employeeId}", Hours: ${totalHours}, Salary: ${salary}`);

                if (employeeId) {
                    // ✅ CỘNG DỒN GIỜ CÔNG
                    const currentHours = employeeHoursMap.get(employeeId) || 0;
                    const newTotalHours = currentHours + totalHours;
                    employeeHoursMap.set(employeeId, newTotalHours);
                    
                    // ✅ THÊM: CỘNG DỒN LƯƠNG
                    const currentSalary = employeeSalaryMap.get(employeeId) || 0;
                    const newTotalSalary = currentSalary + salary;
                    employeeSalaryMap.set(employeeId, newTotalSalary);
                    
                    // ✅ THÊM: Lưu hourly rate nếu có
                    if (hourlyRate > 0) {
                        employeeHourlyRateMap.set(employeeId, hourlyRate);
                    }

                    console.log(`✅ Updated: "${employeeId}" -> Hours: ${currentHours} + ${totalHours} = ${newTotalHours}, Salary: ${currentSalary} + ${salary} = ${newTotalSalary}`);
                } else {
                    console.log(`⚠️ Skipped record #${index + 1} - No valid employeeId`);
                }
            });

            console.log(`\n🗺️ FINAL EMPLOYEE HOURS MAP:`, Array.from(employeeHoursMap.entries()));
            console.log(`💰 FINAL EMPLOYEE SALARY MAP:`, Array.from(employeeSalaryMap.entries()));
            
            // ✅ THAY ĐỔI: Trả về object chứa cả hours và salary maps
            const result = {
                hoursMap: employeeHoursMap,
                salaryMap: employeeSalaryMap,
                hourlyRateMap: employeeHourlyRateMap
                
            };
            
            CacheService.set(cacheKey, result, 300000);
            console.log(`✅ Created maps - Hours: ${employeeHoursMap.size}, Salary: ${employeeSalaryMap.size} entries.`);
            return result;
        } catch (error) {
            console.error('❌ Error fetching from hours summary table:', error);
            return {
                hoursMap: new Map(),
                salaryMap: new Map(),
                hourlyRateMap: new Map()
            };
        }
    }



    // ✅ HÀM ĐƯỢC CẬP NHẬT: Thay đổi logic tính toán
    async calculateRequestHours(request, allWorkHistory, employeeMap, employeeHoursMap, employeeSalaryMap) {
        console.log(`\n🔍 CALCULATING for REQUEST: ${request.requestNo}`);
        
        const requestEmployees = allWorkHistory.filter(wh => wh.requestNo === request.requestNo);
        
        // ✅ THÊM: Đếm unique employees
        const uniqueEmployeeIds = [...new Set(requestEmployees.map(re => re.employeeId))];
        console.log(`👥 Found ${uniqueEmployeeIds.length} UNIQUE employees for request ${request.requestNo}`);

        const employeeDetails = [];
        let totalRequestHours = 0;
        let totalRequestSalary = 0; // ✅ THÊM

        for (const employeeId of uniqueEmployeeIds) {
            const employee = employeeMap.get(employeeId);
            if (!employee) {
                console.log(`❌ Employee not found: ${employeeId}`);
                continue;
            }

            const totalHoursNumeric = employeeHoursMap.get(employeeId) || 0;
            const totalSalaryNumeric = employeeSalaryMap.get(employeeId) || 0; // ✅ THÊM

            totalRequestHours += totalHoursNumeric;
            totalRequestSalary += totalSalaryNumeric; // ✅ THÊM

            employeeDetails.push({
                employeeId: employeeId,
                fullName: employee.fullName,
                totalHours: this.formatHoursDisplay(totalHoursNumeric),
                totalHoursNumeric: totalHoursNumeric,
                totalSalary: this.formatCurrency(totalSalaryNumeric), // ✅ THÊM
                totalSalaryNumeric: totalSalaryNumeric // ✅ THÊM
            });
        }

        return {
            requestNo: request.requestNo,
            department: request.department,
            status: request.status,
            fromDate: request.fromDateFormatted,
            toDate: request.toDateFormatted,
            totalEmployees: uniqueEmployeeIds.length, // ✅ SỬA: Dùng unique count
            totalHours: this.formatHoursDisplay(totalRequestHours),
            totalHoursNumeric: totalRequestHours,
            totalSalary: this.formatCurrency(totalRequestSalary), // ✅ THÊM
            totalSalaryNumeric: totalRequestSalary, // ✅ THÊM
            employees: employeeDetails
        };
    }


    async getDetailedHoursForRequest(requestNo) {
        try {
            console.log(`📊 Getting detailed hours for request: ${requestNo}`);
            
            // Lấy chi tiết từ bảng Hours Summary (tblV2dGhT2O7w30b)
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${this.baseId}/tables/${this.hoursSummaryTableId}/records`
            );
            
            const allRecords = response.data?.items || [];
            console.log(`📄 Found ${allRecords.length} total records in hours summary table`);
        

            // Lấy danh sách nhân viên thuộc request này từ Work History
            const workHistoryService = larkServiceManager.getService('workHistory');
            const workHistoryRecords = await workHistoryService.getAllWorkHistory(); // Cần thêm method này
            
            const employeesInRequest = workHistoryRecords
                .filter(wh => wh.requestNo === requestNo)
                .map(wh => wh.employeeId);
                
            console.log(`👥 Employees in request ${requestNo}:`, employeesInRequest);
            
            // Lọc và transform dữ liệu
            const detailedRecords = [];
            
            allRecords.forEach(record => {
                const fields = record.fields;
                
                // Lấy mã nhân viên
                const employeeIdField = fields['Mã nhân viên'];
                let employeeId = '';
                if (Array.isArray(employeeIdField) && employeeIdField.length > 0) {
                    employeeId = employeeIdField[0]?.text;
                } else if (typeof employeeIdField === 'string') {
                    employeeId = employeeIdField;
                }
                
                // Chỉ lấy bản ghi của nhân viên thuộc request này
                if (employeesInRequest.includes(employeeId)) {
                    detailedRecords.push({
                        employeeId: employeeId,
                        workDate: this.formatLarkDate(fields['Ngày chấm công']),
                        //checkInTime: this.formatLarkTime(fields['Thời gian chấm công vào']),
                        checkInTime: fields['Thời gian chấm công vào'],
                        //checkOutTime: this.formatLarkTime(fields['Thời gian chấm công ra']),
                        checkOutTime: fields['Thời gian chấm công ra'],
                        totalHours: fields['Tổng số giờ làm'] || 0,
                        requestNo: requestNo
                    });
                }
            });
            
            console.log(`✅ Retrieved ${detailedRecords.length} detailed records for request ${requestNo}`);
            return detailedRecords;
            
        } catch (error) {
            console.error('❌ Error getting detailed hours for request:', error);
            throw error;
        }
    }

    // ✅ THÊM: Method format tiền tệ VNĐ
    formatCurrency(amount) {
        if (!amount || amount === 0) return '0 ₫';
        try {
            return new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return `${amount.toLocaleString('vi-VN')} ₫`;
        }
    }

    formatLarkDate(dateValue) {
        if (!dateValue) return '';
        
        try {
            let date;
            
            // Nếu là timestamp (number)
            if (typeof dateValue === 'number') {
                date = new Date(dateValue);
            } 
            // Nếu là string ISO
            else if (typeof dateValue === 'string') {
                date = new Date(dateValue);
            }
            // Nếu đã là Date object
            else if (dateValue instanceof Date) {
                date = dateValue;
            }
            else {
                return 'Invalid Date';
            }
            
            // Kiểm tra tính hợp lệ của date
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            
            // Format thành DD/MM/YYYY
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('Error formatting Lark date:', error);
            return 'Format Error';
        }
    }

    formatLarkTime(timeValue) {
        if (!timeValue) return '';
        
        try {
            let date;
            
            // Nếu là timestamp (number)
            if (typeof timeValue === 'number') {
                date = new Date(timeValue);
            }
            // Nếu là string ISO
            else if (typeof timeValue === 'string') {
                date = new Date(timeValue);
            }
            // Nếu đã là Date object
            else if (timeValue instanceof Date) {
                date = timeValue;
            }
            else {
                return 'Invalid Time';
            }
            
            // Kiểm tra tính hợp lệ của date
            if (isNaN(date.getTime())) {
                return 'Invalid Time';
            }
            
            // Format thành HH:MM
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting Lark time:', error);
            return 'Format Error';
        }
    }


    async getAllWorkHistory() {
        const cacheKey = 'work_history_all';
        let history = CacheService.get(cacheKey);

        if (history) {
            console.log(`✅ WORK HISTORY: Loaded ${history.length} records from cache.`);
            return history;
        }

        try {
            console.log('📡 WORK HISTORY: Fetching all work history from Lark...');
            const response = await LarkClient.getAllRecords(
                `/bitable/v1/apps/${process.env.LARK_BASE_ID}/tables/${process.env.LARK_WORK_HISTORY_TABLE_ID}/records`
            );

            history = this.transformWorkHistoryData(response.data?.items || []);
            console.log(`✅ WORK HISTORY: Transformed ${history.length} total records.`);

            CacheService.set(cacheKey, history, 300000);
            return history;
        } catch (error) {
            console.error('❌ Error getting all work history:', error);
            return [];
        }
    }

    transformWorkHistoryData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            employeeId: record.fields['Mã nhân viên'] || '',
            requestNo: record.fields['Request No.'] || ''
        }));
    }

    transformRecruitmentData(larkData) {
        return larkData.map(record => ({
            id: record.record_id,
            requestNo: this.extractRequestNo(record.fields['Request No.']),
            requester: this.extractRequesterName(record.fields['Requester']),
            status: record.fields['Status'] || '',
            department: record.fields['Details_Phòng ban'] || record.fields['Department'] || '',
            quantity: record.fields['Details_Số lượng cần tuyển'] || record.fields['Quantity'] || '',
            gender: record.fields['Details_Giới tính'] || record.fields['Gender'] || '',
            fromDate: record.fields['Details_Từ ngày'] || record.fields['From Date'] || '',
            toDate: record.fields['Details_Đến ngày'] || record.fields['To Date'] || '',
            fromDateFormatted: formatDate(record.fields['Details_Từ ngày'] || record.fields['From Date'] || ''),
            toDateFormatted: formatDate(record.fields['Details_Đến ngày'] || record.fields['To Date'] || ''),
            position: record.fields['Details_Vị trí'] || record.fields['Position'] || '',
            approvalStatus: record.fields['Status'] || ''
        }));
    }

    extractRequestNo(requestNoData) {
        if (!requestNoData) return '';
        if (typeof requestNoData === 'object' && requestNoData.text) {
            return requestNoData.text;
        }
        if (typeof requestNoData === 'string') {
            return requestNoData;
        }
        return requestNoData.toString();
    }

    extractRequesterName(requesterData) {
        if (!requesterData) return '';
        if (Array.isArray(requesterData)) {
            return requesterData.map(user => user.name || user.en_name || user.id || 'Unknown').join(', ');
        }
        if (typeof requesterData === 'object') {
            return requesterData.name || requesterData.en_name || requesterData.id || 'Unknown';
        }
        return requesterData.toString();
    }

    transformRecruitmentForLark(requestData) {
        return {
            'Request No': requestData.requestNo,
            'Requester': requestData.requester,
            'Status': requestData.status,
            'Department': requestData.department,
            'Quantity': requestData.quantity,
            'Gender': requestData.gender,
            'From Date': requestData.fromDate,
            'To Date': requestData.toDate,
            'Approval Status': requestData.approvalStatus || 'pending',
            'Created At': requestData.createdAt || new Date().toISOString()
        };
    }

    formatHoursDisplay(totalHours) {
        if (!totalHours || totalHours === 0) return '0 giờ';

        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);

        if (minutes === 0) {
            return `${hours} giờ`;
        } else if (hours === 0) {
            return `${minutes} phút`;
        } else {
            return `${hours} giờ ${minutes} phút`;
        }
    }
}

export default RecruitmentService;
