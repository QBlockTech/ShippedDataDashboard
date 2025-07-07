// Dashboard functionality
class OrdersDashboard {
    constructor() {
        this.orders = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOrders();
        this.checkHealthStatus();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadOrders());
        }

        // Auto-refresh every 5 minutes
        setInterval(() => this.loadOrders(), 5 * 60 * 1000);
    }

    async checkHealthStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            const statusElement = document.getElementById('connection-status');
            if (data.status === 'healthy') {
                statusElement.textContent = 'Connected';
                statusElement.className = 'status-connected';
            } else {
                statusElement.textContent = 'Disconnected';
                statusElement.className = 'status-disconnected';
            }
        } catch (error) {
            console.error('Health check failed:', error);
            const statusElement = document.getElementById('connection-status');
            statusElement.textContent = 'Connection Error';
            statusElement.className = 'status-disconnected';
        }
    }

    async loadOrders() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        this.hideError();

        try {
            console.log('🔄 Loading orders...');
            const response = await fetch('/api/orders');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch orders');
            }

            if (result.success) {
                this.orders = result.data || [];
                console.log(`📊 Loaded ${this.orders.length} orders`);
                this.renderOrders();
                this.updateLastUpdated();
            } else {
                throw new Error(result.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('❌ Error loading orders:', error);
            this.showError(`Failed to load orders: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    renderOrders() {
        const tbody = document.getElementById('orders-tbody');
        const orderCount = document.getElementById('order-count');
        const noDataElement = document.getElementById('no-data');
        const tableContainer = document.querySelector('.table-container');

        // Update order count
        orderCount.textContent = this.orders.length;

        if (this.orders.length === 0) {
            // Show no data message
            noDataElement.style.display = 'block';
            tableContainer.style.display = 'none';
            return;
        }

        // Hide no data message and show table
        noDataElement.style.display = 'none';
        tableContainer.style.display = 'block';

        // Clear existing rows
        tbody.innerHTML = '';

        // Render each order
        this.orders.forEach(order => {
            const row = this.createOrderRow(order);
            tbody.appendChild(row);
        });

        console.log(`✅ Rendered ${this.orders.length} orders in table`);
    }

    createOrderRow(order) {
        const row = document.createElement('tr');
        
        // Validate and format data
        const formatValue = (value, defaultValue = 'N/A') => {
            return (value !== null && value !== undefined && value !== '') ? value : defaultValue;
        };

        const formatCurrency = (value) => {
            if (value === null || value === undefined || value === '') return '$0.00';
            return `$${parseFloat(value).toFixed(2)}`;
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                return new Date(dateString).toLocaleDateString();
            } catch (error) {
                return dateString;
            }
        };

        row.innerHTML = `
            <td>${formatValue(order.id)}</td>
            <td>${formatValue(order.order_number)}</td>
            <td>${formatValue(order.customer_name)}</td>
            <td>${formatValue(order.product_name)}</td>
            <td>${formatValue(order.quantity)}</td>
            <td class="currency">${formatCurrency(order.unit_price)}</td>
            <td class="currency">${formatCurrency(order.total_amount)}</td>
            <td class="date">${formatDate(order.shipped_date)}</td>
            <td>${formatValue(order.tracking_number)}</td>
            <td><span class="status">${formatValue(order.status)}</span></td>
        `;

        return row;
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const refreshBtn = document.getElementById('refresh-btn');
        const btnText = refreshBtn.querySelector('.btn-text');
        const btnSpinner = refreshBtn.querySelector('.loading-spinner');

        loading.style.display = 'flex';
        refreshBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        const refreshBtn = document.getElementById('refresh-btn');
        const btnText = refreshBtn.querySelector('.btn-text');
        const btnSpinner = refreshBtn.querySelector('.loading-spinner');

        loading.style.display = 'none';
        refreshBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnSpinner.style.display = 'none';
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideError() {
        const errorElement = document.getElementById('error-message');
        errorElement.style.display = 'none';
    }

    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('last-updated');
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        lastUpdatedElement.textContent = `Last updated: ${timeString}`;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Orders Dashboard...');
    new OrdersDashboard();
});

// Handle visibility change to refresh data when tab becomes active
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('👁️ Tab became visible, checking for updates...');
        // Small delay to ensure the tab is fully active
        setTimeout(() => {
            if (window.dashboard) {
                window.dashboard.checkHealthStatus();
            }
        }, 500);
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled promise rejection:', event.reason);
});