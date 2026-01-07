import datetime
from typing import Dict, List, Any

class CircularEconomyForecastEngine:
    def __init__(self):
        self.market_prices = {
            'plastic': 45.0, # DZD/kg
            'paper': 30.0,
            'metal': 120.0,
            'glass': 20.0,
            'organic': 5.0 # Compost value
        }
        
    def forecast_value(self, composition_kg: Dict[str, float], days=7) -> Dict[str, Any]:
        result = {'total_value_dzd': 0, 'details': {}}
        
        for mat, kg in composition_kg.items():
            price = self.market_prices.get(mat, 0)
            val = kg * price
            result['total_value_dzd'] += val
            result['details'][mat] = {
                'estimated_kg': kg,
                'unit_price': price,
                'value': val
            }
            
        return result

class WasteToResourceOptimizer:
    def __init__(self):
        pass
        
    def optimize_recovery(self, waste_stream: Dict[str, float]):
        """
        waste_stream: {'plastic': 1000, 'organic': 5000...}
        """
        # Simple rule-based checking for demo
        recommendations = []
        
        if waste_stream.get('organic', 0) > 1000:
             recommendations.append({
                 'material': 'organic',
                 'pathway': 'Composting',
                 'roi_years': 1.5,
                 'potential_value': waste_stream['organic'] * 5.0
             })
             
        if waste_stream.get('plastic', 0) > 500:
            recommendations.append({
                'material': 'plastic',
                'pathway': 'Mechanical Recycling',
                'roi_years': 2.0,
                'potential_value': waste_stream['plastic'] * 45.0
            })
            
        return recommendations
