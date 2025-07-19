// server/config/lark-config.js
export const validateLarkConfig = () => {
    const requiredVars = [
        'LARK_APP_ID',
        'LARK_APP_SECRET', 
        'LARK_BASE_ID',
        'LARK_EMPLOYEE_TABLE_ID',
        'LARK_ATTENDANCE_TABLE_ID',
        'LARK_RECRUITMENT_TABLE_ID',
        'LARK_STORE_TABLE_ID',
        'LARK_POSITION_TABLE_ID',
        'LARK_WORK_HISTORY_TABLE_ID'
    ];

    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`❌ Missing Lark configuration: ${missing.join(', ')}`);
    }
    
    console.log('✅ Lark configuration validated');
};

export const larkConfig = {
    appId: process.env.LARK_APP_ID,
    appSecret: process.env.LARK_APP_SECRET,
    baseId: process.env.LARK_BASE_ID,
    tables: {
        employee: process.env.LARK_EMPLOYEE_TABLE_ID,
        attendance: process.env.LARK_ATTENDANCE_TABLE_ID,
        recruitment: process.env.LARK_RECRUITMENT_TABLE_ID,
        store: process.env.LARK_STORE_TABLE_ID,
        position: process.env.LARK_POSITION_TABLE_ID,
        workHistory: process.env.LARK_WORK_HISTORY_TABLE_ID
    }
};
