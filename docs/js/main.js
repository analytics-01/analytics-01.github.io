// Main JavaScript for Landing Page

document.addEventListener('DOMContentLoaded', async function() {
    await loadProjects();
});

async function loadProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    const lastUpdateElement = document.getElementById('lastUpdate');
    
    showLoading('projectsGrid');
    
    try {
        const availableProjects = dataLoader.getAvailableProjects();
        let mostRecentUpdate = null;
        
        // Clear grid
        projectsGrid.innerHTML = '';
        
        // Load each project
        for (const project of availableProjects) {
            const projectData = await dataLoader.loadProjectData(project.name);
            
            if (projectData) {
                const projectCard = createProjectCard(projectData);
                projectsGrid.appendChild(projectCard);
                
                // Track most recent update
                const updateTime = new Date(projectData.lastUpdated);
                if (!mostRecentUpdate || updateTime > mostRecentUpdate) {
                    mostRecentUpdate = updateTime;
                }
            } else {
                // Create card for project with no data
                const emptyCard = createEmptyProjectCard(project);
                projectsGrid.appendChild(emptyCard);
            }
        }
        
        // Update last update time
        if (mostRecentUpdate) {
            lastUpdateElement.textContent = formatDate(mostRecentUpdate.toISOString());
        } else {
            lastUpdateElement.textContent = 'No data available';
        }
        
    } catch (error) {
        handleError(error, 'loading projects');
        projectsGrid.innerHTML = '<div class="error">Failed to load projects. Please try again later.</div>';
    }
}

function createProjectCard(projectData) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const summary = projectData.summary;
    const status = getDataStatus(projectData.lastUpdated);
    const statusClass = status === 'green' ? 'status-green' : status === 'red' ? 'status-red' : 'status-gray';
    
    // Determine if returns are positive or negative
    const returnClass = summary.totalReturn >= 0 ? 'metric-positive' : 'metric-negative';
    const returnSign = summary.totalReturn >= 0 ? '+' : '';
    
    card.innerHTML = `
        <div class="project-header">
            <h3 class="project-title">${projectData.title}</h3>
            <div class="status-indicator ${statusClass}"></div>
        </div>
        
        <p class="project-description">${projectData.description}</p>
        
        <div class="project-metrics">
            <div class="metric">
                <div class="metric-value ${returnClass}">
                    ${returnSign}${formatCurrency(summary.totalReturn)}
                </div>
                <div class="metric-label">Total Return</div>
            </div>
            <div class="metric">
                <div class="metric-value ${returnClass}">
                    ${returnSign}${formatPercentage(summary.totalReturnPercentage)}
                </div>
                <div class="metric-label">Return %</div>
            </div>
        </div>
        

        
        <div class="project-footer">
            <span class="last-updated">Updated ${getTimeAgo(projectData.lastUpdated)}</span>
            <a href="projects/${projectData.projectName}/index.html" class="dashboard-btn">
                View Dashboard
            </a>
        </div>
    `;
    
    // Mini charts will be added later when we have more historical data
    
    return card;
}

function createEmptyProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    card.innerHTML = `
        <div class="project-header">
            <h3 class="project-title">${project.title}</h3>
            <div class="status-indicator status-gray"></div>
        </div>
        
        <p class="project-description">${project.description}</p>
        
        <div class="project-metrics">
            <div class="metric">
                <div class="metric-value">--</div>
                <div class="metric-label">Total Return</div>
            </div>
            <div class="metric">
                <div class="metric-value">--</div>
                <div class="metric-label">Return %</div>
            </div>
        </div>
        

        
        <div class="project-footer">
            <span class="last-updated">No data</span>
            <a href="projects/${project.name}/index.html" class="dashboard-btn">
                View Dashboard
            </a>
        </div>
    `;
    
    return card;
}

function createMiniChart(projectData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear the container
    container.innerHTML = '';
    
    // Create a simple canvas-based mini chart
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 100;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const data = projectData.rawData;
    
    if (data.length < 2) return;
    
    // Calculate total returns over time
    const timeData = [];
    const positions = projectData.positions;
    
    // Get unique timestamps
    const timestamps = [...new Set(data.map(d => d.timestamp))].sort();
    
    timestamps.forEach(timestamp => {
        let totalReturn = 0;
        Object.keys(positions).forEach(optionKey => {
            const optionData = positions[optionKey].find(d => d.timestamp === timestamp);
            if (optionData) {
                totalReturn += optionData.total_return;
            }
        });
        timeData.push({ timestamp, totalReturn });
    });
    
    if (timeData.length < 2) return;
    
    // Draw the mini chart
    const padding = 10;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    
    const minReturn = Math.min(...timeData.map(d => d.totalReturn));
    const maxReturn = Math.max(...timeData.map(d => d.totalReturn));
    const returnRange = maxReturn - minReturn || 1;
    
    // Draw baseline (zero line)
    if (minReturn <= 0 && maxReturn >= 0) {
        const zeroY = padding + chartHeight - ((0 - minReturn) / returnRange) * chartHeight;
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, zeroY);
        ctx.lineTo(padding + chartWidth, zeroY);
        ctx.stroke();
    }
    
    // Draw the line
    ctx.strokeStyle = timeData[timeData.length - 1].totalReturn >= 0 ? '#27ae60' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    timeData.forEach((point, index) => {
        const x = padding + (index / (timeData.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((point.totalReturn - minReturn) / returnRange) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Add a subtle fill
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = ctx.strokeStyle;
    const zeroY = padding + chartHeight - ((0 - minReturn) / returnRange) * chartHeight;
    ctx.lineTo(padding + chartWidth, zeroY);
    ctx.lineTo(padding, zeroY);
    ctx.closePath();
    ctx.fill();
}

// Refresh data function (can be called manually)
async function refreshData() {
    await loadProjects();
} 