// Dashboard JavaScript

let projectData = null;
let currentTimeRange = 'all';
let currentMetric = 'dollar';
let charts = {};

document.addEventListener('DOMContentLoaded', async function() {
    // Set up event listeners
    setupEventListeners();
    
    // Load dashboard data
    await loadDashboard();
});

function setupEventListeners() {
    // Time range buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTimeRange = this.dataset.range;
            updateCharts();
        });
    });
    
    // Metric toggle buttons
    document.querySelectorAll('.metric-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMetric = this.dataset.metric;
            updateCharts();
        });
    });
}

async function loadDashboard() {
    try {
        showLoading('summaryCards');
        
        projectData = await dataLoader.loadProjectData('IBIT_Call_Monitor');
        
        if (projectData) {
            updateSummaryCards();
            updatePositionsTable();
            updateMarketData();
            createCharts();
            
            document.getElementById('lastUpdate').textContent = formatDate(projectData.lastUpdated);
        } else {
            showError('No data available for IBIT Call Monitor');
        }
    } catch (error) {
        handleError(error, 'loading dashboard');
        showError('Failed to load dashboard data');
    }
}

function updateSummaryCards() {
    const container = document.getElementById('summaryCards');
    const summary = projectData.summary;
    
    const cards = [
        {
            title: 'Total Return',
            value: formatCurrency(summary.totalReturn),
            class: summary.totalReturn >= 0 ? 'positive' : 'negative'
        },
        {
            title: 'Return Percentage',
            value: formatPercentage(summary.totalReturnPercentage),
            class: summary.totalReturnPercentage >= 0 ? 'positive' : 'negative'
        },
        {
            title: 'Current Value',
            value: formatCurrency(summary.totalCurrentValue),
            class: ''
        },
        {
            title: 'IBIT Price',
            value: `$${summary.ibitPrice.toFixed(2)}`,
            class: ''
        },
        {
            title: 'Positions',
            value: summary.positionCount.toString(),
            class: ''
        }
    ];
    
    container.innerHTML = cards.map(card => `
        <div class="summary-card">
            <h4>${card.title}</h4>
            <div class="value ${card.class}">${card.value}</div>
        </div>
    `).join('');
}

