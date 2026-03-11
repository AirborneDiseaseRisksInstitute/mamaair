import { QuickSQLiteConnection, open } from 'react-native-quick-sqlite';

const DB_NAME = 'mamaair.sqlite';

export interface LocationPoint {
  id?: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: number;
  isOutdoor: number; // 1 for true, 0 for false
}

class DatabaseService {
  private db: QuickSQLiteConnection;

  constructor() {
    this.db = open({ name: DB_NAME });
    this.init();
  }

  private init() {
    try {
      this.db.execute(`
        CREATE TABLE IF NOT EXISTS LocationPoints (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL,
          longitude REAL,
          accuracy REAL,
          speed REAL,
          timestamp INTEGER,
          isOutdoor INTEGER
        );
      `);
      console.log('Database initialized successfully');
    } catch (e) {
      console.error('Failed to initialize database', e);
    }
  }

  public insertLocation(point: LocationPoint) {
    try {
      this.db.execute(
        `INSERT INTO LocationPoints (latitude, longitude, accuracy, speed, timestamp, isOutdoor)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [point.latitude, point.longitude, point.accuracy, point.speed, point.timestamp, point.isOutdoor]
      );
    } catch (e) {
      console.error('Failed to insert location', e);
    }
  }

  public getAllLocations(): LocationPoint[] {
    try {
      const result = this.db.execute('SELECT * FROM LocationPoints');
      if (!result || !result.rows) return [];
      
      const items: LocationPoint[] = [];
      const len = result.rows.length;
      for (let i = 0; i < len; i++) {
        items.push(result.rows.item(i) as LocationPoint);
      }
      return items;
    } catch (e) {
      console.error('Failed to get locations', e);
      return [];
    }
  }

  public deleteLocations(ids: number[]) {
    if (ids.length === 0) return;
    try {
      const placeholders = ids.map(() => '?').join(',');
      this.db.execute(`DELETE FROM LocationPoints WHERE id IN (${placeholders})`, ids);
    } catch (e) {
      console.error('Failed to delete locations', e);
    }
  }
  
  public deleteAllLocations() {
      try {
          this.db.execute('DELETE FROM LocationPoints');
      } catch (e) {
          console.error('Failed to delete all locations', e);
      }
  }
}

export const databaseService = new DatabaseService();
