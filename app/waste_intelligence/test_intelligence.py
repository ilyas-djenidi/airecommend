import datetime
from app.waste_intelligence.composition import AlgerianWasteCompositionAnalyzer
from app.waste_intelligence.indices import WastePressureIndexCalculator, ZonePerformanceIndexCalculator
from app.waste_intelligence.economics import CircularEconomyForecastEngine

def run_test():
    print("--- Testing Composition Analysis ---")
    analyzer = AlgerianWasteCompositionAnalyzer()
    comp = analyzer.estimate_composition('urban', 1000.0, datetime.date(2025, 3, 15)) # Ramadan
    print(f"Urban Waste Composition (Ramadan approx): {comp['organic']['percentage']:.1f}% Organic")
    
    print("\n--- Testing WPI ---")
    wpi_calc = WastePressureIndexCalculator()
    state = {
        'fill_level': 0.85,
        'last_collection': datetime.datetime.now() - datetime.timedelta(hours=24),
        'temperature': 30,
        'density_factor': 0.8,
        'is_special_event': False
    }
    wpi = wpi_calc.calculate_wpi(state, datetime.datetime.now())
    print(f"WPI Score: {wpi['wpi_score']} ({wpi['urgency']})")
    
    print("\n--- Testing Economics ---")
    econ = CircularEconomyForecastEngine()
    # Extract kg from composition for forecast
    comp_kg = {k: v['volume_kg'] for k, v in comp.items()}
    val = econ.forecast_value(comp_kg)
    print(f"Estimated Market Value: {val['total_value_dzd']:.2f} DZD")
    
    print("\nTest Complete.")

if __name__ == "__main__":
    run_test()
