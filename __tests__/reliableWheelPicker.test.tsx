import React from 'react';
import { View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ReliableWheelPicker } from '../src/components/ui/ReliableWheelPicker';
import { TIME_PICKER_MINUTE_LABELS } from '../src/components/ui/ReminderTimePicker';

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
    expect(wheelList.props.contentOffset).toEqual({ x: 0, y: 18 * 56 });
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

  it('keeps 00 as the first selectable minute row', () => {
    expect(TIME_PICKER_MINUTE_LABELS).toHaveLength(60);
    expect(TIME_PICKER_MINUTE_LABELS[0]).toBe('00');
    expect(TIME_PICKER_MINUTE_LABELS[1]).toBe('01');
    expect(TIME_PICKER_MINUTE_LABELS[59]).toBe('59');

    const onChange = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ReliableWheelPicker
          selectedIndex={1}
          options={TIME_PICKER_MINUTE_LABELS}
          onChange={onChange}
          itemHeight={56}
          visibleRest={2}
        />,
      );
    });

    act(() => {
      renderer!.root.findByType(View).props.onLayout({
        nativeEvent: { layout: { width: 180 } },
      });
    });

    act(() => {
      jest.runOnlyPendingTimers();
    });

    const wheelList = renderer!.root.find(
      node =>
        Array.isArray(node.props.data) &&
        Array.isArray(node.props.snapToOffsets),
    );
    expect(wheelList.props.data.slice(0, 5)).toEqual([
      null,
      null,
      '00',
      '01',
      '02',
    ]);

    act(() => {
      wheelList.props.onScrollEndDrag({
        nativeEvent: { contentOffset: { y: 0 } },
      });
    });

    expect(onChange).toHaveBeenCalledWith(0);
  });
});
