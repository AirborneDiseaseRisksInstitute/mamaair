import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faPencil,
  faCalendar,
  faGear,
  faBell,
  faUserLock,
  faHospital,
  faChevronRight,
  faGift,
  faRightFromBracket,
  faTimes,
  faShield,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { BackButton, BottomSheet, Input, Button, FixedButtonContainer, OEMAutostartGuide } from '../components/ui';
import { detectOEM, needsAutostartGuide } from '../services/tracking/OEMAutostartHelper';
import { useUserStore } from '../store/useUserStore';
import { useAuthStore } from '../store/useAuthStore';
import { SummaryService, SummaryResponse } from '../services/api/SummaryService';
import { FIXED_BUTTON_AREA_HEIGHT, ms } from '../utils/responsive';
import { responsiveUtils } from '../utils/responsiveUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEALTH_CARD_PADDING = 16 * 2;
const HEALTH_CARD_WIDTH = SCREEN_WIDTH - HEALTH_CARD_PADDING - spacing('md') * 2;
const HEALTH_CARD_HEIGHT = HEALTH_CARD_WIDTH * 0.75; // Increased to 0.75 to ensure button stays inside
const HEALTH_ICON_SIZE = HEALTH_CARD_WIDTH * 0.20;
const HEALTH_NOTCH_DEPTH = HEALTH_ICON_SIZE * 0.7;

interface UserProfileScreenProps {
  onBack?: () => void;
  onNavigateToBabyTwin?: () => void;
  onNavigateToMotherTwin?: () => void;
  onNavigateToRefer?: () => void;
  onNavigateToAppSettings?: () => void;
  onNavigateToReminders?: () => void;
  onNavigateToPrivacySettings?: () => void;
  onNavigateToPlanBirthday?: () => void;
  onNavigateToDebugLogs?: () => void;
  onLogout?: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  onBack,
  onNavigateToBabyTwin,
  onNavigateToMotherTwin,
  onNavigateToRefer,
  onNavigateToAppSettings,
  onNavigateToReminders,
  onNavigateToPrivacySettings,
  onNavigateToPlanBirthday,
  onNavigateToDebugLogs,
  onLogout
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useUserStore();
  const { logout } = useAuthStore();
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [isHealthServiceSheetVisible, setIsHealthServiceSheetVisible] = useState(false);
  const [isHealthRequestSheetVisible, setIsHealthRequestSheetVisible] = useState(false);
  const [isAgreementSheetVisible, setIsAgreementSheetVisible] = useState(false);
  const [selectedHealthServices, setSelectedHealthServices] = useState<string[]>([]);
  const [isDataConsentChecked, setIsDataConsentChecked] = useState(false);
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [isSuccessDialogVisible, setIsSuccessDialogVisible] = useState(false);
  const [isOemGuideVisible, setIsOemGuideVisible] = useState(false);
  const oemNeedsGuide = useMemo(() => needsAutostartGuide(detectOEM()), []);

  // Pull exposure levels from /summary/ so the twin cards reflect real data
  // instead of the hardcoded 36% placeholder. Backend reports exposure_level on
  // a 0-8 scale (matches TodayScreen progress bars and MotherTwinScreen donut).
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  useEffect(() => {
    let mounted = true;
    SummaryService.getSummary()
      .then((data) => { if (mounted) setSummary(data); })
      .catch((err) => console.warn('[Profile] summary fetch failed:', err?.message));
    return () => { mounted = false; };
  }, []);
  const motherPercent = useMemo(() => {
    const lvl = summary?.mom_exposure?.exposure_level;
    if (typeof lvl !== 'number') return null;
    return Math.round((lvl / 8) * 100);
  }, [summary]);
  const babyPercent = useMemo(() => {
    const lvl = summary?.baby_exposure?.exposure_level;
    if (typeof lvl !== 'number') return null;
    return Math.round((lvl / 8) * 100);
  }, [summary]);
  
