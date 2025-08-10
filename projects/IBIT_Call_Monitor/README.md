# IBIT Long Leap Call Monitor

A comprehensive monitoring system for IBIT (iShares Bitcoin Trust) long leap call options with real-time pricing, Greeks analysis, and automated daily data collection.

## 📊 Overview

This project tracks the performance of IBIT long leap call options (1+ year to expiration):
- **$85 Call** expiring December 17, 2027 (purchased at $14.95)

**Note**: The $60 call option expiring July 31, 2025 has been removed as it expired. We now focus exclusively on long leap calls with 1+ year to expiration for strategic long-term positioning.

## 🎯 Features

- **Real-time Market Data**: Fetches current IBIT price and option pricing from Yahoo Finance
- **Greeks Calculation**: Computes Delta, Gamma, Theta, Vega, and Rho using Black-Scholes model
- **Portfolio Tracking**: Monitors total returns and percentage gains/losses
- **Automated Collection**: Daily data updates via GitHub Actions
- **Web Dashboard**: Interactive charts and analytics dashboard focused on long leap calls

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

| Position | Strike | Expiration | Purchase Price | Contracts | Type |
|----------|--------|------------|----------------|-----------|------|
| IBIT Call | $85 | Dec 17, 2027 | $14.95 | 1 | Long Leap |

**Total Investment**: $1,495
**Strategy**: Long leap calls for strategic Bitcoin exposure with extended time horizon

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