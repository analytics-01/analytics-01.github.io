import yfinance as yf
import pandas as pd
import numpy as np
from scipy.stats import norm
from datetime import datetime, date
from pathlib import Path
import math

def black_scholes_greeks(S, K, T, r, sigma, option_type='call'):
    """
    Calculate Black-Scholes option price and Greeks
    
    Parameters:
    S: Current stock price
    K: Strike price
    T: Time to expiration (in years)
    r: Risk-free rate
    sigma: Volatility
    option_type: 'call' or 'put'
    
    Returns:
    Dictionary with price and Greeks
    """
    # Calculate d1 and d2
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    if option_type == 'call':
        # Call option price
        price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
        # Delta
        delta = norm.cdf(d1)
    else:
        # Put option price
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        # Delta
        delta = -norm.cdf(-d1)
    
    # Common Greeks
    gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))
    theta = (-S * norm.pdf(d1) * sigma / (2 * np.sqrt(T)) 
             - r * K * np.exp(-r * T) * norm.cdf(d2 if option_type == 'call' else -d2))
    theta = theta / 365  # Convert to per day
    vega = S * norm.pdf(d1) * np.sqrt(T) / 100  # Divide by 100 for 1% change
    rho = K * T * np.exp(-r * T) * norm.cdf(d2 if option_type == 'call' else -d2) / 100
    
    return {
        'price': price,
        'delta': delta,
        'gamma': gamma,
        'theta': theta,
        'vega': vega,
        'rho': rho
    }

def get_time_to_expiration(expiration_date):
    """Calculate time to expiration in years"""
    exp_date = datetime.strptime(expiration_date, '%Y-%m-%d').date()
    today = date.today()
    days_to_exp = (exp_date - today).days
    return days_to_exp / 365.0

def get_risk_free_rate():
    """Get current risk-free rate (using 10-year Treasury as proxy)"""
    try:
        treasury = yf.Ticker("^TNX")
        data = treasury.history(period="1d")
        return data['Close'].iloc[-1] / 100  # Convert percentage to decimal
    except:
        return 0.045  # Default to 4.5% if unable to fetch

def get_volatility(ticker, period="1y"):
    """Calculate historical volatility"""
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period=period)
        returns = np.log(data['Close'] / data['Close'].shift(1))
        volatility = returns.std() * np.sqrt(252)  # Annualized volatility
        return volatility
    except:
        return 0.60  # Default volatility for IBIT

def get_option_data(ticker, strike, expiration, option_type='call'):
    """Get real market option data"""
    try:
        stock = yf.Ticker(ticker)
        # Get options chain for the expiration date
        options_chain = stock.option_chain(expiration)
        
        if option_type == 'call':
            options_df = options_chain.calls
        else:
            options_df = options_chain.puts
            
        # Find the specific strike
        option_data = options_df[options_df['strike'] == strike]
        
        if not option_data.empty:
            option_info = option_data.iloc[0]
            return {
                'price': option_info.get('lastPrice', 0),
                'bid': option_info.get('bid', 0),
                'ask': option_info.get('ask', 0),
                'volume': option_info.get('volume', 0),
                'open_interest': option_info.get('openInterest', 0),
                'implied_volatility': option_info.get('impliedVolatility', 0),
                'delta': option_info.get('delta', 0),
                'gamma': option_info.get('gamma', 0),
                'theta': option_info.get('theta', 0),
                'vega': option_info.get('vega', 0),
                'rho': option_info.get('rho', 0)
            }
        else:
            print(f"No option data found for {strike} {option_type} expiring {expiration}")
            return None
            
    except Exception as e:
        print(f"Error fetching option data: {e}")
        return None

