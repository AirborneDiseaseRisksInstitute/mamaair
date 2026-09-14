import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { formatLocalDate } from '../utils/dateUtils';

export const userStorage = createMMKV();

export interface UserProfile {
  backendUserId: string | null;
  photo: string | null;
  name: string | null;
  email: string | null;
  birthday: string | null; // ISO date string
  expectedDueDate: string | null; // ISO date string
  height: number | null; // in cm
  weight: number | null; // in kg
  language: string | null;
  country: string | null;
  area: string | null;
  timezone: string | null; // IANA timezone e.g. Africa/Nairobi
  pregnancyWeek: number | null; // current pregnancy week (1-40)
  pregnancyWeekSetDate: string | null; // ISO date string of when pregnancyWeek was recorded
  pregnancyWeekConfirmed: boolean; // explicitly selected by the user, not only supplied by the API
  pregnancyNumber: string | null; // first, second, third, moreThan3
  timeSpent: string | null;
  timeOfDay: string | null;
  // Step 7
  cookingMethod: string | null;
  ventilation: string | null;
  // Step 8
  sleepHours: number | null;
  activeHours: number | null;
  // Step 9
  workType: string | null;
  // Step 10
  diet: string | null;
  agreementAccepted: boolean;
  // Notification time window
  notifTimeFromHour: number | null; // 0-23
  notifTimeFromMinute: number | null; // 0-59
  notifTimeToHour: number | null;
  notifTimeToMinute: number | null;
  notifDays: string | null; // "1111111" Sun-Sat, 1=on 0=off
}

