from app.core.supabase import get_supabase_client
import json

def check():
    supabase = get_supabase_client()
    if not supabase:
        print("No supabase client")
        return
    
    try:
        # 0. Find a valid collector
        col_res = supabase.table("collectors").select("id").limit(1).execute()
        if not col_res.data:
            print("No collectors found! Cannot test routes.")
            return
        
        valid_collector = col_res.data[0]["id"]
        print(f"Using valid collector: {valid_collector}")

        # 1. Try to create a dummy route
        print("--- Testing Routes ---")
        dummy_route = {"date": "2026-01-08", "collector_id": valid_collector}
        res = supabase.table("routes").insert(dummy_route).execute()
        print(f"Route Insert Result: {res.data}")
        
        if res.data:
            route_id = res.data[0]["id"]
            print(f"--- Testing Route Stops for ID {route_id} ---")
            
            # 2. Try to insert a stop with just the bare minimum
            stop = {"route_id": route_id, "lat": 0, "lng": 0}
            try:
                res_stop = supabase.table("route_stops").insert(stop).execute()
                print(f"Stop Minimal Insert Result: {res_stop.data}")
            except Exception as e:
                print(f"Stop Minimal Insert Error: {e}")
                
            # 3. Try common sequence names
            for col in ["sequence", "seq", "order", "stop_order", "rank"]:
                try:
                   s = {"route_id": route_id, "lat": 0, "lng": 0, col: 1}
                   res_s = supabase.table("route_stops").insert(s).execute()
                   print(f"Column '{col}' exists!")
                except Exception as e:
                   if "PGRST204" in str(e):
                       print(f"Column '{col}' definitely MISSING.")
                   else:
                       print(f"Column '{col}' error: {e}")
        
    except Exception as e:
        print(f"Main Error: {e}")

if __name__ == "__main__":
    check()
