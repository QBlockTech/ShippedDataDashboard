# ShippedDataDashboard

Dashboard app that serves as a frontend to read and display shipped order data stored in the Neon database.

## Features

- **Real-time Order Display**: View all shipped orders in a clean, tabular format
- **Automatic Sorting**: Orders are sorted by most recently shipped first
- **Data Formatting**: Decimal values are rounded to 2 decimal places
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-refresh**: Dashboard updates every 5 minutes automatically
- **Health Monitoring**: Real-time database connection status
- **Error Handling**: Comprehensive error handling and validation

## Prerequisites

- Node.js (v14 or higher)
- Access to a Neon PostgreSQL database
- Database table with shipped order data

## Installation

1. Clone the repository:
```bash
git clone https://github.com/QBlockTech/ShippedDataDashboard.git
cd ShippedDataDashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your Neon database URL:
```
PG_DB_URL=postgresql://username:password@hostname:port/database_name
PORT=3000
```

## Database Setup

The application expects a table named `orders` with the following structure:

```sql
CREATE TABLE orders (
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
);
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Testing

### Test Database Connection
```bash
npm run test-db
```

This will:
- Test the database connection
- Verify the table structure
- Create sample data if the table is empty
- Validate data retrieval

### Manual Testing Steps

1. **Database Connection Test**:
   ```bash
   npm run test-db
   ```
   Expected: All tests should pass and sample data should be created

2. **Start the Application**:
   ```bash
   npm start
   ```
   Expected: Server should start on port 3000

3. **Access the Dashboard**:
   - Open `http://localhost:3000` in your browser
   - Expected: Dashboard loads with "Fulfilled Orders" header

4. **Check Health Status**:
   - Visit `http://localhost:3000/api/health`
   - Expected: JSON response with `{"status": "healthy"}`

5. **Test API Endpoint**:
   - Visit `http://localhost:3000/api/orders`
   - Expected: JSON response with orders data

6. **Verify Data Display**:
   - Check that orders are displayed in the table
   - Verify sorting (most recent first)
   - Confirm decimal formatting (2 decimal places)
   - Test refresh button functionality

## API Endpoints

- `GET /` - Dashboard homepage
- `GET /api/orders` - Retrieve all shipped orders
- `GET /api/health` - Health check endpoint

## Project Structure

```
ShippedDataDashboard/
├── public/
│   ├── index.html      # Dashboard frontend
│   ├── styles.css      # Styling
│   └── script.js       # Frontend JavaScript
├── src/
│   └── server.js       # Express server
├── test/
│   └── database-test.js # Database testing
├── .env.example        # Environment variables template
├── .gitignore         # Git ignore rules
├── package.json       # Project configuration
└── README.md          # This file
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PG_DB_URL` | PostgreSQL connection string for Neon database | Yes |
| `PORT` | Port number for the server (default: 3000) | No |

## Troubleshooting

### Database Connection Issues
- Verify your `PG_DB_URL` is correct
- Check that your Neon database is accessible
- Run `npm run test-db` to diagnose connection problems

### Application Won't Start
- Check that port 3000 is available
- Verify all dependencies are installed with `npm install`
- Check the console for error messages

### No Data Displayed
- Ensure your orders table has data with `status = 'shipped'`
- Check the browser console for JavaScript errors
- Verify the API endpoint returns data at `/api/orders`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the ISC License.
