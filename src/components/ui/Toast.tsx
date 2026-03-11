import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '../../theme';
import { ms, fs } from '../../utils/responsive';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions & { id: number } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextIdRef = useRef(1);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 30,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextIdRef.current++;

      // Clear existing hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      setToast({
        id,
        type: options.type ?? 'info',
        title: options.title,
        message: options.message,
        duration: options.duration ?? 2500,
      });

      // Reset animation values
      opacity.setValue(0);
      translateY.setValue(30);

      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Schedule hide
      hideTimeoutRef.current = setTimeout(() => {
        hide();
      }, options.duration ?? 2500);
    },
    [hide, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const styles = getStyles(theme, insets.bottom);

  const renderToast = () => {
    if (!toast) return null;

    const type = toast.type ?? 'info';

    // Subtle, input-like 3D style variants
    const variantStyles =
      type === 'success'
        ? styles.success
        : type === 'error'
        ? styles.error
        : styles.info;

    const titleText =
      toast.title ??
      (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info');

    return (
      <Animated.View
        style={[
          styles.toastContainer,
          variantStyles.container,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Left colored bar for state indication */}
        <View style={[styles.accentBar, variantStyles.accentBar]} />

        <View style={styles.textContainer}>
          {titleText ? (
            <Text style={[styles.title, variantStyles.title]} allowFontScaling={false}>
              {titleText}
            </Text>
          ) : null}
          <Text style={[styles.message, variantStyles.message]} allowFontScaling={false}>
            {toast.message}
          </Text>
        </View>

        {/* Optional close by tap – simple UX */}
        <TouchableOpacity
          style={styles.touchArea}
          activeOpacity={0.8}
          onPress={hide}
        />
      </Animated.View>
    );
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast overlay */}
      <View pointerEvents="box-none" style={styles.overlay}>
        {renderToast()}
      </View>
    </ToastContext.Provider>
  );
};

const getStyles = (theme: any, bottomInset: number) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      pointerEvents: 'box-none',
    },
    toastContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      minWidth: '90%',
      marginHorizontal: spacing('md'),
      marginBottom: bottomInset + spacing('md'),
      borderRadius: radius('md'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 6,
      overflow: 'hidden',
    },
    accentBar: {
      width: ms(4),
    },
    textContainer: {
      flex: 1,
      paddingVertical: spacing('sm'),
      paddingHorizontal: spacing('md'),
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: spacing('xs') / 2,
    },
    message: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      lineHeight: fs(18),
    },
    touchArea: {
      width: ms(16),
    },

    // Variants with subtle coloring – not full red backgrounds
    success: {
      container: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: '#C8E6C9',
      },
      accentBar: {
        backgroundColor: '#4CAF50',
      },
      title: {
        color: '#2E7D32',
      },
      message: {
        color: theme.colors.textSecondary,
      },
    },
    error: {
      container: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: '#FFCDD2',
      },
      accentBar: {
        backgroundColor: '#E53935',
      },
      title: {
        color: '#C62828',
      },
      message: {
        color: theme.colors.textSecondary,
      },
    },
    info: {
      container: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.neutral200,
      },
      accentBar: {
        backgroundColor: theme.colors.orange500,
      },
      title: {
        color: theme.colors.textPrimary,
      },
      message: {
        color: theme.colors.textSecondary,
      },
    },
  });


