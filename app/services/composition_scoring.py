"""
Composition-Enhanced WPI (Waste Pressure Index) Scoring
Integrates AND 2018-2019 waste characterization data into decision logic
"""

import logging
from dataclasses import dataclass
from typing import Dict, Literal

from app.data.composition_profiles import estimate_composition, get_season, CompositionProfile

logger = logging.getLogger(__name__)

@dataclass
class WPIScore:
    """Waste Pressure Index with composition factors"""
    total_score: float
    organic_score: float
    recyclable_score: float
    seasonal_factor: float
    strategic_bonus: float
    composition_profile: CompositionProfile
    explanation_en: str
    explanation_ar: str
    explanation_fr: str

def calculate_composition_wpi(
    date_str: str,
    zone_name: str = "National Baseline",
    bioclimatic_zone: Literal["NORTHERN_COASTAL", "HIGH_PLATEAU", "SAHARAN"] = None,
    days_since_collection: int = 1,
    is_scheduled: bool = True
) -> WPIScore:
    """
    Calculate Waste Pressure Index using composition data.
    
    Args:
        date_str: Date in YYYY-MM-DD format
        zone_name: Human-readable zone name (for explanations)
        bioclimatic_zone: Bioclimatic zone classification
        days_since_collection: Days since last collection
        is_scheduled: Whether the zone is scheduled for collection today
    
    Returns:
        WPIScore with detailed breakdown and trilingual explanations
    """
    from datetime import datetime
    
    # 1. Estimate Composition
    profile = estimate_composition(date_str, bioclimatic_zone, days_since_collection)
    
    # 2. Calculate Organic Score (Sanitary Priority)
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    season = get_season(date_obj.month)
    
    # Urgency multiplier based on season
    if season == "SUMMER":
        urgency_mult = 1.3
    elif date_obj.month == 6:  # Ramadan check (simplified - actual dates vary)
        urgency_mult = 1.5
    else:
        urgency_mult = 1.0
    
    organic_score = (profile.organic_pct / 100.0) * urgency_mult
    
    # 3. Calculate Recyclable Score (Economic Priority)
    recyclable_score = (
        (profile.plastic_pct * 1.2) +  # High market value
        (profile.paper_pct * 1.0) +    # Moderate value
        (profile.metals_pct * 1.5)     # Highest value/kg
    ) / 100.0
    
    # 4. Composition Factor (60% sanitary, 40% economic)
    composition_factor = (organic_score * 0.6) + (recyclable_score * 0.4)
    
    # 5. Seasonal Factor
    seasonal_factors = {
        "WINTER": 1.0,
        "SPRING": 1.05,
        "SUMMER": 1.25,
        "AUTUMN": 1.05
    }
    seasonal_factor = seasonal_factors[season]
    
    # 6. Strategic Bonus
    strategic_bonus = 0.0
    
    recyclables_total = profile.plastic_pct + profile.paper_pct + profile.metals_pct
    if recyclables_total > 25.0:
        strategic_bonus += 2.0  # High recovery potential
    
    if days_since_collection >= 3 and profile.organic_pct > 60.0:
        strategic_bonus += 3.0  # Sanitary emergency
    
    if not is_scheduled and composition_factor < 0.5:
        strategic_bonus -= 1.0  # Penalty for off-schedule low-priority
    
    # 7. Total WPI
    base_pressure = 1.0 + (min(days_since_collection - 1, 3) * 0.5)
    total_score = (base_pressure * composition_factor * seasonal_factor) + strategic_bonus
    
    # 8. Generate Explanations
    explanation_en = _generate_explanation_en(
        zone_name, season, profile, days_since_collection,
        total_score, organic_score, recyclable_score,
        strategic_bonus
    )
    
    explanation_ar = _generate_explanation_ar(
        zone_name, season, profile, days_since_collection,
        total_score, organic_score, recyclable_score,
        strategic_bonus
    )
    
    explanation_fr = _generate_explanation_fr(
        zone_name, season, profile, days_since_collection,
        total_score, organic_score, recyclable_score,
        strategic_bonus
    )
    
    return WPIScore(
        total_score=round(total_score, 2),
        organic_score=round(organic_score, 2),
        recyclable_score=round(recyclable_score, 2),
        seasonal_factor=seasonal_factor,
        strategic_bonus=strategic_bonus,
        composition_profile=profile,
        explanation_en=explanation_en,
        explanation_ar=explanation_ar,
        explanation_fr=explanation_fr
    )

