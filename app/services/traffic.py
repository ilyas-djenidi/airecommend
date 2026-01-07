from typing import List, Tuple
from app.schemas.models import Route, TrafficAdvice, AffectedLeg

class TrafficService:
    @staticmethod
    def get_traffic_multiplier(time_min: int) -> float:
        """
        Returns traffic multiplier based on time of day (minutes from midnight).
        High: 08:00–09:30 (480-570), 16:00–18:00 (960-1080) -> *1.5
        Medium: 11:30–13:30 (690-810) -> *1.2
        Low: Otherwise -> *1.0
        """
        # Simple rule-based logic
        if (480 <= time_min < 570) or (960 <= time_min < 1080):
            return 1.5
        elif 690 <= time_min < 810:
            return 1.2
        return 1.0

    @staticmethod
    def get_traffic_level(multiplier: float) -> str:
        if multiplier >= 1.5:
            return "high"
        elif multiplier >= 1.2:
            return "medium"
        return "low"

    @staticmethod
    def generate_advice(routes: List[Route], date_str: str) -> TrafficAdvice:
        """
        Analyzes the generated routes and provides advice.
        """
        # 1. Identify bad legs
        affected_legs: List[AffectedLeg] = []
        for route in routes:
            for i, stop in enumerate(route.stops):
                if stop.traffic_level == "high":
                    # Determine 'from' ID
                    from_id = route.stops[i-1].container_id if i > 0 else "START"
                    affected_legs.append(AffectedLeg(
                        from_id=from_id,
                        to_id=stop.container_id,
                        traffic_level="high"
                    ))
        
        # Limit to top 5 distinctive
        affected_legs = affected_legs[:5]

        # 2. General advice
        advice_ar = "تجنب وسط المدينة بين 8-9:30 صباحاً و 4-6 مساءً لتفادي الازدحام."
        advice_en = "Avoid city center between 08:00-09:30 and 16:00-18:00 to skip peak traffic."

        if affected_legs:
            advice_en += f" High traffic detected on {len(affected_legs)} segments."

        return TrafficAdvice(
            recommendation_ar=advice_ar,
            recommendation_en=advice_en,
            affected_legs=affected_legs
        )
