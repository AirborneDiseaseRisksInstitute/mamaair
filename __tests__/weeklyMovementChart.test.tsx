import React from 'react';
import { Text, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { WeeklyMovementChart } from '../src/components/mother/WeeklyMovementChart';

const mockLineChart = jest.fn((_props: unknown) => (
  <View testID="movement-line-chart" />
));

jest.mock('react-native-gifted-charts', () => ({
  LineChart: (props: unknown) => mockLineChart(props),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const weekDates = [
  '2026-10-12',
  '2026-10-13',
  '2026-10-14',
  '2026-10-15',
  '2026-10-16',
  '2026-10-17',
  '2026-10-18',
];

describe('WeeklyMovementChart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows today, the weekly total and the daily chart', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WeeklyMovementChart
          summary={{
            days: weekDates.map(date => ({
              date,
              distanceMeters:
                date === '2026-10-17'
                  ? 1200
                  : date === '2026-10-16'
                  ? 800
                  : null,
              sampleCount: date >= '2026-10-16' ? 2 : 0,
            })),
            totalDistanceMeters: 2000,
            recordedDays: 2,
          }}
          weekDates={weekDates}
          currentDate="2026-10-17"
          locale="en-GB"
        />,
      );
    });

    const labels = renderer!.root
      .findAllByType(Text)
      .map(node =>
        Array.isArray(node.props.children)
          ? node.props.children.join('')
          : node.props.children,
      );
    expect(labels).toContain('1.2 movement.unit_km');
    expect(labels).toContain('2 movement.unit_km');

    const layoutTarget = renderer!.root
      .findAllByType(View)
      .find(node => typeof node.props.onLayout === 'function');
    expect(layoutTarget).toBeDefined();
    act(() =>
      layoutTarget!.props.onLayout({ nativeEvent: { layout: { width: 320 } } }),
    );
    expect(
      renderer!.root.findByProps({ testID: 'movement-line-chart' }),
    ).toBeDefined();
    expect(mockLineChart).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { value: undefined },
          { value: undefined },
          { value: undefined },
          { value: undefined },
          { value: 0.8 },
          { value: 1.2 },
          { value: undefined },
        ],
        interpolateMissingValues: false,
        showFractionalValues: true,
      }),
    );
    act(() => renderer!.unmount());
  });

  it('shows an honest empty state when this version has no local history', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WeeklyMovementChart
          summary={{
            days: weekDates.map(date => ({
              date,
              distanceMeters: null,
              sampleCount: 0,
            })),
            totalDistanceMeters: 0,
            recordedDays: 0,
          }}
          weekDates={weekDates}
          currentDate="2026-10-17"
          locale="en-GB"
        />,
      );
    });

    expect(
      renderer!.root
        .findAllByType(Text)
        .some(node => node.props.children === 'movement.history_empty'),
    ).toBe(true);
    expect(mockLineChart).not.toHaveBeenCalled();
    act(() => renderer!.unmount());
  });
});
