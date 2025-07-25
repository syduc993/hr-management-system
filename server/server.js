// server/server.js
import dotenv from 'dotenv';

// Configure dotenv FIRST
dotenv.config();

// Import các modules AFTER đã config dotenv
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import service manager AFTER dotenv config
import larkServiceManager from './services/lark-service-manager.js';

// Import routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import recruitmentRoutes from './routes/recruitment.js';
import masterDataRoutes from './routes/masterData.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    //origin: ['http://localhost:3000', 'http://192.168.1.88:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            larkServiceManager: larkServiceManager.initialized
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'HR Management System API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Start server with proper initialization
app.listen(PORT,'::', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    try {
        await larkServiceManager.init();
        console.log('Server fully initialized and ready');
    } catch (error) {
        console.error('Service initialization failed:', error.message);
        console.log('Server running but services unavailable');
    }
});
