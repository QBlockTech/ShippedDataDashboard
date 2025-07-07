const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.PG_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// Test database connection
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

// API endpoint to get shipped orders
app.get('/api/orders', async (req, res) => {
  try {
    console.log('📊 Fetching shipped orders from database...');
    
    // Query to get all orders sorted by most recent first
    // Assuming there's a table named 'orders' with appropriate columns
    const query = `
      SELECT 
        id,
        order_number,
        customer_name,
        product_name,
        quantity,
        unit_price,
        total_amount,
        shipped_date,
        tracking_number,
        status
      FROM orders 
      WHERE status = 'shipped' 
      ORDER BY shipped_date DESC, id DESC
    `;
    
    const result = await pool.query(query);
    
    // Format the data - round decimal values to 2 decimal places
    const formattedOrders = result.rows.map(order => ({
      ...order,
      unit_price: order.unit_price ? parseFloat(order.unit_price).toFixed(2) : '0.00',
      total_amount: order.total_amount ? parseFloat(order.total_amount).toFixed(2) : '0.00',
      shipped_date: order.shipped_date ? new Date(order.shipped_date).toLocaleDateString() : 'N/A'
    }));
    
    console.log(`📦 Retrieved ${formattedOrders.length} shipped orders`);
    
    // Log each order for debugging
    formattedOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        shipped_date: order.shipped_date
      });
    });
    
    res.json({
      success: true,
      data: formattedOrders,
      count: formattedOrders.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    client.release();
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Dashboard available at: http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  testDatabaseConnection();
});

module.exports = app;