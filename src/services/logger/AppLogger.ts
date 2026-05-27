import { storage } from '../../store/useAuthStore';

// AppLogger backed by MMKV (was react-native-fs, which is officially abandoned
// since 2022 and known to crash on RN 0.83 bridgeless mode). We keep a rolling
// log of the most-recent lines in a single MMKV key. Reads/writes are sync and
// hit the JSI-native MMKV implementation, so there's no module-incompatibility
// risk and no risk of a hot-path RNFS appendFile crashing the process.

const LOG_KEY = 'app_logs_v1';
const MAX_LINES = 800; // keep last ~800 log lines, ~50-100 KB depending on length

class AppLogger {
  private readonly lines: string[];

  constructor() {
    const raw = storage.getString(LOG_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.lines = Array.isArray(parsed) ? parsed.slice(-MAX_LINES) : [];
      } catch {
        this.lines = [];
      }
    } else {
      this.lines = [];
    }
  }

  private write(level: string, tag: string, message: string) {
    const time = new Date().toISOString().substring(11, 23);
    const line = `${time} [${level}] [${tag}] ${message}`;
    console.log(`[${tag}] ${message}`);
    this.lines.push(line);
    if (this.lines.length > MAX_LINES) {
      this.lines.splice(0, this.lines.length - MAX_LINES);
    }
    try {
      storage.set(LOG_KEY, JSON.stringify(this.lines));
    } catch {
      // MMKV write failure is non-fatal — never let logging break the app.
    }
  }

  info(tag: string, message: string) {
    this.write('INFO', tag, message);
  }

  error(tag: string, message: string) {
    this.write('ERROR', tag, message);
  }

  warn(tag: string, message: string) {
    this.write('WARN', tag, message);
  }

  async readLogs(): Promise<string> {
    if (this.lines.length === 0) return 'No logs yet.';
    return this.lines.join('\n');
  }

  async clearLogs(): Promise<void> {
    this.lines.length = 0;
    try {
      storage.set(LOG_KEY, '[]');
    } catch {}
  }

  getLogFilePath(): string {
    return '(MMKV: app_logs_v1)';
  }
}

export const appLogger = new AppLogger();
