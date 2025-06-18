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
    
    // Removed sensitive dollar amounts - only showing percentages and market data
    const cards = [
        {
            title: 'Total Return %',
            value: formatPercentage(summary.totalReturnPercentage),
            class: summary.totalReturnPercentage >= 0 ? 'positive' : 'negative'
        },
        {
            title: 'IBIT Price',
            value: `$${summary.ibitPrice.toFixed(2)}`,
            class: ''
        },
        {
            title: 'Active Positions',
            value: summary.positionCount.toString(),
            class: ''
        },
        {
            title: 'Avg Implied Vol',
            value: `${(getAverageImpliedVol() * 100).toFixed(1)}%`,
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
        const returnClass = latest.return_percentage >= 0 ? 'return-positive' : 'return-negative';
        
        return `
            <tr>
                <td>$${latest.strike_price}</td>
                <td>${latest.expiration_date}</td>
                <td>$${latest.market_price.toFixed(2)}</td>
                <td class="${returnClass}">${latest.return_percentage.toFixed(1)}%</td>
                <td>${latest.delta.toFixed(3)}</td>
                <td>${latest.gamma.toFixed(3)}</td>
                <td>${latest.theta.toFixed(3)}</td>
                <td>${latest.vega.toFixed(3)}</td>
                <td>${(latest.implied_volatility * 100).toFixed(1)}%</td>
                <td>${latest.time_to_expiration.toFixed(2)} yrs</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = rows.join('');
}

function updateMarketData() {
    const container = document.getElementById('marketData');
    const latest = projectData.rawData[0]; // Most recent entry
    
    container.innerHTML = `
        <h3>Market Overview</h3>
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
                <div class="label">Shortest Time to Exp</div>
                <div class="value">${getShortestTimeToExp().toFixed(2)} years</div>
            </div>
            <div class="market-item">
                <div class="label">Last Updated</div>
                <div class="value">${formatDate(latest.timestamp)}</div>
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
    
    const positions = projectData.positions;
    const datasets = Object.keys(positions).map((optionKey, index) => {
        const optionData = data.filter(d => `${d.strike_price}_${d.expiration_date}` === optionKey);
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b'];
        
        return {
            label: `$${positions[optionKey][0].strike_price} Call Return (%)`,
            data: optionData.map(d => d.return_percentage),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            fill: true,
            tension: 0.4
        };
    });
    
    if (charts.portfolio) {
        charts.portfolio.destroy();
    }
    
    charts.portfolio = new Chart(ctx, {
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
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return context.dataset.label + ': ' + value.toFixed(1) + '%';
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
    
    const positions = projectData.positions;
    const datasets = [];
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#ff9a56', '#6c5ce7'];
    let colorIndex = 0;
    
    // Create datasets for each Greek for each position
    Object.keys(positions).forEach((optionKey, positionIndex) => {
        const optionData = data.filter(d => `${d.strike_price}_${d.expiration_date}` === optionKey);
        const strikePrice = positions[optionKey][0].strike_price;
        
        // Delta for this position
        datasets.push({
            label: `Delta $${strikePrice}`,
            data: optionData.map(d => d.delta),
            borderColor: colors[colorIndex % colors.length],
            fill: false,
            yAxisID: 'y',
            tension: 0.4
        });
        colorIndex++;
        
        // Gamma for this position  
        datasets.push({
            label: `Gamma $${strikePrice}`,
            data: optionData.map(d => d.gamma),
            borderColor: colors[colorIndex % colors.length],
            fill: false,
            yAxisID: 'y1',
            tension: 0.4
        });
        colorIndex++;
        
        // Theta for this position
        datasets.push({
            label: `Theta $${strikePrice}`,
            data: optionData.map(d => d.theta),
            borderColor: colors[colorIndex % colors.length],
            fill: false,
            yAxisID: 'y1',
            tension: 0.4
        });
        colorIndex++;
    });
    
    if (charts.greeks) {
        charts.greeks.destroy();
    }
    
    charts.greeks = new Chart(ctx, {
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