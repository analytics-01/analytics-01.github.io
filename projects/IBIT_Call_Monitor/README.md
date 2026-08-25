# Multi-Asset ETF Call Monitor

A comprehensive monitoring system for IBIT (Bitcoin) and ETHA (Ethereum) long leap call options with cross-asset beta comparison, real-time pricing, Greeks analysis, and automated daily data collection.

## 📊 Overview

This project tracks the performance of crypto ETF long leap call options across different beta (delta) levels:

### IBIT Options (Bitcoin ETF)
- **$85 Call** (β≈0.6) expiring December 17, 2027 (purchased at $14.95) - Moderate Beta
- **$75 Call** (β≈0.8) expiring December 17, 2027 (estimated $22.50) - High Beta

### ETHA Options (Ethereum ETF)  
- **$25 Call** (β≈0.6) expiring December 17, 2027 (estimated $8.50) - Moderate Beta
- **$20 Call** (β≈0.8) expiring December 17, 2027 (estimated $12.00) - High Beta

**Strategy**: Compare Bitcoin vs Ethereum performance across beta sensitivity levels to analyze risk/reward efficiency and cross-asset correlation patterns.

## 🎯 Features

- **Multi-Asset Tracking**: Monitors IBIT (Bitcoin) and ETHA (Ethereum) ETF options simultaneously
- **Beta Strategy Comparison**: Compares 0.6 vs 0.8 delta sensitivity across both assets
- **Real-time Market Data**: Fetches current ETF prices and option pricing from Yahoo Finance
- **Greeks Calculation**: Computes Delta, Gamma, Theta, Vega, and Rho using Black-Scholes model
- **Cross-Asset Analytics**: Beta efficiency, correlation analysis, and risk/reward metrics
- **Portfolio Tracking**: Monitors returns across multiple positions and asset classes
- **Automated Collection**: Daily data updates via GitHub Actions for all positions
- **Enhanced Dashboard**: Interactive charts with multi-asset comparison and beta analysis

## 🏗️ Architecture

```
IBIT_Call_Monitor/
├── scripts/
│   ├── main.py           # Main data collection script
│   └── requirements.txt  # Python dependencies
├── data/
│   └── ibit_calls.csv   # Historical data (updated daily)
└── README.md            # This file
```

## 🚀 Usage

### Manual Execution
```bash
cd scripts
pip install -r requirements.txt
python main.py
```

### Automated Execution
The project runs automatically Monday-Friday at 10:00 AM EST via GitHub Actions.

## 📈 Data Schema

| Column | Description |
|--------|-------------|
| `timestamp` | Data collection timestamp |
| `ibit_price` | Current IBIT share price |
| `option_type` | Option type (call/put) |
| `strike_price` | Option strike price |
| `expiration_date` | Option expiration date |
| `time_to_expiration` | Years until expiration |
| `market_price` | Current option market price |
| `bid` | Current bid price |
| `ask` | Current ask price |
| `volume` | Daily trading volume |
| `open_interest` | Open interest |
| `implied_volatility` | Market implied volatility |
| `purchase_cost` | Original purchase price |
| `total_return` | Total dollar return |
| `return_percentage` | Percentage return |
| `delta` | Price sensitivity to underlying |
| `gamma` | Delta sensitivity |
| `theta` | Time decay |
| `vega` | Volatility sensitivity |
| `rho` | Interest rate sensitivity |

## 💰 Portfolio Summary

| Asset | Position | Strike | Beta Target | Expiration | Purchase Price | Contracts | Strategy |
|-------|----------|--------|-------------|------------|----------------|-----------|----------|
| IBIT | Bitcoin Call | $85 | 0.6 | Dec 17, 2027 | $14.95 | 1 | Moderate Beta |
| IBIT | Bitcoin Call | $75 | 0.8 | Dec 17, 2027 | $22.50* | 1 | High Beta |
| ETHA | Ethereum Call | $25 | 0.6 | Dec 17, 2027 | $8.50* | 1 | Moderate Beta |
| ETHA | Ethereum Call | $20 | 0.8 | Dec 17, 2027 | $12.00* | 1 | High Beta |

**Total Investment**: ~$5,795 (*estimated pricing for new positions)
**Strategy**: Multi-asset crypto exposure with beta sensitivity comparison across Bitcoin and Ethereum ETFs

## 🛠️ Technical Details

### Data Sources
- **IBIT Price**: Yahoo Finance (`IBIT`)
- **Option Data**: Yahoo Finance option chains
- **Greeks**: Calculated using Black-Scholes model with market implied volatility

### Dependencies
- `yfinance`: Market data collection
- `pandas`: Data manipulation
- `numpy`: Numerical calculations
- `scipy`: Statistical functions for Black-Scholes

### Risk-Free Rate
Currently using 4.39% (10-year Treasury rate as of implementation)

## 📊 Web Dashboard

Access the interactive dashboard at: `[GitHub Pages URL]/projects/IBIT_Call_Monitor/`

### Dashboard Features
- **Long Leap Focus**: Only displays calls with 1+ year to expiration
- **Summary Cards**: Total returns, current value, IBIT price
- **Interactive Charts**: Portfolio value, option prices, Greeks evolution
- **Time Filters**: 7 days, 30 days, 90 days, all time
- **Current Positions**: Real-time position details with color-coded returns
- **Market Data**: Current market conditions and implied volatility

## 🔄 Automation

### GitHub Actions Workflow
- **Schedule**: Monday-Friday at 15:00 UTC (10:00 AM EST)
- **Actions**: 
  1. Fetch latest market data
  2. Calculate Greeks and returns
  3. Append to CSV file
  4. Commit updates to repository
  5. Website automatically reflects new data

### Data Retention
- All historical data is preserved in the CSV file
- Each day adds one row per long leap option (currently 1 row per day)
- Historical data from expired options is preserved but filtered from dashboard
- No data deletion or archiving

## 📝 Notes

- **Long Leap Focus**: Only monitors call options with 1+ year to expiration for strategic long-term positioning
- **Automated Filtering**: Dashboard automatically filters out expired or short-term options
- Options data may not be available during market holidays
- Greeks calculations use theoretical Black-Scholes model
- Market prices may differ slightly from theoretical values due to bid-ask spreads and market sentiment
- All returns assume 100 shares per contract

## 🔧 Recent Updates (August 2025)

- ✅ **Fixed GitHub Actions errors**: Removed expired $60 call option causing collection failures
- ✅ **Enhanced timestamp parsing**: Robust handling of mixed timestamp formats
- ✅ **Long leap filtering**: Dashboard now only shows calls with 1+ year to expiration
- ✅ **Updated data**: Added current market data showing 7.9% return vs stale -1.2%
- ✅ **Cache handling**: Improved browser cache management for real-time updates 