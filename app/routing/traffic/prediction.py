import numpy as np
import datetime
from typing import Dict, List, Any, Tuple
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Input, LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam
except ImportError:
    tf = None
    print("TensorFlow not installed. LSTM features will be disabled.")

class AlgerianTrafficFactors:
    def __init__(self):
        # Mock data for demonstration
        self.prayer_times = {
            "Fajr": datetime.time(5, 30),
            "Dhuhr": datetime.time(12, 30),
            "Asr": datetime.time(15, 30),
            "Maghrib": datetime.time(18, 00),
            "Isha": datetime.time(19, 30)
        }
        self.market_days = [1, 4] # Mon, Thu (Example)
        
    def _is_prayer_time(self, dt: datetime.datetime) -> bool:
        t = dt.time()
        # Check within 20 mins of prayer
        for p_name, p_time in self.prayer_times.items():
            # Simple check ignoring date boundary for now
            if abs(t.hour * 60 + t.minute - (p_time.hour * 60 + p_time.minute)) < 20:
                return True
        return False

    def get_traffic_multiplier(self, dt: datetime.datetime, location_context: Dict = None) -> float:
        """Get traffic multiplier based on Algerian factors"""
        base = 1.0
        
        # Rush hours
        h = dt.hour
        if 7 <= h <= 9 or 16 <= h <= 18:
            base *= 1.5
            
        # Prayer times
        if self._is_prayer_time(dt):
            # Slow down near mosques or stop
            base *= 0.8 
            
        # Friday Prayer (approx 12:00 - 14:00)
        if dt.weekday() == 4 and 12 <= h <= 13:
            base *= 0.4 # Empty roads during prayer
            
        # Ramadan (Placeholder logic)
        # if is_ramadan(dt):
        #     if is_iftar(dt): base *= 0.1
        
        return base

class LSTMTrafficPredictor:
    def __init__(self, sequence_length=24, hidden_units=64):
        self.sequence_length = sequence_length
        self.model = self._build_model(sequence_length, hidden_units) if tf else None
        
    def _build_model(self, sequence_length, hidden_units):
        model = Sequential([
            Input(shape=(sequence_length, 8)),
            LSTM(hidden_units, return_sequences=True),
            LSTM(hidden_units // 2, return_sequences=False),
            Dense(32, activation='relu'),
            Dense(1) # Predict speed
        ])
        model.compile(optimizer='adam', loss='mse')
        return model
    
    def predict_speed(self, segment_features: np.ndarray) -> float:
        if self.model is None:
            return 30.0 # Default fallback
        
        # Expect (1, seq_len, 8)
        pred = self.model.predict(segment_features, verbose=0)
        return float(pred[0][0])

class TrafficInferenceEngine:
    def __init__(self):
        pass
        
    def infer_traffic(self, truck_positions: List[Dict]) -> Dict[int, float]:
        """
        Infer speed on segments based on truck clusters.
        Returns: {segment_id: speed_kmh}
        """
        # simplified clustering
        inferred = {}
        # ... implementation of DBSCAN logic or simple spatial binning
        return inferred