interface UserStore {
  profile: UserProfile;
  setPhoto: (photoUri: string | null) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setBirthday: (birthday: Date | null) => void;
  setExpectedDueDate: (expectedDueDate: Date | null) => void;
  setHeight: (height: number | null) => void;
  setWeight: (weight: number | null) => void;
  setLanguage: (language: string) => void;
  setCountry: (country: string) => void;
  setArea: (area: string) => void;
  setTimezone: (tz: string | null) => void;
  setPregnancyWeek: (week: number | null) => void;
  setPregnancyNumber: (n: string | null) => void;
  setTimeSpent: (timeSpent: string | null) => void;
  setTimeOfDay: (timeOfDay: string | null) => void;
  setCookingMethod: (method: string | null) => void;
  setVentilation: (ventilation: string | null) => void;
  setSleepHours: (hours: number | null) => void;
  setActiveHours: (hours: number | null) => void;
  setWorkType: (type: string | null) => void;
  setDiet: (diet: string | null) => void;
  setAgreementAccepted: (accepted: boolean) => void;
  setNotifTime: (from: { hour: number; minute: number }, to: { hour: number; minute: number }, days: string) => void;
  setProfile: (profile: Partial<UserProfile>) => void;
  getProfile: () => UserProfile;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: {
    backendUserId: userStorage.getString('user_backend_id') || null,
    photo: userStorage.getString('user_photo') || null,
    name: userStorage.getString('user_name') || null,
    email: userStorage.getString('user_email') || null,
    birthday: userStorage.getString('user_birthday') || null,
    expectedDueDate: userStorage.getString('user_expected_due_date') || null,
    height: userStorage.getNumber('user_height') || null,
    weight: userStorage.getNumber('user_weight') || null,
    language: userStorage.getString('user_language') || null,
    country: userStorage.getString('user_country') || null,
    area: userStorage.getString('user_area') || null,
    timezone: userStorage.getString('user_timezone') || null,
    pregnancyWeek: userStorage.getNumber('user_pregnancy_week') || null,
    pregnancyWeekSetDate: userStorage.getString('user_pregnancy_week_set_date') || null,
    pregnancyWeekConfirmed:
      userStorage.getBoolean('user_pregnancy_week_confirmed') ??
      Boolean(
        userStorage.getBoolean('user_agreement_accepted') &&
          userStorage.getNumber('user_pregnancy_week'),
      ),
    pregnancyNumber: userStorage.getString('user_pregnancy_number') || null,
    timeSpent: userStorage.getString('user_time_spent') || null,
    timeOfDay: userStorage.getString('user_time_of_day') || null,
    cookingMethod: userStorage.getString('user_cooking_method') || null,
    ventilation: userStorage.getString('user_ventilation') || null,
    sleepHours: userStorage.getNumber('user_sleep_hours') || null,
    activeHours: userStorage.getNumber('user_active_hours') || null,
    workType: userStorage.getString('user_work_type') || null,
    diet: userStorage.getString('user_diet') || null,
    agreementAccepted: userStorage.getBoolean('user_agreement_accepted') || false,
    notifTimeFromHour: userStorage.getNumber('user_notif_from_hour') ?? 9,
    notifTimeFromMinute: userStorage.getNumber('user_notif_from_min') ?? 0,
    notifTimeToHour: userStorage.getNumber('user_notif_to_hour') ?? 21,
    notifTimeToMinute: userStorage.getNumber('user_notif_to_min') ?? 0,
    notifDays: userStorage.getString('user_notif_days') || '1111111',
  },
  setPhoto: (photoUri) => {
    if (photoUri !== null) {
      userStorage.set('user_photo', photoUri);
    } else {
      userStorage.remove('user_photo');
    }
    set((state) => ({
      profile: { ...state.profile, photo: photoUri },
    }));
  },
  setName: (name) => {
    userStorage.set('user_name', name);
    set((state) => ({
      profile: { ...state.profile, name },
    }));
  },
  setEmail: (email) => {
    userStorage.set('user_email', email);
    set((state) => ({
      profile: { ...state.profile, email },
    }));
  },
  setBirthday: (birthday) => {
    const dateString = birthday ? formatLocalDate(birthday) : null;
    if (dateString) {
      userStorage.set('user_birthday', dateString);
    } else {
      userStorage.remove('user_birthday');
    }
    set((state) => ({
      profile: { ...state.profile, birthday: dateString },
    }));
  },
  setExpectedDueDate: (expectedDueDate) => {
    const dateString = expectedDueDate ? formatLocalDate(expectedDueDate) : null;
    if (dateString) {
      userStorage.set('user_expected_due_date', dateString);
    } else {
      userStorage.remove('user_expected_due_date');
    }
    set((state) => ({
      profile: { ...state.profile, expectedDueDate: dateString },
    }));
  },
  setHeight: (height) => {
    if (height !== null) {
      userStorage.set('user_height', height);
    } else {
      userStorage.remove('user_height');
    }
    set((state) => ({
      profile: { ...state.profile, height },
    }));
  },
  setWeight: (weight) => {
    if (weight !== null) {
      userStorage.set('user_weight', weight);
    } else {
      userStorage.remove('user_weight');
    }
    set((state) => ({
      profile: { ...state.profile, weight },
    }));
  },
  setLanguage: (language) => {
    userStorage.set('user_language', language);
    set((state) => ({
      profile: { ...state.profile, language },
    }));
  },
  setCountry: (country) => {
    userStorage.set('user_country', country);
    set((state) => ({
      profile: { ...state.profile, country },
    }));
  },
  setArea: (area) => {
    userStorage.set('user_area', area);
    set((state) => ({
      profile: { ...state.profile, area },
    }));
  },
  setTimezone: (tz) => {
    if (tz !== null) {
      userStorage.set('user_timezone', tz);
    } else {
      userStorage.remove('user_timezone');
    }
    set((state) => ({
      profile: { ...state.profile, timezone: tz },
    }));
  },
  setPregnancyWeek: (week) => {
    const today = formatLocalDate(new Date());
    if (week !== null) {
      userStorage.set('user_pregnancy_week', week);
      userStorage.set('user_pregnancy_week_set_date', today);
      userStorage.set('user_pregnancy_week_confirmed', true);
    } else {
      userStorage.remove('user_pregnancy_week');
      userStorage.remove('user_pregnancy_week_set_date');
      userStorage.remove('user_pregnancy_week_confirmed');
    }
    set((state) => ({
      profile: {
        ...state.profile,
        pregnancyWeek: week,
        pregnancyWeekSetDate: week !== null ? today : null,
        pregnancyWeekConfirmed: week !== null,
      },
    }));
  },
  setPregnancyNumber: (n) => {
    if (n !== null) {
      userStorage.set('user_pregnancy_number', n);
    } else {
      userStorage.remove('user_pregnancy_number');
    }
    set((state) => ({
      profile: { ...state.profile, pregnancyNumber: n },
    }));
  },
  setTimeSpent: (timeSpent) => {
    if (timeSpent !== null) {
      userStorage.set('user_time_spent', timeSpent);
    } else {
      userStorage.remove('user_time_spent');
    }
    set((state) => ({
      profile: { ...state.profile, timeSpent },
    }));
  },
  setTimeOfDay: (timeOfDay) => {
    if (timeOfDay !== null) {
      userStorage.set('user_time_of_day', timeOfDay);
    } else {
      userStorage.remove('user_time_of_day');
    }
    set((state) => ({
      profile: { ...state.profile, timeOfDay },
    }));
  },
  setCookingMethod: (method) => {
    if (method !== null) {
      userStorage.set('user_cooking_method', method);
    } else {
      userStorage.remove('user_cooking_method');
    }
    set((state) => ({
      profile: { ...state.profile, cookingMethod: method },
    }));
  },
  setVentilation: (ventilation) => {
    if (ventilation !== null) {
      userStorage.set('user_ventilation', ventilation);
    } else {
      userStorage.remove('user_ventilation');
    }
    set((state) => ({
      profile: { ...state.profile, ventilation },
    }));
  },
  setSleepHours: (hours) => {
    if (hours !== null) {
      userStorage.set('user_sleep_hours', hours);
    } else {
      userStorage.remove('user_sleep_hours');
    }
    set((state) => ({
      profile: { ...state.profile, sleepHours: hours },
    }));
  },
  setActiveHours: (hours) => {
    if (hours !== null) {
      userStorage.set('user_active_hours', hours);
    } else {
      userStorage.remove('user_active_hours');
    }
    set((state) => ({
      profile: { ...state.profile, activeHours: hours },
    }));
  },
  setWorkType: (type) => {
    if (type !== null) {
      userStorage.set('user_work_type', type);
    } else {
      userStorage.remove('user_work_type');
    }
    set((state) => ({
      profile: { ...state.profile, workType: type },
    }));
  },
  setDiet: (diet) => {
    if (diet !== null) {
      userStorage.set('user_diet', diet);
    } else {
      userStorage.remove('user_diet');
    }
    set((state) => ({
      profile: { ...state.profile, diet },
    }));
  },
  setAgreementAccepted: (accepted) => {
    userStorage.set('user_agreement_accepted', accepted);
    set((state) => ({
      profile: { ...state.profile, agreementAccepted: accepted },
    }));
  },
  setNotifTime: (from, to, days) => {
    userStorage.set('user_notif_from_hour', from.hour);
    userStorage.set('user_notif_from_min', from.minute);
    userStorage.set('user_notif_to_hour', to.hour);
    userStorage.set('user_notif_to_min', to.minute);
    userStorage.set('user_notif_days', days);
    set((state) => ({
      profile: {
        ...state.profile,
        notifTimeFromHour: from.hour,
        notifTimeFromMinute: from.minute,
        notifTimeToHour: to.hour,
        notifTimeToMinute: to.minute,
        notifDays: days,
      },
    }));
  },
  setProfile: (profileData) => {
    // Bulk update store and storage
    if (profileData.backendUserId != null) userStorage.set('user_backend_id', profileData.backendUserId);
    if (profileData.photo) userStorage.set('user_photo', profileData.photo);
    if (profileData.name) userStorage.set('user_name', profileData.name);
    if (profileData.email) userStorage.set('user_email', profileData.email);
    if (profileData.birthday) userStorage.set('user_birthday', profileData.birthday);
    if (profileData.expectedDueDate) userStorage.set('user_expected_due_date', profileData.expectedDueDate);
    if (profileData.height) userStorage.set('user_height', profileData.height);
    if (profileData.weight) userStorage.set('user_weight', profileData.weight);
    if (profileData.language) userStorage.set('user_language', profileData.language);
    if (profileData.country) userStorage.set('user_country', profileData.country);
    if (profileData.area) userStorage.set('user_area', profileData.area);
    if (profileData.timezone) userStorage.set('user_timezone', profileData.timezone);
    if (profileData.pregnancyWeek) userStorage.set('user_pregnancy_week', profileData.pregnancyWeek);
    if (profileData.pregnancyWeekSetDate) userStorage.set('user_pregnancy_week_set_date', profileData.pregnancyWeekSetDate);
    if (profileData.pregnancyWeekConfirmed !== undefined) userStorage.set('user_pregnancy_week_confirmed', profileData.pregnancyWeekConfirmed);
    if (profileData.pregnancyNumber) userStorage.set('user_pregnancy_number', profileData.pregnancyNumber);
    if (profileData.timeSpent) userStorage.set('user_time_spent', profileData.timeSpent);
    if (profileData.timeOfDay) userStorage.set('user_time_of_day', profileData.timeOfDay);
    if (profileData.cookingMethod) userStorage.set('user_cooking_method', profileData.cookingMethod);
    if (profileData.ventilation) userStorage.set('user_ventilation', profileData.ventilation);
    if (profileData.sleepHours) userStorage.set('user_sleep_hours', profileData.sleepHours);
    if (profileData.activeHours) userStorage.set('user_active_hours', profileData.activeHours);
    if (profileData.workType) userStorage.set('user_work_type', profileData.workType);
    if (profileData.diet) userStorage.set('user_diet', profileData.diet);
    if (profileData.agreementAccepted !== undefined) userStorage.set('user_agreement_accepted', profileData.agreementAccepted);
    if (profileData.notifTimeFromHour != null) userStorage.set('user_notif_from_hour', profileData.notifTimeFromHour);
    if (profileData.notifTimeFromMinute != null) userStorage.set('user_notif_from_min', profileData.notifTimeFromMinute);
    if (profileData.notifTimeToHour != null) userStorage.set('user_notif_to_hour', profileData.notifTimeToHour);
    if (profileData.notifTimeToMinute != null) userStorage.set('user_notif_to_min', profileData.notifTimeToMinute);
    if (profileData.notifDays) userStorage.set('user_notif_days', profileData.notifDays);
    
    set((state) => ({
      profile: { ...state.profile, ...profileData },
    }));
  },
  getProfile: () => {
    return get().profile;
  },
  clearUser: () => {
    userStorage.remove('user_backend_id');
    userStorage.remove('user_photo');
    userStorage.remove('user_name');
    userStorage.remove('user_email');
    userStorage.remove('user_birthday');
    userStorage.remove('user_expected_due_date');
    userStorage.remove('user_height');
    userStorage.remove('user_weight');
    userStorage.remove('user_language');
    userStorage.remove('user_country');
    userStorage.remove('user_area');
    userStorage.remove('user_timezone');
    userStorage.remove('user_pregnancy_week');
    userStorage.remove('user_pregnancy_week_set_date');
    userStorage.remove('user_pregnancy_week_confirmed');
    userStorage.remove('user_pregnancy_number');
    userStorage.remove('user_time_spent');
    userStorage.remove('user_time_of_day');
    userStorage.remove('user_cooking_method');
    userStorage.remove('user_ventilation');
    userStorage.remove('user_sleep_hours');
    userStorage.remove('user_active_hours');
    userStorage.remove('user_work_type');
    userStorage.remove('user_diet');
    userStorage.remove('user_agreement_accepted');
    userStorage.remove('user_notif_from_hour');
    userStorage.remove('user_notif_from_min');
    userStorage.remove('user_notif_to_hour');
    userStorage.remove('user_notif_to_min');
    userStorage.remove('user_notif_days');
    
    set({
      profile: {
        backendUserId: null,
        photo: null,
        name: null,
        email: null,
        birthday: null,
        expectedDueDate: null,
        height: null,
        weight: null,
        language: null,
        country: null,
        area: null,
        timezone: null,
        pregnancyWeek: null,
        pregnancyWeekSetDate: null,
        pregnancyWeekConfirmed: false,
        pregnancyNumber: null,
        timeSpent: null,
        timeOfDay: null,
        cookingMethod: null,
        ventilation: null,
        sleepHours: null,
        activeHours: null,
        workType: null,
        diet: null,
        agreementAccepted: false,
        notifTimeFromHour: 9,
        notifTimeFromMinute: 0,
        notifTimeToHour: 21,
        notifTimeToMinute: 0,
        notifDays: '1111111',
      }
    });
  },
}));
