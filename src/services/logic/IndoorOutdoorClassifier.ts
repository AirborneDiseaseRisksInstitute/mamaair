import axios from 'axios';

type LocationState = 'Indoor' | 'Outdoor' | 'Unknown';

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
}

interface ApiResult {
  distance: number;
  isBuilding: boolean;
}

export class IndoorOutdoorClassifier {
  private readonly HERE_API_KEY = '1oqPEcwVKjK_73UMrDI2JkfXFV4_kCiQKg5H4IKcM5k';
  private readonly THRESHOLDS = {
    goodAccuracy: 30.0,
    indoorDistance: 35.0,
    outdoorDistance: 55.0,
  };

  // State
  private lastApiCheckTime = 0;
  private lastApiCheckLocation: { latitude: number; longitude: number } | null = null;
  private speedBuffer: number[] = [];
  private stateHistory: LocationState[] = [];
  private lastApiBasedState: LocationState = 'Unknown';

  // Constants for "sufficient time/distance"
  private readonly MIN_TIME_BETWEEN_API_CALLS = 60 * 1000; // 60 seconds
  private readonly MIN_DISTANCE_BETWEEN_API_CALLS = 50; // 50 meters

  private static instance: IndoorOutdoorClassifier;

  public static getInstance(): IndoorOutdoorClassifier {
    if (!IndoorOutdoorClassifier.instance) {
      IndoorOutdoorClassifier.instance = new IndoorOutdoorClassifier();
    }
    return IndoorOutdoorClassifier.instance;
  }

  public async classify(location: Coords): Promise<LocationState> {
    const rawState = await this.getRawState(location);
    this.addToHistory(rawState);
    return this.getMajorityVote();
  }

  private async getRawState(location: Coords): Promise<LocationState> {
    // 1. Check Accuracy
    if (location.accuracy > 80.0) {
      return 'Unknown';
    }

    // Update Speed Buffer (Moving Average)
    this.updateSpeedBuffer(location.speed);

    // Night Mode Rule
    // "If speed == 0 AND time is between 23:00 - 06:00 -> Indoor"
    const hour = new Date().getHours();
    const isNight = hour >= 23 || hour < 6;
    if (location.speed === 0 && isNight) {
      return 'Indoor';
    }

    // Moving Average Rule
    // "If avg speed >= 1.0 AND accuracy <= 30 -> Outdoor"
    const avgSpeed = this.getAverageSpeed();
    if (avgSpeed >= 1.0 && location.accuracy <= this.THRESHOLDS.goodAccuracy) {
      return 'Outdoor';
    }

    // Check if we should call API
    if (this.shouldCallApi(location)) {
      try {
        const apiData = await this.callHereApi(location);
        const newState = this.applyApiRules(location, apiData);
        this.lastApiBasedState = newState;
        this.lastApiCheckTime = Date.now();
        this.lastApiCheckLocation = { latitude: location.latitude, longitude: location.longitude };
        return newState;
      } catch (error) {
        console.error('HERE API Call failed', error);
        return this.lastApiBasedState;
      }
    }

    // If API not called, return last known API-based state
    // Or should we return Unknown? The logic implies we fallback to something.
    // "If distance from previous request > 100m -> Outdoor"
    // If we didn't call API, we can still check displacement from LAST API CALL.
    if (this.lastApiCheckLocation) {
      const dist = this.getDistanceFromLatLonInM(
        location.latitude,
        location.longitude,
        this.lastApiCheckLocation.latitude,
        this.lastApiCheckLocation.longitude
      );
      if (dist > 100) {
        // This effectively forces an update if we moved far, 
        // but technically if we moved > 100m, `shouldCallApi` would likely return true (if MIN_DISTANCE is < 100).
        // If we are here, it means we didn't call API.
        // So either dist < MIN_DISTANCE (50) or time < MIN_TIME.
        // If dist > 100, we WOULD have called API.
        // So this block might be redundant if shouldCallApi logic covers it.
        // But strictly following rules:
        return 'Outdoor';
      }
    }

    return this.lastApiBasedState;
  }

