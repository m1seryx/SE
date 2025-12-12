require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();


// CORS configuration - must specify exact origins when using credentials: true
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://localhost:5175', 
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:8082', 
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://localhost:19006',
  'http://127.0.0.1:19006', 
  'exp://192.168.1.100:19000', 
  'exp://192.168.254.103:8082',
  'http://192.168.1.38:5173',
  'http://192.168.1.38:5174',
  'http://192.168.1.38:5175',
  'http://192.168.254.102:5173',
  'http://192.168.254.102:5174',
  'http://192.168.254.102:5175',
  'http://192.168.254.102:3000',
  'http://192.168.254.102:8081',
  'http://192.168.254.102:8082',
  'http://192.168.1.202:5173',
  'http://192.168.1.202:5174',
  'http://192.168.1.202:5175',
  'http://192.168.1.202:3000',
  'http://192.168.1.202:8081',
  'http://192.168.1.202:8082',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow any localhost origin or local network IPs
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('192.168.') ||
          origin.includes('10.0.') ||
          origin.includes('172.16.')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));


// Increase body parser limit to handle large payloads (e.g., 3D customization data)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/AuthRoutes');
const rentalRoutes = require('./routes/RentalRoutes');
const userRoutes = require('./routes/UserRoutes');
const cartRoutes = require('./routes/CartRoutes');
const orderRoutes = require('./routes/OrderRoutes');
const repairRoutes = require('./routes/RepairRoutes');
const orderTrackingRoutes = require('./routes/OrderTrackingRoutes');
const dryCleaningRoutes = require('./routes/DryCleaningRoutes');
const customizationRoutes = require('./routes/CustomizationRoutes');
const billingRoutes = require('./routes/BillingRoutes');
const inventoryRoutes = require('./routes/InventoryRoutes');
const adminDashboardRoutes = require('./routes/AdminDashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const customerRoutes = require('./routes/CustomerRoutes');
const appointmentSlotRoutes = require('./routes/AppointmentSlotRoutes');
const transactionLogRoutes = require('./routes/TransactionLogRoutes');

app.use('/api', authRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/dry-cleaning', dryCleaningRoutes);
app.use('/api/customization', customizationRoutes);
app.use('/api/tracking', orderTrackingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentSlotRoutes);
app.use('/api/transaction-logs', transactionLogRoutes);


// Initialize date reminder service (runs on startup and can be scheduled)
try {
  const dateReminderService = require('./services/dateReminderService');
  // Run date reminders check on startup
  dateReminderService.checkDateReminders();
  // Schedule to run daily (every 24 hours)
  setInterval(() => {
    dateReminderService.checkDateReminders();
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
  console.log('[SERVER] Date reminder service initialized');
} catch (err) {
  console.error('[SERVER] Error initializing date reminder service:', err.message);
  // Don't crash the server if reminder service fails
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});