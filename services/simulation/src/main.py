import time
import random
import requests
import json
import argparse

# Configuration
BACKEND_URL = "http://localhost:5001/api/simulation/data"
INTERVAL = 0.1  # Seconds between requests

# Simulation State
LINES = 6
line_states = {}
for i in range(1, LINES + 1):
    line_states[i] = {
        "batch_id": random.randint(100, 900),
        "product_count": 0
    }

def generate_wine_data(line_id, warehouse_id):
    state = line_states[line_id]
    state["product_count"] += 1
    
    # Change batch occasionally
    if state["product_count"] > random.randint(20, 50):
        state["batch_id"] += 1
        state["product_count"] = 1

    wine_type = random.choice(['white', 'red'])
    
    # Generate random values within realistic ranges based on the dataset
    data = {
        "warehouse_id": warehouse_id,
        "line_id": line_id,
        "batch_id": state["batch_id"],
        "product_number": state["product_count"],
        "product_id": f"W{warehouse_id}L{line_id}B{state['batch_id']}P{state['product_count']}",
        "type": wine_type,
        "fixed acidity": round(random.uniform(5.0, 10.0), 2),
        "volatile acidity": round(random.uniform(0.1, 1.0), 2),
        "citric acid": round(random.uniform(0.0, 0.8), 2),
        "residual sugar": round(random.uniform(0.6, 20.0), 2),
        "chlorides": round(random.uniform(0.01, 0.1), 3),
        "free sulfur dioxide": round(random.uniform(5, 70), 1),
        "total sulfur dioxide": round(random.uniform(10, 250), 1),
        "density": round(random.uniform(0.9900, 1.0050), 4),
        "pH": round(random.uniform(2.8, 3.8), 2),
        "sulphates": round(random.uniform(0.3, 1.0), 2),
        "alcohol": round(random.uniform(8.0, 14.0), 1)
    }
    return data

def main():
    parser = argparse.ArgumentParser(description='Wine Production Simulation')
    parser.add_argument('--warehouse', type=int, default=1, help='Warehouse ID to stream data to')
    parser.add_argument('--interval', type=float, default=1)
    args = parser.parse_args()
    
    warehouse_id = args.warehouse
    INTERVAL = args.interval
    print(f"Starting simulation for Warehouse {warehouse_id}. Sending data to {BACKEND_URL} every {INTERVAL} seconds.")
    
    while True:
        try:
            # Simulate a random line producing a bottle
            line_number = random.randint(1, LINES)
            line_id = warehouse_id * 100 + line_number
            
            # We need to maintain state for the logical line number, not the absolute line_id
            # But the generate_wine_data function uses line_id to look up state.
            # Let's adjust generate_wine_data to take line_number and use it for state, 
            # but return data with the calculated line_id.
            
            # Actually, let's just update the state dictionary to use the new line_ids
            # But we don't know the warehouse_id at the top level where line_states is defined.
            # So let's move state management inside main or make it dynamic.
            
            data = generate_wine_data(line_number, warehouse_id)
            # Override line_id in data
            data['line_id'] = line_id
            # Update product_id to reflect new line_id
            data['product_id'] = f"W{warehouse_id}L{line_id}B{data['batch_id']}P{data['product_number']}"
            
            print(f"Sending data: Warehouse {data['warehouse_id']} - Line {data['line_id']} - {data['product_id']} ({data['type']})")
            
            response = requests.post(BACKEND_URL, json=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"[Success] AI Prediction: Quality {result.get('quality_score', 'N/A')}")
            else:
                print(f"[Error] {response.status_code}: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("[Error]: Is the backend server running?")
        except Exception as e:
            print(f"[Error]: {e}")
            
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