  private shouldCallApi(location: Coords): boolean {
    if (!this.lastApiCheckLocation) return true;

    const timeDiff = Date.now() - this.lastApiCheckTime;
    const distDiff = this.getDistanceFromLatLonInM(
      location.latitude,
      location.longitude,
      this.lastApiCheckLocation.latitude,
      this.lastApiCheckLocation.longitude
    );

    return timeDiff >= this.MIN_TIME_BETWEEN_API_CALLS || distDiff >= this.MIN_DISTANCE_BETWEEN_API_CALLS;
  }

  private async callHereApi(location: Coords): Promise<ApiResult> {
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${location.latitude},${location.longitude}&limit=1&lang=en-US&apikey=${this.HERE_API_KEY}`;
    const response = await axios.get(url);
    const item = response.data.items?.[0];

    if (!item) {
      throw new Error('No results from HERE API');
    }

    const distance = item.distance; // meters to address
    const resultType = item.resultType;
    const isBuilding = resultType === 'building' || resultType === 'houseNumber';

    return { distance, isBuilding };
  }

  private applyApiRules(location: Coords, apiData: ApiResult): LocationState {
    const { distance, isBuilding } = apiData;

    // "If distance from previous request > 100m -> Outdoor"
    // This is checking displacement from PREVIOUS request.
    // Since we just called the API, `this.lastApiCheckLocation` is the PREVIOUS one.
    if (this.lastApiCheckLocation) {
       const displacement = this.getDistanceFromLatLonInM(
          location.latitude,
          location.longitude,
          this.lastApiCheckLocation.latitude,
          this.lastApiCheckLocation.longitude
       );
       if (displacement > 100) {
           return 'Outdoor';
       }
    }

    // "If isBuilding AND distance <= 35m AND accuracy <= 30 -> Indoor"
    if (isBuilding && distance <= this.THRESHOLDS.indoorDistance && location.accuracy <= this.THRESHOLDS.goodAccuracy) {
      return 'Indoor';
    }

    // "If distance >= 55m"
    if (distance >= this.THRESHOLDS.outdoorDistance) {
      // "If speed < 1.0 AND accuracy > 30 -> Unknown"
      if (location.speed < 1.0 && location.accuracy > this.THRESHOLDS.goodAccuracy) {
        return 'Unknown';
      }
      // "Else -> Outdoor"
      return 'Outdoor';
    }
    
    // Default if no rule matches?
    // The rules don't cover the gap between 35m and 55m, or other combinations.
    // I'll default to Unknown or maintain last state.
    // Given the strict rules, if nothing matches, Unknown is safest.
    return 'Unknown';
  }

  private updateSpeedBuffer(speed: number) {
    this.speedBuffer.push(speed < 0 ? 0 : speed);
    if (this.speedBuffer.length > 3) {
      this.speedBuffer.shift();
    }
  }

  private getAverageSpeed(): number {
    if (this.speedBuffer.length === 0) return 0;
    const sum = this.speedBuffer.reduce((a, b) => a + b, 0);
    return sum / this.speedBuffer.length;
  }

  private addToHistory(state: LocationState) {
    this.stateHistory.push(state);
    if (this.stateHistory.length > 5) {
      this.stateHistory.shift();
    }
  }

  private getMajorityVote(): LocationState {
    if (this.stateHistory.length === 0) return 'Unknown';
    
    const counts: Record<string, number> = { Indoor: 0, Outdoor: 0, Unknown: 0 };
    for (const state of this.stateHistory) {
      counts[state]++;
    }

    let maxCount = 0;
    let majorityState: LocationState = 'Unknown';

    // Prioritize Outdoor/Indoor over Unknown if tie?
    // Simple max check
    for (const state of ['Indoor', 'Outdoor', 'Unknown'] as LocationState[]) {
        if (counts[state] > maxCount) {
            maxCount = counts[state];
            majorityState = state;
        }
    }
    return majorityState;
  }

  // Haversine formula
  private getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000;
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
}
