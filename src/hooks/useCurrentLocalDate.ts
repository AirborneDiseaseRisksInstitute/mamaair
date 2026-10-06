import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { formatLocalDate } from '../utils/dateUtils';

export const getCurrentLocalDate = (): string => formatLocalDate(new Date());

export const useCurrentLocalDate = (
  refreshIntervalMs = 60 * 1000,
): string => {
  const [date, setDate] = useState(getCurrentLocalDate);

  const refreshDate = useCallback(() => {
    const nextDate = getCurrentLocalDate();
    setDate(current => (current === nextDate ? current : nextDate));
  }, []);

  useEffect(() => {
    refreshDate();
    const interval = setInterval(refreshDate, refreshIntervalMs);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshDate();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshDate, refreshIntervalMs]);

  return date;
};
