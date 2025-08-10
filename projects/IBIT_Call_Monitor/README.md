# IBIT Call Monitor

A comprehensive monitoring system for IBIT (iShares Bitcoin Trust) call options with real-time pricing, Greeks analysis, and automated daily data collection.

## 📊 Overview

This project tracks the performance of two specific IBIT call options:
- **$85 Call** expiring December 17, 2027 (purchased at $14.95)
- **$60 Call** expiring July 31, 2025 (purchased at $3.35)

## 🎯 Features

- **Real-time Market Data**: Fetches current IBIT price and option pricing from Yahoo Finance
- **Greeks Calculation**: Computes Delta, Gamma, Theta, Vega, and Rho using Black-Scholes model
- **Portfolio Tracking**: Monitors total returns and percentage gains/losses
- **Automated Collection**: Daily data updates via GitHub Actions
- **Web Dashboard**: Interactive charts and analytics dashboard

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

| Position | Strike | Expiration | Purchase Price | Contracts |
|----------|--------|------------|----------------|-----------|
| IBIT Call | $85 | Dec 17, 2027 | $14.95 | 1 |

**Total Investment**: $1,495

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
- Each day adds one row per option (2 rows total)
- No data deletion or archiving

## 📝 Notes

- Options data may not be available during market holidays
- Greeks calculations use theoretical Black-Scholes model
- Market prices may differ slightly from theoretical values due to bid-ask spreads and market sentiment
- All returns assume 100 shares per contract 