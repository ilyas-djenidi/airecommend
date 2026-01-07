"""
Waste Composition Profiles
Based on AND 2018-2019 National Characterization Study (MODECOM Methodology)
Covering 4 pilot wilayas: Jijel, Constantine, M'Sila, Ouargla
"""

from typing import Dict, Literal
from dataclasses import dataclass

Season = Literal["WINTER", "SPRING", "SUMMER", "AUTUMN"]
BioclimaticZone = Literal["NORTHERN_COASTAL", "HIGH_PLATEAU", "SAHARAN"]

@dataclass
class CompositionProfile:
    """Waste composition percentages and density"""
    organic_pct: float
    plastic_pct: float
    paper_pct: float
    textiles_pct: float
    glass_pct: float
    metals_pct: float
    other_pct: float
    density_kg_m3: float

# Seasonal Profiles (National Average)
SEASONAL_PROFILES: Dict[Season, CompositionProfile] = {
    "WINTER": CompositionProfile(
        organic_pct=60.0,
        plastic_pct=15.0,
        paper_pct=9.0,
        textiles_pct=4.5,
        glass_pct=3.5,
        metals_pct=2.5,
        other_pct=5.5,
        density_kg_m3=200.0
    ),
    "SPRING": CompositionProfile(
        organic_pct=56.0,
        plastic_pct=16.0,
        paper_pct=10.0,
        textiles_pct=5.0,
        glass_pct=3.5,
        metals_pct=2.5,
        other_pct=7.0,
        density_kg_m3=190.0
    ),
    "SUMMER": CompositionProfile(
        organic_pct=67.5,  # Peak organic due to fruits, tourism, Ramadan effects
        plastic_pct=14.0,
        paper_pct=8.0,
        textiles_pct=3.5,
        glass_pct=3.5,
        metals_pct=2.5,
        other_pct=1.0,
        density_kg_m3=215.0
    ),
    "AUTUMN": CompositionProfile(
        organic_pct=58.0,
        plastic_pct=15.0,
        paper_pct=10.0,
        textiles_pct=4.5,
        glass_pct=3.5,
        metals_pct=2.5,
        other_pct=6.5,
        density_kg_m3=195.0
    )
}

# Bioclimatic Zone Adjustments (multipliers applied to seasonal baseline)
ZONE_ADJUSTMENTS: Dict[BioclimaticZone, Dict[str, float]] = {
    "NORTHERN_COASTAL": {
        "organic_multiplier": 1.05,  # Higher fruit/veg consumption
        "plastic_multiplier": 1.10,  # Tourism packaging
        "density_multiplier": 1.0
    },
    "HIGH_PLATEAU": {
        "organic_multiplier": 0.95,
        "plastic_multiplier": 1.0,
        "density_multiplier": 0.90  # Drier climate
    },
    "SAHARAN": {
        "organic_multiplier": 0.85,  # Lower organic production
        "plastic_multiplier": 1.15,  # More packaged imports
        "density_multiplier": 0.85  # Low humidity
    }
}

def get_season(month: int) -> Season:
    """Determine season from month (1-12)"""
    if month in [12, 1, 2]:
        return "WINTER"
    elif month in [3, 4, 5]:
        return "SPRING"
    elif month in [6, 7, 8]:
        return "SUMMER"
    else:
        return "AUTUMN"

def get_composition_profile(season: Season, zone: BioclimaticZone = None) -> CompositionProfile:
    """
    Get waste composition profile for a given season and bioclimatic zone.
    If zone is None, returns national baseline.
    """
    base_profile = SEASONAL_PROFILES[season]
    
    if zone is None:
        return base_profile
    
    # Apply zone adjustments
    adjustments = ZONE_ADJUSTMENTS[zone]
    
    return CompositionProfile(
        organic_pct=base_profile.organic_pct * adjustments["organic_multiplier"],
        plastic_pct=base_profile.plastic_pct * adjustments["plastic_multiplier"],
        paper_pct=base_profile.paper_pct,  # Stable across zones
        textiles_pct=base_profile.textiles_pct,
        glass_pct=base_profile.glass_pct,
        metals_pct=base_profile.metals_pct,
        other_pct=base_profile.other_pct,
        density_kg_m3=base_profile.density_kg_m3 * adjustments["density_multiplier"]
    )

def estimate_composition(date_str: str, zone: BioclimaticZone = None, days_since_collection: int = 1) -> CompositionProfile:
    """
    Estimate waste composition for a given date, zone, and accumulation.
    
    Args:
        date_str: Date in YYYY-MM-DD format
        zone: Bioclimatic zone (optional, defaults to national baseline)
        days_since_collection: Days since last collection (affects organic decomposition)
    
    Returns:
        CompositionProfile with estimated percentages
    """
    from datetime import datetime
    
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    season = get_season(date_obj.month)
    
    base_profile = get_composition_profile(season, zone)
    
    # Accumulation factor: organic increases with time (fermentation)
    accumulation_factor = 1.0 + (min(days_since_collection - 1, 3) * 0.05)
    
    return CompositionProfile(
        organic_pct=min(base_profile.organic_pct * accumulation_factor, 75.0),  # Cap at 75%
        plastic_pct=base_profile.plastic_pct,
        paper_pct=base_profile.paper_pct,
        textiles_pct=base_profile.textiles_pct,
        glass_pct=base_profile.glass_pct,
        metals_pct=base_profile.metals_pct,
        other_pct=base_profile.other_pct,
        density_kg_m3=base_profile.density_kg_m3 * (1.0 + (min(days_since_collection - 1, 3) * 0.05))
    )
