import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
  type FlatListProps,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

interface ReliableWheelPickerProps {
  selectedIndex: number;
  options: string[];
  onChange: (index: number) => void;
  selectedIndicatorStyle?: StyleProp<ViewStyle>;
  itemTextStyle?: StyleProp<TextStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  itemHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  containerProps?: Omit<ViewProps, 'style'>;
  scaleFunction?: (distance: number) => number;
  rotationFunction?: (distance: number) => number;
  opacityFunction?: (distance: number) => number;
  visibleRest?: number;
  decelerationRate?: 'normal' | 'fast' | number;
  flatListProps?: Omit<
    FlatListProps<string | null>,
    'data' | 'renderItem'
  >;
}

interface WheelItemProps {
  currentScrollIndex: Animated.AnimatedAddition<number>;
  height: number;
  index: number;
  itemStyle?: StyleProp<ViewStyle>;
  opacityFunction: (distance: number) => number;
  option: string | null;
  rotationFunction: (distance: number) => number;
  scaleFunction: (distance: number) => number;
  textStyle?: StyleProp<TextStyle>;
  visibleRest: number;
}

const createSymmetricRange = (
  visibleRest: number,
  valueForDistance: (distance: number) => number,
) => {
  const range = [1];
  for (let distance = 1; distance <= visibleRest + 1; distance += 1) {
    const value = valueForDistance(distance);
    range.unshift(value);
    range.push(value);
  }
  return range;
};

const WheelItem: React.FC<WheelItemProps> = ({
  currentScrollIndex,
  height,
  index,
  itemStyle,
  opacityFunction,
  option,
  rotationFunction,
  scaleFunction,
  textStyle,
  visibleRest,
}) => {
  const inputRange = useMemo(() => {
    const range = [0];
    for (let distance = 1; distance <= visibleRest + 1; distance += 1) {
      range.unshift(-distance);
      range.push(distance);
    }
    return range;
  }, [visibleRest]);

  const relativeScrollIndex = Animated.subtract(index, currentScrollIndex);

  const translateYRange = useMemo(() => {
    const range = [0];
    for (let distance = 1; distance <= visibleRest + 1; distance += 1) {
      let translation =
        (height / 2) *
        (1 - Math.sin(Math.PI / 2 - rotationFunction(distance)));

      for (let preceding = 1; preceding < distance; preceding += 1) {
        translation +=
          height *
          (1 - Math.sin(Math.PI / 2 - rotationFunction(preceding)));
      }

      range.unshift(translation);
      range.push(-translation);
    }
    return range;
  }, [height, rotationFunction, visibleRest]);

  const opacityRange = useMemo(
    () => createSymmetricRange(visibleRest, opacityFunction),
    [opacityFunction, visibleRest],
  );
  const scaleRange = useMemo(
    () => createSymmetricRange(visibleRest, scaleFunction),
    [scaleFunction, visibleRest],
  );
  const rotationRange = useMemo(() => {
    const range = ['0deg'];
    for (let distance = 1; distance <= visibleRest + 1; distance += 1) {
      const value = `${rotationFunction(distance)}deg`;
      range.unshift(value);
      range.push(value);
    }
    return range;
  }, [rotationFunction, visibleRest]);

  const translateY = relativeScrollIndex.interpolate({
    inputRange,
    outputRange: translateYRange,
  });
  const opacity = relativeScrollIndex.interpolate({
    inputRange,
    outputRange: opacityRange,
  });
  const scale = relativeScrollIndex.interpolate({
    inputRange,
    outputRange: scaleRange,
  });
  const rotateX = relativeScrollIndex.interpolate({
    inputRange,
    outputRange: rotationRange,
  });

  return (
    <Animated.View
      style={[
        styles.option,
        itemStyle,
        {
          height,
          opacity,
          transform: [{ translateY }, { rotateX }, { scale }],
        },
      ]}
    >
      <Text style={textStyle} allowFontScaling={false}>
        {option}
      </Text>
    </Animated.View>
  );
};

/**
 * A local, API-compatible wheel that keeps its visual scroll state aligned
 * with the selected row from the first frame. react-native-wheely initializes
 * that Animated value at zero and waits for an onScroll event, which can leave
 * non-zero initial selections invisible on Android until the user nudges one.
 */
