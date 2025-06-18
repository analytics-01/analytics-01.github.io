// Utility Functions

// Format number as currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Format number as percentage
function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value / 100);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Get time ago string
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return `${minutes} minutes ago`;
    } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
        const days = Math.floor(diffInHours / 24);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
}

// Determine data freshness status
function getDataStatus(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours <= 24) {
        return 'green'; // Fresh data
    } else if (diffInHours <= 72) {
        return 'yellow'; // Somewhat stale
    } else {
        return 'red'; // Stale data
    }
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Local storage helpers
function setCache(key, data, expiryMinutes = 30) {
    const now = new Date();
    const expiry = new Date(now.getTime() + (expiryMinutes * 60 * 1000));
    
    const cacheData = {
        data: data,
        expiry: expiry.toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
}

function getCache(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const now = new Date();
    const expiry = new Date(cacheData.expiry);
    
    if (now > expiry) {
        localStorage.removeItem(key);
        return null;
    }
    
    return cacheData.data;
}

// Error handling
function handleError(error, context = '') {
    console.error(`Error ${context}:`, error);
    
    // You could extend this to send errors to a logging service
    // or display user-friendly error messages
}

// Show loading indicator
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Loading data...</div>';
    }
}

// Hide loading indicator
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
} 