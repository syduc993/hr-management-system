// server/controllers/authController.js
import larkServiceManager from '../services/lark-service-manager.js';
import { formatResponse } from '../services/utils/response-formatter.js';

/**
 * Xử lý đăng nhập người dùng.
 * Controller gọi đến AuthService để xác thực.
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const authService = larkServiceManager.getService('auth');

        // Gọi service để xử lý logic đăng nhập
        const result = await authService.login({ username, password });

        // Nếu service trả về thành công, tạo session
        if (result.success) {
            req.session.user = {
                id: result.user.id,
                username: result.user.username,
                role: result.user.role,
                fullName: result.user.fullName
            };
            
            // Trả về response thành công với thông tin user
            res.json(formatResponse(true, result.message, { user: req.session.user }));
        } else {
            // Trường hợp service xử lý nhưng không thành công (ít xảy ra với logic hiện tại)
             res.status(401).json(formatResponse(false, result.message, null, 'LOGIN_FAILED'));
        }

    } catch (error) {
        // Bắt lỗi do service throw (ví dụ: sai credentials)
        console.error('❌ Controller: login failed:', error.message);
        res.status(401).json(formatResponse(false, 'Tên đăng nhập hoặc mật khẩu không đúng.', null, 'INVALID_CREDENTIALS'));
    }
};

/**
 * Xử lý đăng xuất người dùng.
 * @route POST /api/auth/logout
 */
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Controller: logout failed:', err);
            return res.status(500).json(formatResponse(false, 'Không thể đăng xuất', null, 'LOGOUT_ERROR'));
        }
        res.clearCookie('connect.sid'); // Xóa cookie session phía client
        res.json(formatResponse(true, 'Đăng xuất thành công'));
    });
};

/**
 * Lấy thông tin profile của user đang đăng nhập.
 * @route GET /api/auth/profile
 */
const getProfile = (req, res) => {
    // req.user được gán từ middleware `authenticateUser`
    if (req.user) {
        res.json(formatResponse(true, 'Lấy thông tin người dùng thành công', { user: req.user }));
    } else {
        res.status(401).json(formatResponse(false, 'Người dùng chưa được xác thực', null, 'UNAUTHENTICATED'));
    }
};

export {
    login,
    logout,
    getProfile
};