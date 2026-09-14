import React from 'react';
import { View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ReliableWheelPicker } from '../src/components/ui/ReliableWheelPicker';

describe('ReliableWheelPicker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('mounts at the selected offset after layout and commits a dragged row', () => {
    const onChange = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ReliableWheelPicker
          selectedIndex={18}
          options={Array.from({ length: 24 }, (_, index) => `${index}`)}
          onChange={onChange}
          itemHeight={56}
          visibleRest={2}
        />,
      );
    });

    const findWheelLists = () =>
      renderer!.root.findAll(
        node =>
          Array.isArray(node.props.data) &&
          Array.isArray(node.props.snapToOffsets),
      );

    expect(findWheelLists()).toHaveLength(0);

    act(() => {
      renderer!.root.findByType(View).props.onLayout({
        nativeEvent: { layout: { width: 180 } },
      });
    });

    // The list waits until the bottom-sheet reveal has finished so Android
    // cannot leave its initial rows undrawn.
    expect(findWheelLists()).toHaveLength(0);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    const wheelList = findWheelLists()[0];
    expect(wheelList.props.initialScrollIndex).toBe(18);
    expect(wheelList.props.contentOffset).toBeUndefined();
    expect(wheelList.props.initialNumToRender).toBe(9);
    expect(wheelList.props.maxToRenderPerBatch).toBe(9);
    expect(wheelList.props.removeClippedSubviews).toBe(false);

    act(() => {
      wheelList.props.onScrollEndDrag({
        nativeEvent: { contentOffset: { y: 19 * 56 } },
      });
    });

    expect(onChange).toHaveBeenCalledWith(19);
  });

});
