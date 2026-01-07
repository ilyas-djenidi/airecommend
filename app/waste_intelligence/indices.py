import datetime
from typing import Dict, Any

class WastePressureIndexCalculator:
    def __init__(self):
        self.weights = {
            'fill_rate': 0.3,
            'time_since_collection': 0.25,
            'temperature': 0.15,
            'population_density': 0.1,
            'special_event': 0.2
        }
        
    def calculate_wpi(self, zone_state: Dict[str, Any], current_time: datetime.datetime) -> Dict[str, Any]:
        """
        Calculates WPI (0-10).
        zone_state: {
            'fill_level': 0.0-1.0,
            'last_collection': datetime,
            'temperature': float,
            'density_factor': float (0-1),
            'is_special_event': bool
        }
        """
        score = 0.0
        
        # 1. Fill Rate
        score += zone_state.get('fill_level', 0) * self.weights['fill_rate'] * 10
        
        # 2. Time Since Collection
        last_coll = zone_state.get('last_collection')
        if last_coll:
            hours = (current_time - last_coll).total_seconds() / 3600
            # Normalize: say 48 hours is max urgency
            time_score = min(1.0, hours / 48.0)
            score += time_score * self.weights['time_since_collection'] * 10
            
        # 3. Temperature (Odor risk)
        temp = zone_state.get('temperature', 20)
        temp_score = min(1.0, max(0, (temp - 15) / 25)) # 15C to 40C range
        score += temp_score * self.weights['temperature'] * 10
        
        # 4. Density
        score += zone_state.get('density_factor', 0.5) * self.weights['population_density'] * 10
        
        # 5. Events
        if zone_state.get('is_special_event'):
            score += 1.0 * self.weights['special_event'] * 10
            
        final_score = min(10.0, score)
        
        return {
            'wpi_score': round(final_score, 2),
            'urgency': 'Critical' if final_score > 8 else 'High' if final_score > 6 else 'Normal'
        }

class ZonePerformanceIndexCalculator:
    def __init__(self):
        # SNGID aligned weights
        self.weights = {
            'collection_efficiency': 0.25,
            'recycling_rate': 0.15,
            'citizen_satisfaction': 0.10,
            'cost_efficiency': 0.20,
            'safety': 0.05
        }
        
    def calculate_zpi(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculate ZPI (0-100).
        metrics keys usually 0-1 or normalized scores.
        """
        total = 0
        possible = 0
        
        for k, weight in self.weights.items():
            val = metrics.get(k, 0)
            total += val * weight * 100
            possible += weight * 100
            
        zpi = (total / possible) * 100 if possible > 0 else 0
        
        return {
            'zpi_score': round(zpi, 1),
            'grade': 'A' if zpi > 90 else 'B' if zpi > 75 else 'C' if zpi > 60 else 'D'
        }
