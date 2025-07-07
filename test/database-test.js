const { Pool } = require('pg');
require('dotenv').config();

/**
 * Test Database Connection and Data Retrieval
 * This script tests the connection to the Neon database and validates data retrieval
 */

class DatabaseTester {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.PG_DB_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }

    async testConnection() {
        console.log('🔍 Testing database connection...');
        console.log('Database URL:', process.env.PG_DB_URL ? 'Configured' : 'Not configured');
        
        try {
            const client = await this.pool.connect();
            console.log('✅ Database connection successful');
            
            // Test basic query
            const result = await client.query('SELECT NOW() as current_time');
            console.log('⏰ Database time:', result.rows[0].current_time);
            
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
    }

    async testTableStructure() {
        console.log('\n🔍 Testing table structure...');
        
        try {
            const client = await this.pool.connect();
            
            // Check if orders table exists
            const tableCheck = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'orders'
            `);
            
            if (tableCheck.rows.length === 0) {
                console.log('⚠️  Orders table not found. Creating sample table structure...');
                await this.createSampleTable(client);
            } else {
                console.log('✅ Orders table exists');
            }
            
            // Get table structure
            const columnsQuery = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'orders'
                ORDER BY ordinal_position
            `);
            
            console.log('📊 Table structure:');
            columnsQuery.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
            
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Table structure test failed:', error.message);
            return false;
        }
    }

    async createSampleTable(client) {
        console.log('🏗️  Creating sample orders table...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                customer_name VARCHAR(100) NOT NULL,
                product_name VARCHAR(200) NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                shipped_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tracking_number VARCHAR(100),
                status VARCHAR(20) DEFAULT 'shipped',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await client.query(createTableQuery);
        console.log('✅ Sample table created');
        
        // Insert sample data
        await this.insertSampleData(client);
    }

    async insertSampleData(client) {
        console.log('📝 Inserting sample data...');
        
        const sampleOrders = [
            {
                order_number: 'ORD-2024-001',
                customer_name: 'John Doe',
                product_name: 'Laptop Computer',
                quantity: 1,
                unit_price: 999.99,
                total_amount: 999.99,
                tracking_number: 'TRK123456789',
                shipped_date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
            },
            {
                order_number: 'ORD-2024-002',
                customer_name: 'Jane Smith',
                product_name: 'Wireless Mouse',
                quantity: 2,
                unit_price: 29.99,
                total_amount: 59.98,
                tracking_number: 'TRK987654321',
                shipped_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            },
            {
                order_number: 'ORD-2024-003',
                customer_name: 'Bob Johnson',
                product_name: 'USB-C Cable',
                quantity: 3,
                unit_price: 15.50,
                total_amount: 46.50,
                tracking_number: 'TRK456789123',
                shipped_date: new Date() // Now
            }
        ];

        for (const order of sampleOrders) {
            try {
                await client.query(`
                    INSERT INTO orders (
                        order_number, customer_name, product_name, quantity, 
                        unit_price, total_amount, tracking_number, shipped_date, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (order_number) DO NOTHING
                `, [
                    order.order_number, order.customer_name, order.product_name,
                    order.quantity, order.unit_price, order.total_amount,
                    order.tracking_number, order.shipped_date, 'shipped'
                ]);
                console.log(`✅ Inserted order: ${order.order_number}`);
            } catch (error) {
                console.log(`⚠️  Order ${order.order_number} might already exist: ${error.message}`);
            }
        }
    }

    async testDataRetrieval() {
        console.log('\n🔍 Testing data retrieval...');
        
        try {
            const client = await this.pool.connect();
            
            // Test the same query used by the API
            const query = `
                SELECT 
                    id, order_number, customer_name, product_name, quantity,
                    unit_price, total_amount, shipped_date, tracking_number, status
                FROM orders 
                WHERE status = 'shipped' 
                ORDER BY shipped_date DESC, id DESC
            `;
            
            const result = await client.query(query);
            
            console.log(`📦 Found ${result.rows.length} shipped orders`);
            
            if (result.rows.length > 0) {
                console.log('\n📊 Sample data:');
                result.rows.forEach((order, index) => {
                    console.log(`Order ${index + 1}:`);
                    console.log(`  - ID: ${order.id}`);
                    console.log(`  - Order Number: ${order.order_number}`);
                    console.log(`  - Customer: ${order.customer_name}`);
                    console.log(`  - Product: ${order.product_name}`);
                    console.log(`  - Quantity: ${order.quantity}`);
                    console.log(`  - Unit Price: $${parseFloat(order.unit_price).toFixed(2)}`);
                    console.log(`  - Total: $${parseFloat(order.total_amount).toFixed(2)}`);
                    console.log(`  - Shipped: ${order.shipped_date ? new Date(order.shipped_date).toLocaleDateString() : 'N/A'}`);
                    console.log(`  - Tracking: ${order.tracking_number || 'N/A'}`);
                    console.log(`  - Status: ${order.status}`);
                    console.log('');
                });
            }
            
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Data retrieval test failed:', error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('🧪 Starting Database Tests');
        console.log('=' * 50);
        
        const connectionTest = await this.testConnection();
        if (!connectionTest) {
            console.log('\n❌ Database connection failed. Please check your PG_DB_URL configuration.');
            return false;
        }
        
        const structureTest = await this.testTableStructure();
        if (!structureTest) {
            console.log('\n❌ Table structure test failed.');
            return false;
        }
        
        const dataTest = await this.testDataRetrieval();
        if (!dataTest) {
            console.log('\n❌ Data retrieval test failed.');
            return false;
        }
        
        console.log('\n✅ All database tests passed!');
        console.log('🚀 Your database is ready for the dashboard application.');
        return true;
    }

    async close() {
        await this.pool.end();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new DatabaseTester();
    
    tester.runAllTests()
        .then(() => {
            console.log('\n🏁 Test completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test failed:', error);
            process.exit(1);
        })
        .finally(() => {
            tester.close();
        });
}

module.exports = DatabaseTester;