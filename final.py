import subprocess
import pandas as pd
import re
from datetime import datetime, timedelta
import pytz
from scipy.stats import norm
import math
import numpy as np
import json
import os

# Run the JAR file and capture its output
process = subprocess.Popen(
    ["java", "-Ddebug=true", "-Dspeed=2.0", "-classpath", "./feed-play-1.0.jar", "hackathon.player.Main", "dataset.csv", "5001"],
    stdout=subprocess.PIPE
)

data_list = []
row_count = 0
# Read and process the continuous stream of data
while True:
    output = process.stdout.readline().decode().strip()
    data_string = output

    pattern = r"{([^}]*)}"
    result = re.findall(pattern, data_string)

    if result:
        data_dict = {}
        pairs = result[0].split(", ")
        for pair in pairs:
            key, value = pair.split("=")
            data_dict[key] = value
        data_list.append(data_dict)
        row_count += 1
        # Check for a termination condition
        # if some_condition:  # Replace with your termination condition
        #     break

    if row_count % 100 == 0:
        df = pd.DataFrame(data_list)
        if 'symbol' not in df.columns:
            continue

        column_name = 'symbol'
        def separate_parts(string):
            characters = re.search(r'[A-Za-z]+', string).group() if re.search(r'[A-Za-z]+', string) else ''
            match = re.search(r'\d+.*\d+', string)
            if match:
                date_num = match.group()
            else:
                date_num = ''

            date = re.search(r'\d{2}[A-Za-z]{3}', date_num).group() if re.search(r'\d{2}[A-Za-z]{3}', date_num) else ''
            numeric_part = re.sub(date, '', date_num)

            following_chars = re.sub(characters + date_num, '', string)

            return characters, date, numeric_part, following_chars

        new_columns = ['Stock', 'ExpiryDate', 'Strikeprice', 'PC']
        new_df = pd.DataFrame(columns=new_columns)

        for cell in df[column_name]:
            separated_parts = separate_parts(cell)
            new_df.loc[len(new_df)] = separated_parts

        insert_index = df.columns.get_loc(column_name) + 1
        df = pd.concat([df.iloc[:, :insert_index], new_df, df.iloc[:, insert_index:]], axis=1)

        def calculate_time_to_maturity(expiry_date):
            if pd.isna(expiry_date) or expiry_date.strip() == '':
                return None

            expiry_time = datetime.strptime(expiry_date, '%d%b')
            current_time = datetime.now(pytz.timezone('Asia/Kolkata'))
            expiry_datetime = datetime(current_time.year, expiry_time.month, expiry_time.day, 15, 30, tzinfo=pytz.timezone('Asia/Kolkata'))
            if current_time > expiry_datetime:
                expiry_datetime += timedelta(days=365)
            time_to_maturity = expiry_datetime - current_time
            return round(time_to_maturity.total_seconds() / 86400)

        df['TTM'] = df['ExpiryDate'].apply(calculate_time_to_maturity)

        df['TTM'] = df['TTM'].fillna(0)

        def calculate_implied_volatility(S, K, r, T, option_price, option_type, sigma):
            d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
            d2 = d1 - sigma * np.sqrt(T)

            if option_type == 'call':
                N_d1 = norm.cdf(d1)
                N_d2 = norm.cdf(d2)
                option_price_calc = S * N_d1 - K * np.exp(-r * T) * N_d2
            elif option_type == 'put':
                N_minus_d1 = norm.cdf(-d1)
                N_minus_d2 = norm.cdf(-d2)
                option_price_calc = K * np.exp(-r * T) * N_minus_d2 - S * N_minus_d1

            return option_price_calc - option_price

        df['LTP'] = pd.to_numeric(df['LTP'], errors='coerce')
        df['bestBid'] = pd.to_numeric(df['bestBid'], errors='coerce')
        df['prevClosePrice'] = pd.to_numeric(df['prevClosePrice'], errors='coerce')
        df['openInterest'] = pd.to_numeric(df['openInterest'], errors='coerce')
        df['prevOpenInterest'] = pd.to_numeric(df['prevOpenInterest'], errors='coerce')

        # Calculate the 'change' column
        df['change'] = np.where(df['prevClosePrice'] != 0, round((df['LTP'] - df['prevClosePrice']) / df['prevClosePrice'], 2), '-')

        # Calculate the 'Change in OI' column
        df['ChangeinOI'] = np.where(df['prevOpenInterest'] != 0, round((df['openInterest'] - df['prevOpenInterest']) / df['prevOpenInterest'], 2), '-')

        # Convert columns to numeric
        df['change'] = pd.to_numeric(df['change'], errors='coerce')
        df['ChangeinOI'] = pd.to_numeric(df['ChangeinOI'], errors='coerce')

        #Replace NaN values with '-'
        df.fillna('-', inplace=True)


        # Sample data from DataFrame
        S = df['LTP']  # Last Traded Price
        K = df['bestBid']  # Best Bid
        r = 0.05  # Risk-free interest rate
        option_price = df['LTP']  # Last Traded Price
        option_type = 'call'  # or 'put'

        # Append implied volatility column to DataFrame
        df['ImpliedVolatility'] = np.nan

        # Calculating implied volatility
        tolerance = 1e-6  # Tolerance level for convergence
        max_iterations = 100  # Maximum number of iterations

        for i in range(len(df)):
            T = df['TTM'][i]  # Time to maturity
            sigma = 0.5  # Initial guess for implied volatility
            for j in range(max_iterations):
                error = calculate_implied_volatility(S[i], K[i], r, T, option_price[i], option_type, sigma)
                if abs(error) < tolerance:
                    break
                d1_denominator = (sigma * np.sqrt(T))
                if d1_denominator != 0:
                    d1 = (np.log(S[i] / K[i]) + (r + 0.5 * sigma ** 2) * T) / d1_denominator
                    vega = S[i] * norm.pdf(d1) * np.sqrt(T)
                    sigma -= error / vega

            df.at[i, 'ImpliedVolatility'] = sigma
        
        #df_string = df.apply(lambda row: '{' + ', '.join([f"{col}={row[col]}" for col in df.columns]) + '}', axis=1)
        #result_string = ', '.join(df_string)

        # Replace colons with equals signs
        #result_string = result_string.replace(':', '=')

        #print(result_string)
        #print(df)
        #json_data = df.to_json(orient='records')
        data = df.to_json(orient='records')
        #file_path = 'output.json'
        #with open(file_path, 'w') as f:
            #f.write(json_data)

        #print(f"JSON data saved to {file_path}")
        #print(json_data)

        
        #data = json.loads(data)
        data1 = {"tasks": json.loads(data)}
        #tasks = [data]
        #output_data = {"tasks": tasks}
        with open("db.json", "w") as file:
            json.dump(data1, file, indent=4)
        data_list = []
        print("JSON file created successfully!")
    #stripped_data = data.strip("[]")
    #print(stripped_data)
# Terminate the subprocess
process.terminate()