export const ReliableWheelPicker: React.FC<ReliableWheelPickerProps> = ({
  containerProps,
  containerStyle,
  decelerationRate = 'fast',
  flatListProps,
  itemHeight = 40,
  itemStyle,
  itemTextStyle,
  onChange,
  opacityFunction = distance => Math.pow(1 / 3, distance),
  options,
  rotationFunction = distance => 1 - Math.pow(1 / 2, distance),
  scaleFunction = distance => Math.pow(1, distance),
  selectedIndex,
  selectedIndicatorStyle,
  visibleRest = 2,
}) => {
  const flatListRef = useRef<FlatList<string | null>>(null);
  const scrollY = useRef(
    new Animated.Value(selectedIndex * itemHeight),
  ).current;
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [isListReady, setIsListReady] = useState(false);
  const { onLayout: onContainerLayout, ...restContainerProps } =
    containerProps ?? {};

  const containerHeight = (visibleRest * 2 + 1) * itemHeight;
  const initialRenderCount = Math.min(
    options.length + visibleRest * 2,
    visibleRest * 2 + 5,
  );
  const paddedOptions = useMemo(() => {
    const padded: Array<string | null> = [...options];
    for (let index = 0; index < visibleRest; index += 1) {
      padded.unshift(null);
      padded.push(null);
    }
    return padded;
  }, [options, visibleRest]);

  const offsets = useMemo(
    () => paddedOptions.map((_, index) => index * itemHeight),
    [itemHeight, paddedOptions],
  );
  const currentScrollIndex = useMemo(
    () =>
      Animated.add(
        Animated.divide(scrollY, itemHeight),
        visibleRest,
      ),
    [itemHeight, scrollY, visibleRest],
  );

  useEffect(() => {
    if (selectedIndex < 0 || selectedIndex >= options.length) {
      throw new Error(
        `Selected index ${selectedIndex} is out of bounds [0, ${
          options.length - 1
        }]`,
      );
    }
  }, [options.length, selectedIndex]);

  useEffect(() => {
    if (layoutWidth <= 0) {
      return;
    }

    // BottomSheet reveals its content with a native opacity animation. On
    // Android/Fabric an Animated.FlatList mounted during that animation can
    // stay undrawn until the first touch. Mount it just after the reveal.
    const timer = setTimeout(() => {
      setIsListReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [layoutWidth]);

  useEffect(() => {
    if (layoutWidth <= 0 || !isListReady) {
      return;
    }

    const offset = selectedIndex * itemHeight;
    scrollY.setValue(offset);
    flatListRef.current?.scrollToOffset({ offset, animated: false });
  }, [isListReady, itemHeight, layoutWidth, scrollY, selectedIndex]);

  const handleLayout = (event: LayoutChangeEvent) => {
    onContainerLayout?.(event);
    const width = Math.round(event.nativeEvent.layout.width);
    if (width > 0 && width !== layoutWidth) {
      setIsListReady(false);
      setLayoutWidth(width);
    }
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offsetY = Math.min(
      itemHeight * (options.length - 1),
      Math.max(event.nativeEvent.contentOffset.y, 0),
    );
    const lowerIndex = Math.floor(offsetY / itemHeight);
    const remainder = offsetY % itemHeight;
    const nextIndex =
      remainder > itemHeight / 2 ? lowerIndex + 1 : lowerIndex;

    if (nextIndex !== selectedIndex) {
      onChange(nextIndex);
    }
  };

  // Keep initialScrollIndex as the only initial positioning mechanism.
  // Pairing it with contentOffset can leave adjacent Android/Fabric lists unpainted.
  return (
    <View
      {...restContainerProps}
      style={[
        styles.container,
        { height: containerHeight },
        containerStyle,
      ]}
      onLayout={handleLayout}
    >
      <View
        pointerEvents="none"
        style={[
          styles.selectedIndicator,
          selectedIndicatorStyle,
          {
            height: itemHeight,
            transform: [{ translateY: -itemHeight / 2 }],
          },
        ]}
      />

      {layoutWidth > 0 && isListReady ? (
        <Animated.FlatList
          {...flatListProps}
          ref={flatListRef}
          style={styles.scrollView}
          data={paddedOptions}
          renderItem={({ item, index }) => (
            <WheelItem
              currentScrollIndex={currentScrollIndex}
              height={itemHeight}
              index={index}
              itemStyle={itemStyle}
              opacityFunction={opacityFunction}
              option={item}
              rotationFunction={rotationFunction}
              scaleFunction={scaleFunction}
              textStyle={itemTextStyle}
              visibleRest={visibleRest}
            />
          )}
          keyExtractor={(_, index) => index.toString()}
          getItemLayout={(_, index) => ({
            index,
            length: itemHeight,
            offset: itemHeight * index,
          })}
          initialScrollIndex={selectedIndex}
          initialNumToRender={initialRenderCount}
          maxToRenderPerBatch={initialRenderCount}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          snapToOffsets={offsets}
          decelerationRate={decelerationRate}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          onScrollEndDrag={handleMomentumScrollEnd}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  scrollView: {
    flex: 1,
    overflow: 'hidden',
  },
  selectedIndicator: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    backgroundColor: 'hsl(200, 8%, 94%)',
    borderRadius: 5,
  },
});
