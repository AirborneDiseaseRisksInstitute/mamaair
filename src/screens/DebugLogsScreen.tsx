import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, RefreshControl } from 'react-native';
import { appLogger } from '../services/logger/AppLogger';
import { databaseService } from '../services/database/DatabaseService';
import { getPreviousRunCrash, getLastCrash, clearPreviousRunCrash } from '../services/logger/CrashReporter';

function formatCrash(label: string, c: ReturnType<typeof getLastCrash>): string {
  if (!c) return `${label}: (none)`;
  return `${label} @ ${c.at} (build ${c.build}, fatal=${c.isFatal})\n${c.message}\n${c.stack}`;
}

export default function DebugLogsScreen() {
  const [logs, setLogs] = useState('Loading...');
  const [crashText, setCrashText] = useState('');
  const [dbCount, setDbCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(async () => {
    const content = await appLogger.readLogs();
    setLogs(content);
    const prev = getPreviousRunCrash();
    const last = getLastCrash();
    const sections = [
      formatCrash('PREVIOUS RUN CRASH', prev),
      formatCrash('CURRENT RUN CRASH', last),
    ];
    setCrashText(sections.join('\n\n---\n\n'));
    try {
      const locations = databaseService.getAllLocations();
      setDbCount(locations.length);
    } catch {
      setDbCount(-1);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `${crashText}\n\n=== LOGS ===\n${logs}`,
        title: 'MamaAir Debug Logs',
      });
    } catch {}
  };

  const onClear = async () => {
    await appLogger.clearLogs();
    clearPreviousRunCrash();
    setLogs('Logs cleared.');
    setCrashText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dbCount}>DB points: {dbCount}</Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={onShare}>
            <Text style={styles.btnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onClear}>
            <Text style={styles.btnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.logArea}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!!crashText && (
          <View style={styles.crashBox}>
            <Text style={styles.crashHeader} selectable>{crashText}</Text>
          </View>
        )}
        <Text style={styles.logText} selectable>{logs}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#16213e',
  },
  dbCount: { color: '#0f0', fontSize: 14, fontFamily: 'monospace' },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnDanger: { backgroundColor: '#8B0000' },
  btnText: { color: '#fff', fontSize: 13 },
  logArea: { flex: 1, padding: 8 },
  logText: { color: '#e0e0e0', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
  crashBox: {
    backgroundColor: '#3a0a0a',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  crashHeader: { color: '#FFD3D3', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
});