def _generate_explanation_en(zone_name, season, profile, days, total_score, org_score, rec_score, bonus):
    """Generate English explanation"""
    decision = "SERVICE (High Priority)" if total_score > 5.0 else \
               "SERVICE (Priority)" if total_score > 3.0 else \
               "SERVICE (Normal)" if total_score >= 0.8 else \
               "SKIP (Defer)"
    
    return f"""
DECISION: {decision}
Zone: {zone_name} - Waste Pressure Index: {total_score:.2f}

COMPOSITION ANALYSIS (AND 2018-2019 Study):
- Season: {season.title()} - Organic fraction: {profile.organic_pct:.1f}%
- Recyclables: {profile.plastic_pct:.1f}% plastic, {profile.paper_pct:.1f}% paper, {profile.metals_pct:.1f}% metals
- Days since last collection: {days} day(s)
- Estimated density: {profile.density_kg_m3:.0f} kg/m³

STRATEGIC IMPACT (SNGID 2035):
- Organic content supports composting/biogas valorization objectives
- Recyclables recovery potential: {(profile.plastic_pct + profile.paper_pct + profile.metals_pct):.1f}%
- Contributes to 30% national waste recovery target

DATA SOURCE: National waste characterization study (AND MODECOM 2018-2019)
Pilot wilayas: Jijel, Constantine, M'Sila, Ouargla
""".strip()

def _generate_explanation_ar(zone_name, season, profile, days, total_score, org_score, rec_score, bonus):
    """Generate Arabic explanation"""
    season_ar = {"WINTER": "شتاء", "SPRING": "ربيع", "SUMMER": "صيف", "AUTUMN": "خريف"}[season]
    decision_ar = "خدمة (أولوية عالية)" if total_score > 5.0 else \
                  "خدمة (أولوية)" if total_score > 3.0 else \
                  "خدمة (عادية)" if total_score >= 0.8 else \
                  "تأجيل"
    
    return f"""
القرار: {decision_ar}
المنطقة: {zone_name} - مؤشر ضغط النفايات: {total_score:.2f}

تحليل التركيبة (دراسة AND 2018-2019):
- الموسم: {season_ar} - نسبة النفايات العضوية: {profile.organic_pct:.1f}٪
- قابلة لإعادة التدوير: {profile.plastic_pct:.1f}٪ بلاستيك، {profile.paper_pct:.1f}٪ ورق، {profile.metals_pct:.1f}٪ معادن
- أيام منذ آخر جمع: {days} يوم
- الكثافة المقدرة: {profile.density_kg_m3:.0f} كغ/م³

الأثر الاستراتيجي (SNGID 2035):
- المحتوى العضوي يدعم أهداف التسميد/الغاز الحيوي
- إمكانات استرداد المواد القابلة لإعادة التدوير: {(profile.plastic_pct + profile.paper_pct + profile.metals_pct):.1f}٪
- يساهم في هدف 30٪ لاسترداد النفايات الوطنية

مصدر البيانات: الدراسة الوطنية لتوصيف النفايات (AND MODECOM 2018-2019)
الولايات التجريبية: جيجل، قسنطينة، المسيلة، ورقلة
""".strip()

def _generate_explanation_fr(zone_name, season, profile, days, total_score, org_score, rec_score, bonus):
    """Generate French explanation"""
    season_fr = {"WINTER": "Hiver", "SPRING": "Printemps", "SUMMER": "Été", "AUTUMN": "Automne"}[season]
    decision_fr = "SERVICE (Haute Priorité)" if total_score > 5.0 else \
                  "SERVICE (Priorité)" if total_score > 3.0 else \
                  "SERVICE (Normal)" if total_score >= 0.8 else \
                  "REPORT"
    
    return f"""
DÉCISION: {decision_fr}
Zone: {zone_name} - Indice de pression des déchets: {total_score:.2f}

ANALYSE DE COMPOSITION (Étude AND 2018-2019):
- Saison: {season_fr} - Fraction organique: {profile.organic_pct:.1f}%
- Recyclables: {profile.plastic_pct:.1f}% plastique, {profile.paper_pct:.1f}% papier, {profile.metals_pct:.1f}% métaux
- Jours depuis dernière collecte: {days} jour(s)
- Densité estimée: {profile.density_kg_m3:.0f} kg/m³

IMPACT STRATÉGIQUE (SNGID 2035):
- Le contenu organique soutient les objectifs de valorisation compost/biogaz
- Potentiel de récupération recyclables: {(profile.plastic_pct + profile.paper_pct + profile.metals_pct):.1f}%
- Contribue à l'objectif national de 30% de récupération des déchets

SOURCE DE DONNÉES: Étude nationale de caractérisation des déchets (AND MODECOM 2018-2019)
Wilayas pilotes: Jijel, Constantine, M'Sila, Ouargla
""".strip()
