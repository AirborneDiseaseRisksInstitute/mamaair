import React from 'react';
import { View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ReliableWheelPicker } from '../src/components/ui/ReliableWheelPicker';

const emitScroll = (wheelList: TestRenderer.ReactTestInstance, y: number) => {
  const animatedEvent = wheelList.props.onScroll;
  const handler =
    typeof animatedEvent === 'function'
      ? animatedEvent
      : animatedEvent.__getHandler();
  handler({ nativeEvent: { contentOffset: { y } } });
};

describe('ReliableWheelPicker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('mounts at the selected offset and settles a drag without momentum', () => {
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

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onChange).toHaveBeenCalledWith(19);
  });

  it('waits for momentum to finish before changing the selected row', () => {
    const onChange = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ReliableWheelPicker
          selectedIndex={18}
          options={Array.from({ length: 24 }, (_, index) => `${index}`)}
          onChange={onChange}
          itemHeight={56}
        />,
      );
    });

    act(() => {
      renderer!.root.findByType(View).props.onLayout({
        nativeEvent: { layout: { width: 180 } },
      });
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const wheelList = renderer!.root.find(node =>
      Array.isArray(node.props.snapToOffsets),
    );

    act(() => {
      wheelList.props.onScrollBeginDrag();
      wheelList.props.onScrollEndDrag({
        nativeEvent: { contentOffset: { y: 19 * 56 } },
      });
      wheelList.props.onMomentumScrollBegin();
      jest.advanceTimersByTime(120);
    });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      wheelList.props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { y: 20 * 56 } },
      });
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('does not commit an intermediate row while a long fling is still moving', () => {
    const onChange = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ReliableWheelPicker
          selectedIndex={70}
          options={Array.from({ length: 121 }, (_, index) => `${100 + index}`)}
          onChange={onChange}
          itemHeight={56}
        />,
      );
    });

    act(() => {
      renderer!.root.findByType(View).props.onLayout({
        nativeEvent: { layout: { width: 180 } },
      });
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const wheelList = renderer!.root.find(node =>
      Array.isArray(node.props.snapToOffsets),
    );

    act(() => {
      wheelList.props.onScrollBeginDrag();
      wheelList.props.onScrollEndDrag({
        nativeEvent: { contentOffset: { y: 72 * 56 } },
      });
      jest.advanceTimersByTime(60);
      emitScroll(wheelList, 78 * 56);
      jest.advanceTimersByTime(60);
    });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      emitScroll(wheelList, 90 * 56);
      jest.advanceTimersByTime(99);
    });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(90);
  });
});
