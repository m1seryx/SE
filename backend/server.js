require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000',
    'http://localhost:19006', // Expo React Native
    'http://127.0.0.1:19006', // Expo alternative
    'exp://192.168.1.100:19000', // Physical device (replace with your IP)
    '*' // Development only - remove in production
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/AuthRoutes');
const rentalRoutes = require('./routes/RentalRoutes');
const userRoutes = require('./routes/UserRoutes');
const cartRoutes = require('./routes/CartRoutes');
const orderRoutes = require('./routes/OrderRoutes');
const repairRoutes = require('./routes/RepairRoutes');
const orderTrackingRoutes = require('./routes/OrderTrackingRoutes');
const dryCleaningRoutes = require('./routes/DryCleaningRoutes');

app.use('/api', authRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/dry-cleaning', dryCleaningRoutes);
app.use('/api/tracking', orderTrackingRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});