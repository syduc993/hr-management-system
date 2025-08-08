HỆ THỐNG QUẢN LÝ NHÂN SỰ (HR Management System)
Đây là tài liệu hướng dẫn về kiến trúc, luồng hoạt động và cách phát triển các tính năng mới cho dự án.

1. Luồng Hoạt Động Của Một Tính Năng (Ví dụ: Thêm Nhân Viên Mới)
Tính năng "Thêm nhân viên mới" là một ví dụ điển hình cho thấy sự tương tác giữa Frontend và Backend. Luồng dữ liệu đi từ giao diện người dùng, qua các tầng xử lý ở client, gửi yêu cầu đến server, server xử lý và lưu vào "database" (Lark Bitable), sau đó trả kết quả về cho client.

a. Phía Frontend (React)
Giao diện người dùng (src/components/employee/EmployeeAddForm.jsx)

Người dùng nhập thông tin (Họ tên, SĐT, Giới tính, Ngân hàng...) vào các ô input trong form.

Người dùng nhấn vào nút "Chọn Đề xuất Tuyển dụng", một modal (RecruitmentModal.jsx) hiện lên để chọn.

Trạng thái của form được quản lý bởi useState trong component.

Xử lý sự kiện (src/components/employee/EmployeeAddForm.jsx)

Khi người dùng nhấn nút "Lưu Nhân viên", hàm handleSubmit được kích hoạt.

Hàm này thực hiện validation cơ bản, sau đó đóng gói dữ liệu (bao gồm thông tin cá nhân và workHistoryData) thành một đối tượng payload.

Gọi Hook (src/pages/EmployeeManagementPage.jsx)

EmployeeAddForm gọi hàm onSave được truyền từ trang cha là EmployeeManagementPage.

Hàm onSave này chính là handleAddEmployee được cung cấp bởi hook useEmployees.

Xử lý logic trong Hook (src/hooks/useEmployees.js)

Hook useEmployees nhận payload và gọi hàm addEmployee từ tầng service của client.

Nó quản lý trạng thái loading và hiển thị thông báo (thành công/thất bại) thông qua useNotification.

Tầng Service Client (src/services/employee.js)

Hàm addEmployee trong file này tạo và gửi một yêu cầu HTTP POST đến API của server tại endpoint /api/employees bằng axios (thông qua ApiClient).

b. Phía Backend (Node.js/Express)
Tiếp nhận yêu cầu (server/server.js)

Server Express nhận yêu cầu POST tại /api/employees.

Định tuyến (server/routes/employees.js)

Router xử lý endpoint /api/employees. Nó áp dụng các middleware theo thứ tự:

authenticateUser: Kiểm tra người dùng đã đăng nhập chưa.

authorizeRoles('hr', 'admin'): Kiểm tra người dùng có quyền thực hiện hành động này không.

ValidationMiddleware.validateAddEmployee: Kiểm tra dữ liệu đầu vào có hợp lệ không.

Controller (server/controllers/employeeController.js)

Nếu tất cả middleware đều pass, hàm addEmployee trong controller sẽ được thực thi.

Controller nhận req.body, chuẩn bị dữ liệu và gọi sang tầng service để xử lý logic nghiệp vụ chính. Nó không trực tiếp thao tác với database.

Nó gọi larkServiceManager.addEmployee(employeeData).

Service (Logic nghiệp vụ) (server/services/employees/employee-service.js)

Đây là nơi xử lý logic chính:

Hàm addEmployee nhận dữ liệu từ controller.

Nó gọi generateEmployeeId để tạo mã nhân viên duy nhất.

Nó gọi checkEmployeeIdExists để đảm bảo không có nhân viên trùng lặp.

Nó gọi transformEmployeeForLark để chuyển đổi dữ liệu thành định dạng mà Lark Bitable yêu cầu.

Nó gọi larkServiceManager.addWorkHistory() để tạo bản ghi lịch sử công việc liên quan, đảm bảo tính toàn vẹn dữ liệu (nếu thêm nhân viên thất bại thì không thêm lịch sử).

Tương tác "Database" (server/services/core/lark-client.js)

EmployeeService sử dụng LarkClient.post() để gửi yêu cầu API đến Lark Bitable, tạo một bản ghi mới trong bảng Nhân viên.

Phản hồi

Kết quả từ Lark API được trả ngược lại qua các tầng: LarkClient -> EmployeeService -> EmployeeController.

EmployeeController định dạng phản hồi JSON (sử dụng formatResponse) và gửi về cho client.

