// Demo users data (in production, use real database)
const users = {
    admin: {
        id: 'admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        fullName: 'System Admin'
    },
    hr: {
        id: 'hr',
        username: 'hr',
        password: 'hr123',
        role: 'hr',
        fullName: 'HR Manager'
    },
    sales: {
        id: 'sales',
        username: 'sales',
        password: 'sales123',
        role: 'sales_manager',
        fullName: 'Sales Manager'
    },
    finance: {
        id: 'finance',
        username: 'finance',
        password: 'finance123',
        role: 'finance_manager',
        fullName: 'Finance Manager'
    },
    director: {
        id: 'director',
        username: 'director',
        password: 'director123',
        role: 'director',
        fullName: 'Director'
    }
};

const roles = {
    admin: 'Admin',
    hr: 'HR',
    sales_manager: 'Trưởng phòng kinh doanh',
    finance_manager: 'Trưởng phòng tài chính kế toán',
    director: 'Tổng giám đốc'
};

export {
    users,
    roles
};
