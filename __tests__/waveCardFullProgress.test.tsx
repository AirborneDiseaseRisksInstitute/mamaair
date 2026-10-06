import React from 'react';
import { Animated } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { WaveCard } from '../src/components/ui/WaveCard';

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Path: 'Path',
}));

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

describe('WaveCard full progress', () => {
  it('covers the entire card at 100 percent', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <WaveCard
          type="water"
          percentage={100}
          label="Water"
          animationProgress={new Animated.Value(0)}
          availableWidth={320}
        />,
      );
    });

    const paths = renderer!.root.findAll(
      node => typeof node.props.d === 'string' && typeof node.props.fill === 'string',
    );
    expect(paths).toHaveLength(3);
    expect(paths.every(path => path.props.d.startsWith('M 0 -'))).toBe(true);
  });
});