  const defaultPhotoSource = require('../assets/images/addPhoto.png');
  const profilePhotoSource = profile.photo ? { uri: profile.photo } : defaultPhotoSource;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing('md'),
      paddingTop: 50,
      paddingBottom: spacing('md'),
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 3,
    },
    headerTitle: {
      fontSize: responsiveUtils.getFixedFontSize(18),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing('md'),
      paddingTop: spacing('lg'),
    },
    profileCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: spacing('lg'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing('md'),
    },
    profileImageContainer: {
      marginRight: spacing('md'),
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      resizeMode: 'cover',
    },
    profileInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    profileName: {
      fontSize: responsiveUtils.getFixedFontSize(24),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    profileEmail: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.neutral200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.neutral200,
      marginBottom: spacing('md'),
    },
    detailsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('md'),
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('sm'),
    },
    detailLabel: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      marginRight: spacing('xs'),
    },
    detailValue: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    digitalTwinCard: {
      backgroundColor: '#E6F2FF',
      borderRadius: 12,
      paddingVertical:12,
      paddingHorizontal:16,
      marginTop: spacing('lg'),
      borderWidth: 1,
      borderColor: '#B3D9FF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },

    babyTwinCard: {
        backgroundColor: '#FFF0E5',
        borderRadius: 12,
        paddingVertical:12,
        paddingHorizontal:16,
        marginTop: spacing('lg'),
        borderWidth: 1,
        borderColor: '#FF9144',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      },
    digitalTwinHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('xs'),
    },
    digitalTwinImageContainer: {
      position: 'relative',
      marginRight: spacing('md'),
    },
    digitalTwinImage: {
      width: 36,
      height: 36,
      resizeMode: 'cover',

    },
    percentageBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: theme.colors.orange500,
      borderRadius: 24,
      paddingHorizontal: 4,
      paddingVertical: 2,
      minWidth: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentageText: {
      fontSize: responsiveUtils.getBadgeFontSize(),
      fontFamily: theme.typography.fontFamily.bold,
      color: '#FFFFFF',
    },
    digitalTwinTitle: {
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.bold,
      color: '#4A9EFF',
      marginBottom: spacing('xs'),
      flex: 1,
    },

    babyTwinTitle: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.bold,
        color:theme.colors.orange500,
        marginBottom: spacing('xs'),
        flex: 1,
      },
    digitalTwinDescription: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      textAlign: 'left',
    },

    imageCircle:{
        justifyContent:'center',
        alignItems:'center',
        width:60,
        height:60,
        borderRadius:'50%',
        borderWidth: 2,
        borderColor: '#B3D9FF',
    },

    babyImageCircle:{
        justifyContent:'center',
        alignItems:'center',
        width:60,
        height:60,
        borderRadius:'50%',
        borderWidth: 2,
        borderColor: '#FF9144',
    },
    settingsCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      marginTop: spacing('lg'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
      overflow: 'hidden',
      marginBottom:100,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('md'),
      paddingHorizontal: spacing('md'),
    },
    menuIcon: {
      width: 24,
      alignItems: 'center',
      marginRight: spacing('md'),
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
    menuChevron: {
      marginLeft: spacing('sm'),
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.colors.neutral200,
      marginLeft: spacing('md'),
    },
    editSheetScrollContent: {
      paddingBottom: 100, // Space for fixed button
      paddingHorizontal: spacing('md'),
    },
    inputSpacing: {
      height: spacing('md'),
    },
    bottomSpacing: {
      height: spacing('xl'),
    },
    healthServiceSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('md'),
      paddingBottom: spacing('sm'),
    },
    healthServiceSheetTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    healthServiceCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.neutral200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    healthServiceCardWrapper: {
      alignItems: 'center',
      marginTop:100,
      marginBottom: 100,
    },
    healthServiceCardContainer: {
      position: 'relative',
      width: HEALTH_CARD_WIDTH,
      height: HEALTH_CARD_HEIGHT,
    },
    healthServiceIconContainer: {
      position: 'absolute',
      top: -HEALTH_ICON_SIZE / 1.5,
      left: (HEALTH_CARD_WIDTH - HEALTH_ICON_SIZE) / 2,
      width: HEALTH_ICON_SIZE,
      height: HEALTH_ICON_SIZE,
      borderRadius: HEALTH_ICON_SIZE / 2,
      backgroundColor: '#FF9A88',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
      elevation: 8,
    },
    healthServiceImage: {
      width: HEALTH_ICON_SIZE * 0.6,
      height: HEALTH_ICON_SIZE * 0.6,
      resizeMode: 'contain',
    },
    healthServiceCardOverlay: {
      position: 'absolute',
      top: HEALTH_NOTCH_DEPTH + 20,
      left: 0,
      right: 0,
      bottom: spacing('lg'),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing('lg'),
      paddingBottom: spacing('md'),
    },
    healthServiceTextContainer: {
      alignItems: 'center',
      marginBottom: spacing('md'),
    },
    healthServiceTitle: {
      fontSize: HEALTH_CARD_WIDTH * 0.06,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: spacing('xs'),
      lineHeight: HEALTH_CARD_WIDTH * 0.08,
    },
    healthServiceSubtitle: {
      fontSize: HEALTH_CARD_WIDTH * 0.04,
      fontFamily: theme.typography.fontFamily.regular,
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: HEALTH_CARD_WIDTH * 0.055,
      opacity: 0.95,
    },
    healthServiceButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 30,
      paddingVertical: 14,
      paddingHorizontal: 36,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    healthServiceButtonText: {
      color: theme.colors.orange500,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      textAlign: 'center',
    },

    // Healthcare request sheet
    healthRequestScrollContent: {
      paddingBottom: FIXED_BUTTON_AREA_HEIGHT + spacing('xl'),
    },
    healthRequestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('md'),
      paddingBottom: spacing('md'),
    },
    healthRequestHeaderSpacer: {
      width: 32,
      height: 32,
    },
    healthRequestHeaderCenter: {
      flex: 1,
      alignItems: 'center',
    },
    healthRequestCloseButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    healthRequestTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    healthRequestSubtitle: {
      marginTop: spacing('xs'),
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    healthRequestDivider: {
      height: 1,
      backgroundColor: theme.colors.neutral200,
      marginHorizontal: spacing('md'),
      marginBottom: spacing('lg'),
    },
    healthRequestSectionTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      paddingHorizontal: spacing('md'),
      marginBottom: spacing('md'),
    },
    healthRequestServicesBox: {
      marginHorizontal: spacing('md'),
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.neutral200,
      padding: spacing('md'),
      marginBottom: spacing('lg'),
      backgroundColor: '#fff',
    },
    healthServiceChip: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: '#FFE8D1',
      marginBottom: spacing('md'),
      maxWidth: '100%',
    },
    healthServiceChipSelected: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: theme.colors.orange500,
    },
    healthServiceChipIconCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing('sm'),
    },
    healthServiceChipIconText: {
      fontSize: 14,
    },
    healthServiceChipText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    healthServiceChipCheck: {
      marginLeft: spacing('sm'),
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.orange500,
      alignItems: 'center',
      justifyContent: 'center',
    },
    healthRequestConsentContainer: {
      paddingHorizontal: spacing('md'),
      marginBottom: spacing('sm'),
    },
    healthRequestConsentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('md'),
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#B8D6FF',
      backgroundColor: '#EAF3FF',
    },
    healthRequestConsentIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(66, 133, 244, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing('md'),
    },
    healthRequestConsentText: {
      flex: 1,
    },
    healthRequestConsentLabel: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#2E6BFF',
      marginBottom: spacing('xs'),
    },
    healthRequestConsentSubtitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    healthRequestRadioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#2E6BFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    healthRequestRadioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#2E6BFF',
    },
    healthRequestAgreementLink: {
      paddingHorizontal: spacing('md'),
      marginBottom: spacing('lg'),
    },
    healthRequestAgreementLinkText: {
      color: '#4285F4',
      textDecorationLine: 'underline',
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 14,
    },
    healthRequestEmailContainer: {
      paddingHorizontal: spacing('md'),
    },
    healthRequestEmailLabel: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('sm'),
    },
    healthRequestEmailBox: {
      width: '100%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.neutral200,
      backgroundColor: '#fff',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    healthRequestEmailText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    healthRequestBottomBar: {
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: theme.colors.neutral200,
      paddingTop: spacing('md'),
    },
    healthRequestButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    healthRequestCancelButton: {
      paddingVertical: spacing('md'),
      paddingHorizontal: spacing('lg'),
    },
    healthRequestCancelText: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.extraBold,
      color: theme.colors.orange500,
    },
    healthRequestSubmitWrapper: {
      width: 200,
      marginLeft: spacing('md'),
    },

    // Success dialog styles
    successOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing('xl'),
    },
    successCard: {
      backgroundColor: '#fff',
      borderRadius: 20,
      paddingTop: 32,
      paddingBottom: 24,
      paddingHorizontal: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: 320,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
    successCloseButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.neutral200,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    successIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    successImage: {
      width: 56,
      height: 56,
      resizeMode: 'contain',
    },
    successTitle: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#2E7D32',
      marginBottom: 8,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Agreement sheet styles
    agreementScrollContent: {
      paddingBottom: FIXED_BUTTON_AREA_HEIGHT + spacing('xl'),
    },
    agreementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('md'),
      paddingBottom: spacing('md'),
    },
    agreementTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    agreementCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.neutral200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    agreementServicesTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      paddingHorizontal: spacing('md'),
      paddingBottom: spacing('sm'),
      marginBottom: spacing('md'),
    },
    agreementServicesBox: {
      marginHorizontal: spacing('md'),
      maxHeight: ms(280),
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.neutral200,
      marginBottom: spacing('lg'),
    },
    agreementServicesScrollContent: {
      padding: spacing('md'),
      paddingTop: spacing('sm'),
    },
    agreementServiceItem: {
      marginBottom: spacing('md'),
    },
    agreementServiceNumber: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    agreementServiceDescription: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    agreementButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    agreementRejectButton: {
      paddingVertical: spacing('md'),
      paddingHorizontal: spacing('lg'),
    },
    agreementRejectText: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.extraBold,
      color: theme.colors.orange500,
    },
    agreementAcceptWrapper: {
      width: 200,
      marginLeft: spacing('md'),
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Image
                source={profilePhotoSource}
                style={styles.profileImage}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} allowFontScaling={false}>{profile.name || 'Mary'}</Text>
              <Text style={styles.profileEmail} allowFontScaling={false}>{profile.email || 'mary@gmail.com'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              activeOpacity={0.7}
              onPress={() => setIsEditSheetVisible(true)}
            >
              <FontAwesomeIcon 
                icon={faPencil as any} 
                size={14} 
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Country:</Text>
              <Text style={styles.detailValue} allowFontScaling={false}>{profile.country || '-'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Area:</Text>
              <Text style={styles.detailValue} allowFontScaling={false}>{profile.area || '-'}</Text>
            </View>
            {/* <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Language:</Text>
              <Text style={styles.detailValue} allowFontScaling={false}>{profile.language || '-'}</Text>
            </View> */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Height:</Text>
              <Text style={styles.detailValue} allowFontScaling={false}>{profile.height ? `${profile.height} cm` : '-'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Weight:</Text>
              <Text style={styles.detailValue} allowFontScaling={false}>{profile.weight ? `${profile.weight} kg` : '-'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.digitalTwinCard}
          activeOpacity={0.7}
          onPress={onNavigateToMotherTwin}
        >
          <View style={styles.digitalTwinHeader}>
            <View style={styles.digitalTwinImageContainer}>
                <View style={styles.imageCircle}>
              <Image
                source={require('../assets/images/motherDigital.png')}
                style={styles.digitalTwinImage}
              />

</View>
              <View style={styles.percentageBadge}>
                <Text style={styles.percentageText} allowFontScaling={false}>
                  {motherPercent != null ? `${motherPercent}%` : '—'}
                </Text>
              </View>
            </View>
            <Text style={styles.digitalTwinTitle} allowFontScaling={false}>Mother's Digital twin</Text>
          </View>
          <Text style={styles.digitalTwinDescription} allowFontScaling={false}>
            Follow your digital twin step by step with accurate diagnosis and actionable insights.
          </Text>
        </TouchableOpacity>


        <TouchableOpacity 
          style={styles.babyTwinCard}
          activeOpacity={0.7}
          onPress={onNavigateToBabyTwin}
        >
          <View style={styles.digitalTwinHeader}>
            <View style={styles.digitalTwinImageContainer}>
                <View style={styles.babyImageCircle}>
              <Image
                source={require('../assets/images/babyDigital.png')}
                style={styles.digitalTwinImage}
              />

</View>
              <View style={styles.percentageBadge}>
                <Text style={styles.percentageText} allowFontScaling={false}>
                  {babyPercent != null ? `${babyPercent}%` : '—'}
                </Text>
              </View>
            </View>
            <Text style={styles.babyTwinTitle} allowFontScaling={false}>Baby's Digital twin</Text>
          </View>
         
        </TouchableOpacity>

        <View style={styles.settingsCard}>
          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={onNavigateToPlanBirthday}
          >
            <View style={styles.menuIcon}>
              <FontAwesomeIcon 
                icon={faCalendar as any} 
                size={20} 
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.menuText} allowFontScaling={false}>Baby birthday</Text>
            <FontAwesomeIcon 
              icon={faChevronRight as any} 
              size={14} 
              color={theme.colors.textSecondary}
              style={styles.menuChevron}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={onNavigateToAppSettings}
          >
            <View style={styles.menuIcon}>
              <FontAwesomeIcon 
                icon={faGear as any} 
                size={20} 
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.menuText} allowFontScaling={false}>App settings</Text>
            <FontAwesomeIcon 
              icon={faChevronRight as any} 
              size={14} 
              color={theme.colors.textSecondary}
              style={styles.menuChevron}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={onNavigateToReminders}
          >
            <View style={styles.menuIcon}>
              <FontAwesomeIcon 
                icon={faBell as any} 
                size={20} 
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.menuText} allowFontScaling={false}>Reminders</Text>
            <FontAwesomeIcon 
              icon={faChevronRight as any} 
              size={14} 
              color={theme.colors.textSecondary}
              style={styles.menuChevron}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={onNavigateToPrivacySettings}
          >
            <View style={styles.menuIcon}>
              <FontAwesomeIcon 
                icon={faUserLock as any} 
                size={20} 
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.menuText} allowFontScaling={false}>Privacy settings</Text>
            <FontAwesomeIcon 
              icon={faChevronRight as any} 
              size={14} 
              color={theme.colors.textSecondary}
              style={styles.menuChevron}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setIsHealthServiceSheetVisible(true)}
          >
            <View style={styles.menuIcon}>
              <FontAwesomeIcon 
                icon={faHospital as any} 
                size={20} 
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.menuText} allowFontScaling={false}>Healthcare specialist services</Text>
            <FontAwesomeIcon 
              icon={faChevronRight as any} 
              size={14} 
              color={theme.colors.textSecondary}
              style={styles.menuChevron}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={onNavigateToDebugLogs}
          >
            <View style={styles.menuIcon}>
              <FontAwesomeIcon
                icon={faGear as any}
                size={20}
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.menuText} allowFontScaling={false}>Debug Logs</Text>
            <FontAwesomeIcon
              icon={faChevronRight as any}
              size={14}
              color={theme.colors.textSecondary}
              style={styles.menuChevron}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {oemNeedsGuide && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => setIsOemGuideVisible(true)}
              >
                <View style={styles.menuIcon}>
                  <FontAwesomeIcon
                    icon={faShield as any}
                    size={20}
                    color={theme.colors.textPrimary}
                  />
                </View>
                <Text style={styles.menuText} allowFontScaling={false}>Background activity</Text>
                <FontAwesomeIcon
                  icon={faChevronRight as any}
                  size={14}
                  color={theme.colors.textSecondary}
                  style={styles.menuChevron}
                />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
            </>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={onNavigateToRefer}
          >
            <View style={styles.menuIcon}>
              <FontAwesomeIcon
                icon={faGift as any}
                size={20}
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.menuText} allowFontScaling={false}>Refer a Friend</Text>
            <FontAwesomeIcon 
              icon={faChevronRight as any} 
              size={14} 
              color={theme.colors.textSecondary}
              style={styles.menuChevron}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              logout();
              onLogout?.();
            }}
          >
            <View style={styles.menuIcon}>
              <FontAwesomeIcon 
                icon={faRightFromBracket as any} 
                size={20} 
                color={'#FF4444'}
              />
            </View>
            <Text style={[styles.menuText, { color: '#FF4444' }]} allowFontScaling={false}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomSheet
        visible={isEditSheetVisible}
        onClose={() => setIsEditSheetVisible(false)}
        showHandle={true}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.editSheetScrollContent}
        >
          <Input
            title="Country"
            placeholder="Enter country"
            type="text"
            value={profile.country || ''}
            onChangeText={() => {}}
          />
          
          <View style={styles.inputSpacing} />
          
          <Input
            title="Area"
            placeholder="Enter area"
            type="text"
            value={profile.area || ''}
            onChangeText={() => {}}
          />
          
          <View style={styles.inputSpacing} />
          
          <Input
            title="Age"
            placeholder="Enter age"
            type="number"
            value={profile.birthday || ''}
            onChangeText={() => {}}
          />
          
          <View style={styles.inputSpacing} />
          
          <Input
            title="Weight"
            placeholder="Enter weight"
            type="number"
            value={profile.weight ? profile.weight.toString() : ''}
            onChangeText={() => {}}
          />
          
          <View style={styles.inputSpacing} />
          
          <Input
            title="Height"
            placeholder="Enter height"
            type="number"
            value={profile.height ? profile.height.toString() : ''}
            onChangeText={() => {}}
          />
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
        
        <FixedButtonContainer>
          <Button
            title="Save"
            onPress={() => {
              // Save the profile data
              setIsEditSheetVisible(false);
            }}
          />
        </FixedButtonContainer>
      </BottomSheet>

      <BottomSheet
        visible={isHealthServiceSheetVisible}
        onClose={() => setIsHealthServiceSheetVisible(false)}
        showHandle={true}
      >
        <View style={styles.healthServiceSheetHeader}>
          <Text style={styles.healthServiceSheetTitle} allowFontScaling={false}>Specialist Services</Text>
          <TouchableOpacity
            style={styles.healthServiceCloseButton}
            onPress={() => setIsHealthServiceSheetVisible(false)}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon 
              icon={faTimes as any} 
              size={14} 
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.healthServiceCardWrapper}>
          <View style={styles.healthServiceCardContainer}>
            {/* SVG Background with curved top */}
            <Svg 
              width={HEALTH_CARD_WIDTH} 
              height={HEALTH_CARD_HEIGHT} 
              style={{ position: 'absolute' }}
            >
              <Defs>
                <LinearGradient id="healthCardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFB86A" />
                  <Stop offset="50%" stopColor="#FF9045" />
                  <Stop offset="100%" stopColor="#FF6D5C" />
                </LinearGradient>
              </Defs>
              <Path
                d={`
                  M 20 0
                  L ${HEALTH_CARD_WIDTH * 0.3} 0
                  C ${HEALTH_CARD_WIDTH * 0.35} 0, ${HEALTH_CARD_WIDTH * 0.38} ${HEALTH_NOTCH_DEPTH * 0.1}, ${HEALTH_CARD_WIDTH * 0.42} ${HEALTH_NOTCH_DEPTH * 0.5}
                  C ${HEALTH_CARD_WIDTH * 0.45} ${HEALTH_NOTCH_DEPTH * 0.9}, ${HEALTH_CARD_WIDTH * 0.55} ${HEALTH_NOTCH_DEPTH * 0.9}, ${HEALTH_CARD_WIDTH * 0.58} ${HEALTH_NOTCH_DEPTH * 0.5}
                  C ${HEALTH_CARD_WIDTH * 0.62} ${HEALTH_NOTCH_DEPTH * 0.1}, ${HEALTH_CARD_WIDTH * 0.65} 0, ${HEALTH_CARD_WIDTH * 0.7} 0
                  L ${HEALTH_CARD_WIDTH - 20} 0
                  Q ${HEALTH_CARD_WIDTH} 0, ${HEALTH_CARD_WIDTH} 20
                  L ${HEALTH_CARD_WIDTH} ${HEALTH_CARD_HEIGHT - 20}
                  Q ${HEALTH_CARD_WIDTH} ${HEALTH_CARD_HEIGHT}, ${HEALTH_CARD_WIDTH - 20} ${HEALTH_CARD_HEIGHT}
                  L 20 ${HEALTH_CARD_HEIGHT}
                  Q 0 ${HEALTH_CARD_HEIGHT}, 0 ${HEALTH_CARD_HEIGHT - 20}
                  L 0 20
                  Q 0 0, 20 0
                  Z
                `}
                fill="url(#healthCardGradient)"
              />
            </Svg>

            {/* Image inside circle */}
            <View style={styles.healthServiceIconContainer}>
              <Image
                source={require('../assets/images/healthService.png')}
                style={styles.healthServiceImage}
              />
            </View>

            {/* Card Content Overlay */}
            <View style={styles.healthServiceCardOverlay}>
              <View style={styles.healthServiceTextContainer}>
                <Text style={styles.healthServiceTitle} allowFontScaling={false}>Healthcare specialist services</Text>
                <Text style={styles.healthServiceSubtitle} allowFontScaling={false}>
                  Let's Mama Air track everything to more healthcare services.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.healthServiceButton}
                activeOpacity={0.7}
                onPress={() => {
                  setIsHealthServiceSheetVisible(false);
                  setIsHealthRequestSheetVisible(true);
                }}
              >
                <Text style={styles.healthServiceButtonText} allowFontScaling={false}>Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={isHealthRequestSheetVisible}
        onClose={() => setIsHealthRequestSheetVisible(false)}
        showHandle={false}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.healthRequestScrollContent}
        >
          <View style={styles.healthRequestHeader}>
            <View style={styles.healthRequestHeaderSpacer} />
            <View style={styles.healthRequestHeaderCenter}>
              <Text style={styles.healthRequestTitle} allowFontScaling={false}>Healthcare request</Text>
              <Text style={styles.healthRequestSubtitle} allowFontScaling={false}>Week {profile.pregnancyWeek || '—'}</Text>
            </View>
            <TouchableOpacity
              style={styles.healthRequestCloseButton}
              onPress={() => setIsHealthRequestSheetVisible(false)}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={faTimes as any}
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.healthRequestDivider} />

          <Text style={styles.healthRequestSectionTitle} allowFontScaling={false}>Services</Text>
          <View style={styles.healthRequestServicesBox}>
            {[
              { id: 'emergency', label: 'Emergency', icon: '🚑' },
              { id: 'appointment', label: 'Doctor or midwife appointment', icon: '🩺' },
              { id: 'medication', label: 'Medication Prescription', icon: '💊' },
            ].map((item) => {
              const selected = selectedHealthServices.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedHealthServices((prev) => {
                      if (prev.includes(item.id)) return prev.filter((x) => x !== item.id);
                      return [...prev, item.id];
                    });
                  }}
                  style={[
                    styles.healthServiceChip,
                    selected && styles.healthServiceChipSelected,
                  ]}
                >
                  <View style={styles.healthServiceChipIconCircle}>
                    <Text style={styles.healthServiceChipIconText} allowFontScaling={false}>{item.icon}</Text>
                  </View>
                  <Text style={styles.healthServiceChipText} allowFontScaling={false}>{item.label}</Text>
                  {selected && (
                    <View style={styles.healthServiceChipCheck}>
                      <FontAwesomeIcon icon={faCheck as any} size={ms(10)} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.healthRequestConsentContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (!isAgreementAccepted) {
                  // If agreement not accepted, show agreement first
                  setIsAgreementSheetVisible(true);
                } else {
                  // If already accepted, toggle consent
                  setIsDataConsentChecked((v) => !v);
                }
              }}
              style={styles.healthRequestConsentCard}
            >
              <View style={styles.healthRequestConsentIcon}>
                <FontAwesomeIcon icon={faShield as any} size={ms(18)} color="#2E6BFF" />
              </View>
              <View style={styles.healthRequestConsentText}>
                <Text style={styles.healthRequestConsentLabel} allowFontScaling={false}>Data Consent Agreement</Text>
                <Text style={styles.healthRequestConsentSubtitle} allowFontScaling={false}>
                  I consent to the processing of my data.
                </Text>
              </View>
              <View style={styles.healthRequestRadioOuter}>
                {isDataConsentChecked && isAgreementAccepted && <View style={styles.healthRequestRadioInner} />}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.healthRequestAgreementLink}
            activeOpacity={0.7}
            onPress={() => setIsAgreementSheetVisible(true)}
          >
            <Text style={styles.healthRequestAgreementLinkText} allowFontScaling={false}>Agreement Content</Text>
          </TouchableOpacity>

          <View style={styles.healthRequestEmailContainer}>
            <Text style={styles.healthRequestEmailLabel} allowFontScaling={false}>Email</Text>
            <View style={styles.healthRequestEmailBox}>
              <Text style={styles.healthRequestEmailText} allowFontScaling={false}>
                {profile.email || 'mary.anderson@gmail.com'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <FixedButtonContainer paddingBottom={insets.bottom}>
          <View style={styles.healthRequestBottomBar}>
            <View style={styles.healthRequestButtonRow}>
              <TouchableOpacity
                onPress={() => setIsHealthRequestSheetVisible(false)}
                style={styles.healthRequestCancelButton}
                activeOpacity={0.7}
              >
                <Text style={styles.healthRequestCancelText} allowFontScaling={false}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.healthRequestSubmitWrapper}>
                <Button
                  title="Request"
                  onPress={() => {
                    setIsHealthRequestSheetVisible(false);
                    setTimeout(() => setIsSuccessDialogVisible(true), 400);
                  }}
                  disabled={!isDataConsentChecked || !isAgreementAccepted || selectedHealthServices.length === 0}
                />
              </View>
            </View>
          </View>
        </FixedButtonContainer>
      </BottomSheet>

      {/* Agreement Bottom Sheet */}
      <BottomSheet
        visible={isAgreementSheetVisible}
        onClose={() => setIsAgreementSheetVisible(false)}
        showHandle={true}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          contentContainerStyle={styles.agreementScrollContent}
        >
          <View style={styles.agreementHeader}>
            <Text style={styles.agreementTitle} allowFontScaling={false}>Agreement</Text>
            <TouchableOpacity
              style={styles.agreementCloseButton}
              onPress={() => setIsAgreementSheetVisible(false)}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={faTimes as any}
                size={14}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.agreementServicesTitle} allowFontScaling={false}>
            By activating this consent, you will get these services:
          </Text>

          <View style={styles.agreementServicesBox}>
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={styles.agreementServicesScrollContent}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
            >
              <View style={styles.agreementServiceItem}>
                <Text style={styles.agreementServiceNumber} allowFontScaling={false}>1. Emergency Care</Text>
                <Text style={styles.agreementServiceDescription} allowFontScaling={false}>
                  Provides immediate medical attention to people experiencing sudden, serious illness or injury to stabilize their condition and prevent further harm.
                </Text>
              </View>
              <View style={styles.agreementServiceItem}>
                <Text style={styles.agreementServiceNumber} allowFontScaling={false}>2. Medication prescription</Text>
                <Text style={styles.agreementServiceDescription} allowFontScaling={false}>
                  Allows healthcare providers to prescribe medications based on your medical condition and needs to ensure proper treatment and recovery.
                </Text>
              </View>
              <View style={styles.agreementServiceItem}>
                <Text style={styles.agreementServiceNumber} allowFontScaling={false}>3. Doctor or midwife appointment</Text>
                <Text style={styles.agreementServiceDescription} allowFontScaling={false}>
                  Enables scheduling and management of appointments with healthcare professionals to monitor your health and receive ongoing care.
                </Text>
              </View>
              <View style={styles.agreementServiceItem}>
                <Text style={styles.agreementServiceNumber} allowFontScaling={false}>4. Health monitoring</Text>
                <Text style={styles.agreementServiceDescription} allowFontScaling={false}>
                  Continuous tracking of vital signs and health metrics to identify any changes or concerns early.
                </Text>
              </View>
              <View style={styles.agreementServiceItem}>
                <Text style={styles.agreementServiceNumber} allowFontScaling={false}>5. Medical records access</Text>
                <Text style={styles.agreementServiceDescription} allowFontScaling={false}>
                  Provides secure access to your medical history and records for better coordination of care.
                </Text>
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        <FixedButtonContainer paddingBottom={insets.bottom}>
          <View style={styles.healthRequestBottomBar}>
            <View style={styles.agreementButtonRow}>
              <TouchableOpacity
                onPress={() => {
                  setIsAgreementSheetVisible(false);
                  setIsAgreementAccepted(false);
                  // Uncheck consent if rejected
                  setIsDataConsentChecked(false);
                }}
                style={styles.agreementRejectButton}
                activeOpacity={0.7}
              >
                <Text style={styles.agreementRejectText} allowFontScaling={false}>Reject</Text>
              </TouchableOpacity>
              <View style={styles.agreementAcceptWrapper}>
                <Button
                  title="Accept"
                  onPress={() => {
                    setIsAgreementAccepted(true);
                    setIsAgreementSheetVisible(false);
                    // If opened from radio button, also check the consent
                    if (!isDataConsentChecked) {
                      setIsDataConsentChecked(true);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </FixedButtonContainer>
      </BottomSheet>

      {/* Success Dialog */}
      <Modal
        visible={isSuccessDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSuccessDialogVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.successOverlay}
          activeOpacity={1}
          onPress={() => setIsSuccessDialogVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.successCard}>
            <TouchableOpacity
              style={styles.successCloseButton}
              onPress={() => setIsSuccessDialogVisible(false)}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={faTimes as any}
                size={14}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={styles.successIconCircle}>
              <Image
                source={require('../assets/images/healthService.png')}
                style={styles.successImage}
              />
            </View>

            <Text style={styles.successTitle} allowFontScaling={false}>Request Saved</Text>
            <Text style={styles.successMessage} allowFontScaling={false}>
              Stay tuned, we will send you an{'\n'}email once your request approved
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <OEMAutostartGuide
        visible={isOemGuideVisible}
        onClose={() => setIsOemGuideVisible(false)}
      />
    </SafeAreaView>
  );
};

