import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck, faClock, faBell } from '@fortawesome/free-solid-svg-icons';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../../theme';
import { DIET_SVG, RUNNING_SVG, BEHAVIOUR_SVG } from '../../utils/svgIcons';

export type TaskType = 'diet' | 'activity' | 'behaviour';

interface TaskButton {
  label: string;
  onPress: () => void;
  variant?: 'delay' | 'reminder';
}

interface TaskCardProps {
  type: TaskType;
  title: string;
  description?: string;
  buttons?: TaskButton[];
  onCheck?: (checked: boolean) => void;
  initialChecked?: boolean;
  hideIcon?: boolean;
}

const iconConfig = {
  diet: {
    svg: DIET_SVG,
    backgroundColor: '#E4F3EB',
    iconColor: '#F44336',
  },
  activity: {
    svg: RUNNING_SVG,
    backgroundColor: '#FFF1D2',
    iconColor: '#FF9800',
  },
  behaviour: {
    svg: BEHAVIOUR_SVG,
    backgroundColor: '#FFDEE5',
    iconColor: '#4CAF50',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  type,
  title,
  description,
  buttons = [],
  onCheck,
  initialChecked = false,
  hideIcon = false,
}) => {
  const theme = useTheme();
  const [checked, setChecked] = useState(initialChecked ?? false);
  const config = iconConfig[type];

  // Sync when parent loads initialChecked asynchronously (e.g. from API)
  useEffect(() => {
    setChecked(initialChecked ?? false);
  }, [initialChecked]);

  const handleCheck = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    onCheck?.(newChecked);
  };

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: spacing('md'),
      marginTop: spacing('md'),
      borderWidth: 1,
      borderColor: checked ? theme.colors.orange500 : theme.colors.neutral200,
  
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing('sm'),
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: config.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircle: {
      width: 32,
      height: 32,
      borderRadius: 32/2,
      borderWidth: 1.5,
      borderColor: theme.colors.orange200,
      backgroundColor: checked ? theme.colors.orange500 : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      marginLeft: hideIcon ? 0 : spacing('md'),
      marginRight: spacing('sm'),
    },
    title: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    description: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      lineHeight: 20,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: spacing('sm'),
      marginTop: spacing('md'),
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing('sm'),
      paddingHorizontal: spacing('sm'),
      borderRadius: 8,
      gap: spacing('xs'),
    },
    delayButton: {
      backgroundColor: '#FFF9E6',
    },
    reminderButton: {
      backgroundColor: '#E3F2FD',
    },
    buttonText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
    },
    delayButtonText: {
      color: '#FF9800',
    },
    reminderButtonText: {
      color: '#2196F3',
    },
  }), [theme, checked, config]);

  const getButtonStyle = (variant?: 'delay' | 'reminder') => {
    if (variant === 'delay') {
      return styles.delayButton;
    }
    if (variant === 'reminder') {
      return styles.reminderButton;
    }
    return styles.delayButton; // default
  };

  const getButtonTextStyle = (variant?: 'delay' | 'reminder') => {
    if (variant === 'delay') {
      return styles.delayButtonText;
    }
    if (variant === 'reminder') {
      return styles.reminderButtonText;
    }
    return styles.delayButtonText; // default
  };

  const getButtonIcon = (variant?: 'delay' | 'reminder') => {
    if (variant === 'reminder') {
      return faBell;
    }
    return faClock; // default to delay
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {!hideIcon && (
          <View style={styles.iconContainer}>
            <SvgXml xml={config.svg} width={28} height={28} />
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.title} allowFontScaling={false}>{title}</Text>
          {!!description && <Text style={styles.description} allowFontScaling={false}>{description}</Text>}
        </View>
        <TouchableOpacity
          onPress={handleCheck}
          activeOpacity={0.7}
          style={styles.checkCircle}
        >
          {checked && (
            <FontAwesomeIcon
              icon={faCheck as any}
              size={12}
              color="#FFF"
            />
          )}
        </TouchableOpacity>
      </View>

      {buttons.length > 0 && (
        <View style={styles.buttonsContainer}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.button, getButtonStyle(button.variant)]}
              onPress={button.onPress}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={getButtonIcon(button.variant) as any}
                size={16}
                color={button.variant === 'reminder' ? '#2196F3' : '#FF9800'}
              />
              <Text style={[styles.buttonText, getButtonTextStyle(button.variant)]} allowFontScaling={false}>
                {button.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

