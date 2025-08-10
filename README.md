# 📊 Analytics Projects Portfolio

A comprehensive analytics portfolio featuring automated data collection, interactive dashboards, and real-time monitoring across multiple financial projects.

## 🌟 Overview

This repository houses a collection of analytical projects with automated daily data collection and web-based dashboards. Each project is self-contained with its own data pipeline, analysis scripts, and interactive visualizations.

## 🚀 Live Website

**Portfolio Dashboard**: https://analytics-01.github.io

The website features:
- **Project Overview Cards**: Real-time metrics and status indicators
- **Interactive Dashboards**: Detailed analytics with Chart.js visualizations
- **Automated Updates**: Daily data refresh via GitHub Actions
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🏗️ Repository Structure

```
analytics-01.github.io/
├── docs/                           # GitHub Pages website
│   ├── index.html                  # Main portfolio landing page
│   ├── css/                        # Stylesheets
│   │   ├── main.css               # Global styles
│   │   └── dashboard.css          # Dashboard-specific styles
│   ├── js/                        # JavaScript modules
│   │   ├── utils.js               # Utility functions
│   │   ├── data-loader.js         # CSV parsing & data management
│   │   ├── main.js                # Landing page logic
│   │   └── dashboard.js           # Dashboard functionality
│   └── projects/                  # Individual project dashboards
│       └── IBIT_Call_Monitor/
│           ├── index.html         # Project dashboard
│           └── data/              # Project data files
├── projects/                      # Project source code
│   └── IBIT_Call_Monitor/
│       ├── scripts/               # Data collection scripts
│       ├── data/                  # Raw data storage
│       └── README.md              # Project documentation
├── .github/workflows/             # GitHub Actions automation
└── README.md                      # This file
```

## 📊 Current Projects

### 1. IBIT Call Monitor
**Status**: 🟢 Live & Active | **Last Updated**: Daily at 10 AM EST

**Description**: Comprehensive monitoring of IBIT call options with real-time pricing and Greeks analysis.

**Features**:
- Tracks one long-term call option ($85 Dec 2027)
- Real-time market data from Yahoo Finance
- Black-Scholes Greeks calculation
- Portfolio performance tracking
- Interactive charts and analytics
- Live web dashboard with automated data updates

**Tech Stack**: Python, yfinance, pandas, JavaScript, Chart.js

[View Project Details →](projects/IBIT_Call_Monitor/)

## 🤖 Automation

### GitHub Actions Workflows

All projects use automated data collection with the following schedule:
- **Frequency**: Monday-Friday (weekdays only)
- **Time**: 15:00 UTC (10:00 AM EST during DST)
- **Actions**:
  1. Execute project data collection scripts
  2. Update CSV data files
  3. Commit changes to repository
  4. Website automatically reflects new data

### Data Management
- **Storage**: CSV files for easy web consumption
- **Format**: Normalized data with consistent schemas
- **Retention**: Full historical data preservation
- **Caching**: Browser-side caching with 15-minute expiry

## 🎨 Website Features

### Landing Page
- **Project Cards**: Overview with key metrics and status indicators
- **Real-time Data**: Current returns, percentages, and timestamps
- **Status Indicators**: Green (fresh), yellow (stale), red (error)
- **Mini Charts**: Trend previews for projects with historical data

### Project Dashboards
- **Summary Cards**: Portfolio overview and key metrics
- **Interactive Charts**: Time-series analysis with multiple visualizations
- **Time Filters**: 7/30/90 days and all-time views
- **Data Tables**: Sortable, color-coded position details
- **Market Data**: Real-time market conditions and analytics

### Technical Implementation
- **Frontend**: Vanilla JavaScript, Chart.js for visualizations
- **Data Loading**: Direct CSV parsing with client-side caching
- **Responsive**: Mobile-first design with breakpoints
- **Performance**: Optimized loading and minimal dependencies

## 🛠️ Development

### Adding New Projects

1. **Create Project Structure**:
   ```bash
   mkdir -p projects/[PROJECT_NAME]/{scripts,data,notebooks}
   ```

2. **Implement Data Collection**:
   - Create Python script in `scripts/main.py`
   - Add `requirements.txt` for dependencies
   - Output data to `data/[project_name].csv`

3. **Add GitHub Actions**:
   ```yaml
   # .github/workflows/[project-name].yml
   - name: Run [Project Name]
     run: |
       cd projects/[PROJECT_NAME]/scripts
       python main.py
   ```

4. **Create Dashboard**:
   - Add project to `docs/js/data-loader.js`
   - Create dashboard at `docs/projects/[PROJECT_NAME]/index.html`

5. **Update Documentation**:
   - Project README in `projects/[PROJECT_NAME]/README.md`
   - Update main README with project details

### Local Development

1. **Clone Repository**:
   ```bash
   git clone https://github.com/[username]/analytics-01.github.io.git
   cd analytics-01.github.io
   ```

2. **Start Local Server**:
   ```bash
   cd docs
   python -m http.server 8000
   ```

3. **Access Website**:
   - Main page: `http://localhost:8000/`
   - Dashboard: `http://localhost:8000/projects/[PROJECT_NAME]/`

## 📋 Requirements

### Data Collection Scripts
- Python 3.8+
- Project-specific dependencies (see individual `requirements.txt`)

### Website
- Modern web browser with JavaScript enabled
- No server-side requirements (static site)

### GitHub Actions
- Repository with Actions enabled
- Appropriate API keys/secrets (if required by projects)

## 🔐 Security & Privacy

- **No Sensitive Data**: All data is publicly accessible market information
- **API Keys**: Stored as GitHub Secrets when required
- **Data Privacy**: No personal or confidential information collected

## 📈 Performance

- **Website Load Time**: < 2 seconds on average
- **Data Refresh**: Real-time on page load, cached for 15 minutes
- **Mobile Performance**: Optimized for mobile devices
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🤝 Contributing

This is a personal analytics portfolio, but suggestions and feedback are welcome:

1. **Issues**: Report bugs or suggest features via GitHub Issues
2. **Discussions**: Share ideas in GitHub Discussions
3. **Fork**: Feel free to fork and adapt for your own projects

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Contact

- **GitHub**: [Your GitHub Profile]
- **Email**: [Your Email]
- **LinkedIn**: [Your LinkedIn Profile]

---

**Last Updated**: June 18, 2025 | **Version**: 1.1.0 | **Status**: Live on GitHub Pages