def run_analysis():
    """Main analysis function"""
    try:
        # Get IBIT current price
        ibit = yf.Ticker("IBIT")
        ibit_data = ibit.history(period="1d")
        current_price = ibit_data['Close'].iloc[-1]
        
        # Define target options with purchase costs
        options = [
            {"strike": 85, "expiration": "2027-12-17", "purchase_cost": 14.95},
            {"strike": 60, "expiration": "2025-07-31", "purchase_cost": 3.35}
        ]
        
        # Get real market data for each option
        results = []
        timestamp = datetime.now().isoformat()
        
        for option in options:
            time_to_exp = get_time_to_expiration(option['expiration'])
            
            if time_to_exp > 0:  # Only fetch if not expired
                # Get real market option data
                option_data = get_option_data("IBIT", option['strike'], option['expiration'], 'call')
                
                if option_data:
                    # Calculate returns based on market price (1 contract = 100 shares)
                    purchase_cost = option['purchase_cost']
                    market_price = option_data['price']
                    price_difference = market_price - purchase_cost
                    total_return = price_difference * 100  # 1 contract = 100 shares
                    return_percentage = (price_difference / purchase_cost) * 100 if purchase_cost > 0 else 0
                    
                    # Calculate Greeks using Black-Scholes with market implied volatility
                    risk_free_rate = get_risk_free_rate()
                    implied_vol = option_data['implied_volatility']
                    
                    # Use implied volatility if available, otherwise fall back to historical
                    if implied_vol > 0:
                        volatility_for_greeks = implied_vol
                    else:
                        volatility_for_greeks = get_volatility("IBIT")
                    
                    # Calculate Greeks using market conditions
                    calculated_greeks = black_scholes_greeks(
                        S=current_price,
                        K=option['strike'],
                        T=time_to_exp,
                        r=risk_free_rate,
                        sigma=volatility_for_greeks,
                        option_type='call'
                    )
                    
                    # Use market Greeks if available, otherwise use calculated ones
                    delta = option_data['delta'] if option_data['delta'] != 0 else calculated_greeks['delta']
                    gamma = option_data['gamma'] if option_data['gamma'] != 0 else calculated_greeks['gamma']
                    theta = option_data['theta'] if option_data['theta'] != 0 else calculated_greeks['theta']
                    vega = option_data['vega'] if option_data['vega'] != 0 else calculated_greeks['vega']
                    rho = option_data['rho'] if option_data['rho'] != 0 else calculated_greeks['rho']
                    
                    # Create one row per option
                    option_result = {
                        'timestamp': timestamp,
                        'ibit_price': current_price,
                        'option_type': 'call',
                        'strike_price': option['strike'],
                        'expiration_date': option['expiration'],
                        'time_to_expiration': time_to_exp,
                        'market_price': market_price,
                        'bid': option_data['bid'],
                        'ask': option_data['ask'],
                        'volume': option_data['volume'],
                        'open_interest': option_data['open_interest'],
                        'implied_volatility': option_data['implied_volatility'],
                        'purchase_cost': purchase_cost,
                        'total_return': total_return,
                        'return_percentage': return_percentage,
                        'delta': delta,
                        'gamma': gamma,
                        'theta': theta,
                        'vega': vega,
                        'rho': rho
                    }
                else:
                    # Fallback if option data not available
                    purchase_cost = option['purchase_cost']
                    total_return = -purchase_cost * 100  # Total loss for 1 contract
                    option_result = {
                        'timestamp': timestamp,
                        'ibit_price': current_price,
                        'option_type': 'call',
                        'strike_price': option['strike'],
                        'expiration_date': option['expiration'],
                        'time_to_expiration': time_to_exp,
                        'market_price': 0,
                        'bid': 0,
                        'ask': 0,
                        'volume': 0,
                        'open_interest': 0,
                        'implied_volatility': 0,
                        'purchase_cost': purchase_cost,
                        'total_return': total_return,
                        'return_percentage': -100,
                        'delta': 0,
                        'gamma': 0,
                        'theta': 0,
                        'vega': 0,
                        'rho': 0
                    }
            else:
                # Option expired - total loss
                purchase_cost = option['purchase_cost']
                total_return = -purchase_cost * 100  # Total loss for 1 contract
                option_result = {
                    'timestamp': timestamp,
                    'ibit_price': current_price,
                    'option_type': 'call',
                    'strike_price': option['strike'],
                    'expiration_date': option['expiration'],
                    'time_to_expiration': 0,
                    'market_price': 0,
                    'bid': 0,
                    'ask': 0,
                    'volume': 0,
                    'open_interest': 0,
                    'implied_volatility': 0,
                    'purchase_cost': purchase_cost,
                    'total_return': total_return,
                    'return_percentage': -100,
                    'delta': 0,
                    'gamma': 0,
                    'theta': 0,
                    'vega': 0,
                    'rho': 0
                }
            
            results.append(option_result)
        
        return results
        
    except Exception as e:
        print(f"Error in analysis: {e}")
        return None

def save_results(results):
    """Save results to CSV file"""
    if results is None or len(results) == 0:
        print("No results to save")
        return
    
    # Create data directory if it doesn't exist
    data_path = Path('../data')
    data_path.mkdir(parents=True, exist_ok=True)
    
    csv_path = data_path / 'ibit_calls.csv'
    
    # Convert results to DataFrame
    new_rows = pd.DataFrame(results)
    
    # Append to existing CSV or create new one
    if csv_path.exists():
        new_rows.to_csv(csv_path, mode='a', header=False, index=False)
        print(f"Results appended to {csv_path}")
    else:
        new_rows.to_csv(csv_path, index=False)
        print(f"New CSV file created at {csv_path}")

def main():
    """Main function"""
    print("Starting IBIT Call Monitor analysis...")
    results = run_analysis()
    
    if results and len(results) > 0:
        # Print summary from first result
        print(f"IBIT Price: ${results[0]['ibit_price']:.2f}")
        print(f"Analyzed {len(results)} options")
        print()
        
        # Print detailed information for each option
        for result in results:
            print(f"${result['strike_price']} call ({result['expiration_date']}) - 1 Contract:")
            print(f"  Market Price: ${result['market_price']:.2f} per share (Contract Value: ${result['market_price']*100:.0f})")
            print(f"  Bid/Ask: ${result['bid']:.2f}/${result['ask']:.2f}")
            print(f"  Volume: {result['volume']:,}")
            print(f"  Open Interest: {result['open_interest']:,}")
            print(f"  Implied Vol: {result['implied_volatility']:.1%}")
            print(f"  Purchase Cost: ${result['purchase_cost']:.2f} per share (Contract Cost: ${result['purchase_cost']*100:.0f})")
            print(f"  Total Return: ${result['total_return']:.0f} ({result['return_percentage']:.1f}%)")
            print(f"  Greeks - Delta: {result['delta']:.3f}, Gamma: {result['gamma']:.3f}, Theta: {result['theta']:.3f}")
            print(f"  Greeks - Vega: {result['vega']:.3f}, Rho: {result['rho']:.3f}")
            print()
        
        save_results(results)
        print("Analysis completed successfully!")
    else:
        print("Analysis failed!")

if __name__ == "__main__":
    main() 