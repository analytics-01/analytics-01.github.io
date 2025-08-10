#!/usr/bin/env python3
"""
IBIT Call Monitor - Enhanced EOD Version
Monitors IBIT call options with end-of-day data collection
Includes market validation and holiday detection
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, date, timedelta
import pytz
import os
import sys
from scipy.stats import norm
import math


# Add parent directory to path for relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Options to monitor
OPTIONS = [
    {
        'strike': 85,
        'expiration': '2027-12-17',
        'purchase_cost': 14.95
    }
    # Removed the short-term $60 call option as it has expired
]

# Constants
RISK_FREE_RATE = 0.0439  # 4.39% - 10-year Treasury rate

def is_trading_day_today():
    """
    Simple check: weekday + not a major holiday
    Returns: (is_trading_day: bool, reason: str)
    """
    eastern = pytz.timezone('US/Eastern')
    today = datetime.now(eastern).date()
    
    # Check if it's a weekday (Monday=0, Sunday=6)
    if today.weekday() >= 5:  # Saturday or Sunday
        return False, f"Weekend: {today.strftime('%A, %B %d, %Y')}"
    
    # Major US market holidays (approximate dates)
    holidays_2025 = [
        date(2025, 1, 1),   # New Year's Day
        date(2025, 1, 20),  # MLK Day
        date(2025, 2, 17),  # Presidents Day
        date(2025, 4, 18),  # Good Friday
        date(2025, 5, 26),  # Memorial Day
        date(2025, 6, 19),  # Juneteenth
        date(2025, 7, 4),   # Independence Day
        date(2025, 9, 1),   # Labor Day
        date(2025, 11, 27), # Thanksgiving
        date(2025, 12, 25), # Christmas
    ]
    
    if today in holidays_2025:
        return False, f"Market Holiday: {today.strftime('%A, %B %d, %Y')}"
    
    return True, f"Trading Day: {today.strftime('%A, %B %d, %Y')}"

def get_current_ibit_price():
    """Get current/latest IBIT price"""
    try:
        ibit = yf.Ticker("IBIT")
        hist = ibit.history(period="2d", interval="1d")  # Get last 2 days to ensure we have data
        
        if len(hist) == 0:
            raise ValueError("No IBIT price data available")
        
        current_price = hist['Close'].iloc[-1]
        latest_date = hist.index[-1].date()
        
        eastern = pytz.timezone('US/Eastern')
        today = datetime.now(eastern).date()
        
        if latest_date == today:
            print(f"IBIT EOD price for {today}: ${current_price:.2f}")
        else:
            print(f"IBIT latest price ({latest_date}): ${current_price:.2f} (today's data not yet available)")
        
        return current_price
        
    except Exception as e:
        print(f"Error fetching IBIT price: {e}")
        raise

def get_option_data(strike, expiration_date):
    """Get option market data and calculate Greeks"""
    try:
        ibit = yf.Ticker("IBIT")
        
        # Get option chain
        options_chain = ibit.option_chain(expiration_date)
        calls = options_chain.calls
        
        # Find the specific strike
        option_data = calls[calls['strike'] == strike]
        
        if option_data.empty:
            raise ValueError(f"No option data found for ${strike} call expiring {expiration_date}")
        
        option_info = option_data.iloc[0]
        
        # Extract market data
        market_price = (option_info['bid'] + option_info['ask']) / 2
        bid = option_info['bid']
        ask = option_info['ask']
        volume = option_info['volume'] if not pd.isna(option_info['volume']) else 0
        open_interest = option_info['openInterest'] if not pd.isna(option_info['openInterest']) else 0
        implied_vol = option_info['impliedVolatility'] if not pd.isna(option_info['impliedVolatility']) else 0
        
        print(f"${strike} call - Market Price: ${market_price:.2f}, Bid: ${bid:.2f}, Ask: ${ask:.2f}, IV: {implied_vol:.1%}")
        
        return {
            'market_price': market_price,
            'bid': bid,
            'ask': ask,
            'volume': volume,
            'open_interest': open_interest,
            'implied_volatility': implied_vol
        }
        
    except Exception as e:
        print(f"Error fetching option data for ${strike} call: {e}")
        raise

def calculate_time_to_expiration(expiration_date):
    """Calculate time to expiration in years"""
    expiration = datetime.strptime(expiration_date, '%Y-%m-%d').date()
    today = date.today()
    days_to_expiration = (expiration - today).days
    return days_to_expiration / 365.25

def black_scholes_greeks(S, K, T, r, sigma, option_type='call'):
    """Calculate Black-Scholes Greeks"""
    try:
        if T <= 0 or sigma <= 0:
            return {'delta': 0, 'gamma': 0, 'theta': 0, 'vega': 0, 'rho': 0}
        
        d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)
        
        # Greeks calculations
        delta = norm.cdf(d1)
        gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))
        theta = -(S * norm.pdf(d1) * sigma / (2 * np.sqrt(T)) + 
                 r * K * np.exp(-r * T) * norm.cdf(d2)) / 365.25
        vega = S * norm.pdf(d1) * np.sqrt(T) / 100
        rho = K * T * np.exp(-r * T) * norm.cdf(d2) / 100
        
        return {
            'delta': delta,
            'gamma': gamma,
            'theta': theta,
            'vega': vega,
            'rho': rho
        }
    except Exception as e:
        print(f"Error calculating Greeks: {e}")
        return {'delta': 0, 'gamma': 0, 'theta': 0, 'vega': 0, 'rho': 0}

def save_daily_data(option_data, csv_file):
    """Save data with deduplication by date (EST)"""
    eastern = pytz.timezone('US/Eastern')
    
    # Add EST date for deduplication
    for data in option_data:
        # Convert timestamp to EST
        if isinstance(data['timestamp'], str):
            timestamp_utc = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
        else:
            timestamp_utc = data['timestamp']
        
        timestamp_et = timestamp_utc.astimezone(eastern)
        data['timestamp'] = timestamp_et.isoformat()
        data['date_est'] = timestamp_et.date().isoformat()
    
    # Load existing data
    if os.path.exists(csv_file):
        existing_df = pd.read_csv(csv_file)
        # Add date column for existing data if missing
        if 'date_est' not in existing_df.columns:
            # Handle mixed timestamp formats more robustly
            existing_df['date_est'] = pd.to_datetime(existing_df['timestamp'], format='mixed').dt.date.astype(str)
    else:
        existing_df = pd.DataFrame()
    
    # Convert new data to DataFrame
    new_df = pd.DataFrame(option_data)
    
    if not existing_df.empty:
        # Combine dataframes
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        
        # Remove duplicates: keep latest entry for each date + option combination
        combined_df = combined_df.sort_values('timestamp')
        combined_df = combined_df.drop_duplicates(
            subset=['date_est', 'strike_price', 'expiration_date'], 
            keep='last'
        )
    else:
        combined_df = new_df
    
    # Remove the helper date column before saving
    final_df = combined_df.drop('date_est', axis=1)
    
    # Save to CSV
    final_df.to_csv(csv_file, index=False)
    print(f"Saved {len(new_df)} new records to {csv_file}")
    print(f"Total records in file: {len(final_df)}")

def main():
    """Main execution with simplified trading day validation"""
    print("=== IBIT Call Monitor - EOD Version ===")
    
    # Check if today is a trading day
    is_trading_day, reason = is_trading_day_today()
    print(f"Market Status: {reason}")
    
    if not is_trading_day:
        print("Exiting: Not a trading day")
        return
    
    try:
        # Get current IBIT price
        ibit_price = get_current_ibit_price()
        
        # Get current timestamp in EST
        eastern = pytz.timezone('US/Eastern')
        timestamp = datetime.now(eastern)
        
        # Collect data for all options
        option_data = []
        
        for option in OPTIONS:
            print(f"\nProcessing ${option['strike']} call expiring {option['expiration']}...")
            
            try:
                # Get market data
                market_data = get_option_data(option['strike'], option['expiration'])
                
                # Calculate time to expiration
                time_to_exp = calculate_time_to_expiration(option['expiration'])
                
                # Calculate Greeks using market implied volatility
                greeks = black_scholes_greeks(
                    S=ibit_price,
                    K=option['strike'],
                    T=time_to_exp,
                    r=RISK_FREE_RATE,
                    sigma=market_data['implied_volatility']
                )
                
                # Calculate returns
                current_value = market_data['market_price'] * 100  # Contract value
                purchase_cost = option['purchase_cost'] * 100
                total_return = current_value - purchase_cost
                return_percentage = (total_return / purchase_cost) * 100 if purchase_cost > 0 else 0
                
                # Compile data record
                record = {
                    'timestamp': timestamp.isoformat(),
                    'ibit_price': ibit_price,
                    'option_type': 'call',
                    'strike_price': option['strike'],
                    'expiration_date': option['expiration'],
                    'time_to_expiration': time_to_exp,
                    'market_price': market_data['market_price'],
                    'bid': market_data['bid'],
                    'ask': market_data['ask'],
                    'volume': market_data['volume'],
                    'open_interest': market_data['open_interest'],
                    'implied_volatility': market_data['implied_volatility'],
                    'purchase_cost': option['purchase_cost'],
                    'total_return': total_return,
                    'return_percentage': return_percentage,
                    'delta': greeks['delta'],
                    'gamma': greeks['gamma'],
                    'theta': greeks['theta'],
                    'vega': greeks['vega'],
                    'rho': greeks['rho']
                }
                
                option_data.append(record)
                
                print(f"Success: ${option['strike']} call - Return: ${total_return:.0f} ({return_percentage:.1f}%)")
                
            except Exception as e:
                print(f"Error processing ${option['strike']} call: {e}")
                continue
        
        if option_data:
            # Save data
            csv_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'ibit_calls.csv')
            save_daily_data(option_data, csv_file)
            
            # Also copy to docs for website
            docs_csv = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'docs', 'projects', 'IBIT_Call_Monitor', 'data', 'ibit_calls.csv')
            os.makedirs(os.path.dirname(docs_csv), exist_ok=True)
            
            # Read the saved file and copy to docs
            final_df = pd.read_csv(csv_file)
            final_df.to_csv(docs_csv, index=False)
            print(f"Data copied to website: {docs_csv}")
            
            # Summary
            total_return = sum(record['total_return'] for record in option_data)
            print(f"\n=== Portfolio Summary ===")
            print(f"Total Return: ${total_return:.0f}")
            print(f"IBIT Price: ${ibit_price:.2f}")
            print(f"Timestamp: {timestamp.strftime('%Y-%m-%d %I:%M %p EST')}")
        else:
            print("No option data collected")
    
    except Exception as e:
        print(f"Error in main execution: {e}")
        raise
    
    print("=== IBIT Call Monitor - Complete ===")

if __name__ == "__main__":
    main() 