function updatePositionsTable() {
    const tbody = document.querySelector('#positionsTable tbody');
    const positions = projectData.positions;
    
    const rows = Object.keys(positions).map(optionKey => {
        const latest = positions[optionKey][0]; // Most recent data
        const returnClass = latest.total_return >= 0 ? 'return-positive' : 'return-negative';
        
        return `
            <tr>
                <td>$${latest.strike_price}</td>
                <td>${latest.expiration_date}</td>
                <td>$${latest.market_price.toFixed(2)}</td>
                <td>$${latest.purchase_cost.toFixed(2)}</td>
                <td class="${returnClass}">$${latest.total_return.toFixed(0)}</td>
                <td class="${returnClass}">${latest.return_percentage.toFixed(1)}%</td>
                <td>${latest.delta.toFixed(3)}</td>
                <td>${latest.gamma.toFixed(3)}</td>
                <td>${latest.theta.toFixed(3)}</td>
                <td>${(latest.implied_volatility * 100).toFixed(1)}%</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = rows.join('');
}

function updateMarketData() {
    const container = document.getElementById('marketData');
    const latest = projectData.rawData[0]; // Most recent entry
    
    container.innerHTML = `
        <h3>Current Market Data</h3>
        <div class="market-grid">
            <div class="market-item">
                <div class="label">IBIT Price</div>
                <div class="value">$${latest.ibit_price.toFixed(2)}</div>
            </div>
            <div class="market-item">
                <div class="label">Avg Impl. Vol</div>
                <div class="value">${(getAverageImpliedVol() * 100).toFixed(1)}%</div>
            </div>
            <div class="market-item">
                <div class="label">Time to Exp (Short)</div>
                <div class="value">${getShortestTimeToExp().toFixed(1)} years</div>
            </div>
            <div class="market-item">
                <div class="label">Total Portfolio</div>
                <div class="value">${formatCurrency(projectData.summary.totalCurrentValue)}</div>
            </div>
        </div>
    `;
}

function getAverageImpliedVol() {
    const positions = Object.values(projectData.positions);
    const totalVol = positions.reduce((sum, position) => sum + position[0].implied_volatility, 0);
    return totalVol / positions.length;
}

function getShortestTimeToExp() {
    const positions = Object.values(projectData.positions);
    return Math.min(...positions.map(position => position[0].time_to_expiration));
}

function getFilteredData() {
    if (currentTimeRange === 'all') {
        return projectData.rawData;
    }
    
    const days = parseInt(currentTimeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return projectData.rawData.filter(row => new Date(row.timestamp) >= cutoffDate);
}

function createCharts() {
    createPortfolioChart();
    createPricesChart();
    createGreeksChart();
    createVolatilityChart();
}

function createPortfolioChart() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    const data = getFilteredData();
    
    // Calculate portfolio value over time
    const timeData = calculatePortfolioValue(data);
    
    if (charts.portfolio) {
        charts.portfolio.destroy();
    }
    
    charts.portfolio = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeData.map(d => formatDate(d.timestamp)),
            datasets: [{
                label: currentMetric === 'dollar' ? 'Portfolio Value ($)' : 'Portfolio Return (%)',
                data: timeData.map(d => currentMetric === 'dollar' ? d.totalValue : d.totalReturnPercent),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: currentMetric === 'percent',
                    ticks: {
                        callback: function(value) {
                            return currentMetric === 'dollar' ? formatCurrency(value) : value.toFixed(1) + '%';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 8
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return currentMetric === 'dollar' ? formatCurrency(value) : value.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

function createPricesChart() {
    const ctx = document.getElementById('pricesChart').getContext('2d');
    const data = getFilteredData();
    
    const positions = projectData.positions;
    const datasets = Object.keys(positions).map((optionKey, index) => {
        const optionData = data.filter(d => `${d.strike_price}_${d.expiration_date}` === optionKey);
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b'];
        
        return {
            label: `$${positions[optionKey][0].strike_price} Call`,
            data: optionData.map(d => d.market_price),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            fill: false,
            tension: 0.4
        };
    });
    
    if (charts.prices) {
        charts.prices.destroy();
    }
    
    charts.prices = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => formatDate(d.timestamp)),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 8
                    }
                }
            }
        }
    });
}

function createGreeksChart() {
    const ctx = document.getElementById('greeksChart').getContext('2d');
    const data = getFilteredData();
    
    // Average Greeks across all positions
    const greeksData = data.map(row => {
        const timestamp = row.timestamp;
        const positionData = data.filter(d => d.timestamp === timestamp);
        
        const avgDelta = positionData.reduce((sum, d) => sum + d.delta, 0) / positionData.length;
        const avgGamma = positionData.reduce((sum, d) => sum + d.gamma, 0) / positionData.length;
        const avgTheta = positionData.reduce((sum, d) => sum + d.theta, 0) / positionData.length;
        
        return { timestamp, delta: avgDelta, gamma: avgGamma, theta: avgTheta };
    });
    
    // Remove duplicates by timestamp
    const uniqueGreeks = greeksData.filter((item, index, self) => 
        self.findIndex(t => t.timestamp === item.timestamp) === index
    );
    
    if (charts.greeks) {
        charts.greeks.destroy();
    }
    
    charts.greeks = new Chart(ctx, {
        type: 'line',
        data: {
            labels: uniqueGreeks.map(d => formatDate(d.timestamp)),
            datasets: [
                {
                    label: 'Delta',
                    data: uniqueGreeks.map(d => d.delta),
                    borderColor: '#667eea',
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Gamma',
                    data: uniqueGreeks.map(d => d.gamma),
                    borderColor: '#f093fb',
                    fill: false,
                    yAxisID: 'y1'
                },
                {
                    label: 'Theta',
                    data: uniqueGreeks.map(d => d.theta),
                    borderColor: '#4facfe',
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Delta'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Gamma / Theta'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                x: {
                    ticks: {
                        maxTicksLimit: 8
                    }
                }
            }
        }
    });
}

function createVolatilityChart() {
    const ctx = document.getElementById('volatilityChart').getContext('2d');
    const data = getFilteredData();
    
    const positions = projectData.positions;
    const datasets = Object.keys(positions).map((optionKey, index) => {
        const optionData = data.filter(d => `${d.strike_price}_${d.expiration_date}` === optionKey);
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b'];
        
        return {
            label: `$${positions[optionKey][0].strike_price} Call`,
            data: optionData.map(d => d.implied_volatility * 100),
            borderColor: colors[index % colors.length],
            fill: false,
            tension: 0.4
        };
    });
    
    if (charts.volatility) {
        charts.volatility.destroy();
    }
    
    charts.volatility = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => formatDate(d.timestamp)),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 8
                    }
                }
            }
        }
    });
}

function calculatePortfolioValue(data) {
    const timestamps = [...new Set(data.map(d => d.timestamp))].sort();
    
    return timestamps.map(timestamp => {
        const entriesAtTime = data.filter(d => d.timestamp === timestamp);
        const totalValue = entriesAtTime.reduce((sum, entry) => sum + (entry.market_price * 100), 0);
        const totalCost = entriesAtTime.reduce((sum, entry) => sum + (entry.purchase_cost * 100), 0);
        const totalReturn = entriesAtTime.reduce((sum, entry) => sum + entry.total_return, 0);
        const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
        
        return {
            timestamp,
            totalValue,
            totalCost,
            totalReturn,
            totalReturnPercent
        };
    });
}

function updateCharts() {
    if (projectData) {
        createCharts();
    }
}

function showError(message) {
    const container = document.getElementById('summaryCards');
    container.innerHTML = `<div class="error" style="grid-column: 1 / -1; text-align: center; color: #e74c3c; padding: 2rem;">${message}</div>`;
}

async function refreshData() {
    await loadDashboard();
} 