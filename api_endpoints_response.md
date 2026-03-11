# API Endpoints Analysis Report

This document contains the detailed report of the available GET endpoints and their response formats for the user `testuser001@example.com`, based on the testing performed.

## 1. User Profile & Lifestyle

### `GET /profile/`
**Description:** Returns the user's core profile information.
**Structure:**
```json
{
  "id": 52,
  "email": "testuser001@example.com",
  "name": "Test User",
  "current_pregnancy_week": 12,
  "pregnancy_start_date": "2025-12-01",
  "date_of_birth": "1990-01-01",
  "height": 178,
  "weight_pre_pregnancy": 70,
  "bmi": 22.09,
  "race": "caucasian",
  "country": "NG",
  "language": "en",
  "is_first_pregnancy": true,
  "tracking_enabled": true,
  "notifications_enabled": true,
  "auth_provider": "password",
  "is_active": true,
  "registered_at": "2026-02-23T19:31:45.658155Z"
}
```

### `GET /lifestyle/`
**Description:** Returns the user's lifestyle habits and preferences.
**Structure:**
```json
{
  "id": 41,
  "user": 52,
  "work_type": "Desk",
  "diet_type": "carnivore",
  "cooking_method": "gas",
  "average_sleep_hours": 7.5,
  "activity_duration_minutes": 150,
  "hydration_target_ml_per_day": 2200,
  "sleep_target_window": "22:00-06:00",
  "rest_microbreak_preference": "10min",
  "supplement_preferences": "ginger tea; moringa",
  "cooking_venue": "indoor",
  "ventilation_level": "medium",
  "commute_mode": "walk"
}
```

## 2. Health & Symptoms

### `GET /symptoms/baby/checklist/` & `GET /symptoms/mommy/checklist/`
**Description:** Returns a list of available symptoms for tracking.
**Structure:**
```json
{
  "symptoms": [
    { "id": 8, "name": "reduced fetal movement" }
  ]
}
```

### `GET /symptoms/baby/selection/` & `GET /symptoms/mommy/selection/`
**Description:** Returns recorded symptoms for a specific date (defaults to today if no date provided).
**Structure:**
```json
{
  "date": "2026-02-24",
  "symptom_ids": [] // Array of IDs
}
```

## 3. Environmental & Exposure Data

### `GET /air-exposure/`
**Description:** Returns current air quality and weather data.
**Structure:**
```json
{
  "id": 2334,
  "timestamp": "2026-02-23T18:00:00Z",
  "latitude": 52.23,
  "longitude": 21.01,
  "aqi": 1,
  "pm25": 3.46,
  "pm10": 4.82,
  "no2": 11.51,
  "so2": 5.28,
  "co": 206.88,
  "o3": 52.38,
  "temperature": 5.37,
  "humidity": 93,
  "pressure": 1006,
  "uvi": 0,
  "uvi_level": "low",
  "exposure_minutes": 57,
  "indoor": false
}
```

### `GET /exposure/history/`
**Description:** Returns historical exposure data.
**Structure:**
```json
{
  "start_date": "2026-02-18",
  "end_date": "2026-02-24",
  "days_requested": 7,
  "items": [
    { "date": "2026-02-23", "integrated_score": 2.925 }
  ]
}
```

### `GET /exposure-per-weeks/`
**Description:** Returns weekly aggregated exposure data.
**Structure:** `[]` (Empty in test, likely needs more historical data)

## 4. Recommendations & Meta Data

### `GET /advice/`
**Description:** Returns personalized health recommendations.
**Structure:**
```json
{
  "id": 174,
  "created_at": "2026-02-24T09:34:20.747709Z",
  "recommendations": [
    {
      "id": "tip.desk.stretch.v1",
      "title": "Workday tip",
      "message": "Every hour: stand up, roll shoulders, gentle neck stretch.",
      "category": "lifestyle",
      "severity": "info",
      "priority": 75,
      "ttl_hours": 24,
      "expires_at": "2026-02-25T09:34:20.747571+00:00"
    }
  ]
}
```

### `GET /meta/choices/`
**Description:** Returns lists of available options for dropdowns (languages, countries, etc.).
**Structure:**
```json
{
  "languages": [{ "value": "en", "label": "English" }],
  "countries": [{ "value": "NG", "label": "Nigeria" }],
  "work_types": [{ "value": "Desk", "label": "Desk", "emoji": "🪑" }],
  "diet_types": [{ "value": "carnivore", "label": "Carnivore", "emoji": "🥩" }],
  "cooking_methods": [{ "value": "wood", "label": "Wood", "emoji": "🪵" }],
  "exposure_levels": [{ "value": "Clean", "label": "Clean" }]
}
```

## 5. Summary Endpoint

### `GET /summary/`
**Description:** A comprehensive endpoint that aggregates data from multiple sources for the dashboard.
**Structure:**
```json
{
  "aq_weather_uv": { ... }, // Same as air-exposure
  "mom_exposure": {
    "id": 125,
    "exposure_level": 1,
    "risks": { "GDM": 1, "Preeclampsia": 1, ... }
  },
  "baby_exposure": {
    "id": 125,
    "exposure_level": 1,
    "risks": { ... }
  },
  "recommendations": [ ... ], // Same as advice
  "today_journey": { "distance_m": 0, "distance_km": 0 },
  "risks_delta": { "mom": -1.925, "baby": -1.925 },
  "week_info": {
    "week": 12,
    "text": "All major organs and limbs are in place..."
  },
  "exposure_history": { ... }, // Same as exposure/history
  "pollutant_compliance": { ... },
  "snapshot_id": 174
}
```

### `GET /info/current/`
**Structure:** `[]` (Empty in test)