Frontend nhận phản hồi, hook useEmployees cập nhật lại danh sách nhân viên và useNotification hiển thị thông báo thành công.

2. Hướng Dẫn Thêm Một Trường Dữ Liệu Mới (Ví dụ: Thêm "Ghi Chú" cho Nhân Viên)
Khi muốn thêm một trường dữ liệu mới, luồng làm việc tốt nhất là đi từ dưới lên (Backend -> Frontend) để đảm bảo dữ liệu được xử lý và lưu trữ đúng cách trước khi xây dựng giao diện.

Yêu cầu: Thêm một trường "Ghi chú" (notes) vào form thêm nhân viên.

Bước 1: Cập nhật Backend (Nơi lưu trữ và xử lý dữ liệu)
"Database" (Lark Bitable)

Hành động: Mở bảng "Employees" trong Lark Base của bạn và thêm một cột mới có tên là "Ghi chú" (kiểu Text). Đây là bước quan trọng nhất, là nguồn của sự thật (source of truth).

Service (server/services/employees/employee-service.js)

Mục đích: Dạy cho service biết về sự tồn tại của trường notes.

Hành động:

Trong hàm transformEmployeeForLark(employeeData), thêm một dòng để ánh xạ dữ liệu:

javascript
return {
    // ... các trường cũ
    'Ghi chú': employeeData.notes || '', // Thêm dòng này
    'Trạng thái': employeeData.status || 'active'
};
Trong hàm transformEmployeeData(larkData), thêm một dòng để đọc dữ liệu từ Lark về:

javascript
return larkData.map(record => ({
    // ... các trường cũ
    notes: record.fields['Ghi chú'] || '', // Thêm dòng này
    createdAt: record.fields['Created At'] || new Date().toISOString(),
    // ...
}));
Controller (server/controllers/employeeController.js)

Mục đích: Nhận trường notes từ request và truyền nó xuống service.

Hành động:

Trong hàm addEmployee, nhận notes từ req.body:

javascript
const { fullName, phoneNumber, gender, bankAccount, bankName, workHistoryData, notes } = req.body;
Khi tạo employeeData để truyền xuống service, thêm trường notes:

javascript
const employeeData = {
    // ... các trường cũ
    notes, // Thêm trường này
    status: 'active',
    createdAt: new Date().toISOString()
};
Validation (Tùy chọn) (server/middleware/validation.js)

Nếu bạn muốn validate trường "Ghi chú" (ví dụ: không được quá 500 ký tự), hãy thêm logic vào EmployeeValidator.validateEmployeeData.

Bước 2: Cập nhật Frontend (Nơi người dùng nhập liệu)
Component Form (src/components/employee/EmployeeAddForm.jsx)

Mục đích: Hiển thị ô nhập "Ghi chú" trên giao diện.

Hành động:

Thêm notes: '' vào initialFormData.

Trong phần JSX của form, thêm một <textarea> cho trường "Ghi chú":

jsx
// Đặt ở vị trí phù hợp, ví dụ sau phần Thông tin Ngân hàng
<div className="mb-3">
  <label htmlFor="notes" className="form-label">Ghi chú</label>
  <textarea
    id="notes"
    name="notes"
    className="form-control"
    placeholder="Thêm ghi chú về nhân viên..."
    value={formData.notes}
    onChange={handleChange}
    disabled={loading}
    rows="3"
  ></textarea>
</div>
Hàm handleChange đã có sẵn sẽ tự động xử lý việc cập nhật state cho trường notes.

Payload Gửi đi (src/components/employee/EmployeeAddForm.jsx)

Mục đích: Đảm bảo trường notes được gửi đi trong request API.

Hành động: Trong hàm handleSubmit, đối tượng payload đã bao gồm tất cả các trường từ formData (...formData), nên bạn không cần sửa gì thêm. Dữ liệu notes sẽ tự động được gửi đi.

Tóm tắt các file cần sửa:
Bắt buộc:

server/services/employees/employee-service.js (Để đọc/ghi trường mới).

server/controllers/employeeController.js (Để nhận dữ liệu từ request).

src/components/employee/EmployeeAddForm.jsx (Để hiển thị ô nhập liệu và quản lý state).

Tùy chọn (nhưng khuyến khích):
4. server/middleware/validation.js (Để validate dữ liệu mới).

Bằng cách tuân theo luồng "từ dưới lên" này, bạn đảm bảo rằng hệ thống của mình sẵn sàng xử lý và lưu trữ dữ liệu mới một cách chính xác trước khi bạn xây dựng giao diện cho nó, giúp tránh các lỗi không đồng bộ.