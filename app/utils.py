import math
from datetime import datetime
from typing import Tuple

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371  # Radius of earth in kilometers. Use 3956 for miles
    return c * r

def minutes_to_time_str(total_minutes: int) -> str:
    """
    Convert total minutes from midnight to HH:MM format.
    Example: 480 -> "08:00"
    """
    hours = (total_minutes // 60) % 24
    minutes = total_minutes % 60
    return f"{hours:02d}:{minutes:02d}"

def time_str_to_minutes(time_str: str) -> int:
    """
    Convert HH:MM string to total minutes from midnight.
    Example: "08:00" -> 480
    """
    try:
        dt = datetime.strptime(time_str, "%H:%M")
        return dt.hour * 60 + dt.minute
    except ValueError:
        raise ValueError(f"Invalid time format: {time_str}. Expected HH:MM")
