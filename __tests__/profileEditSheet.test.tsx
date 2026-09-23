import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

const mockSaveProfileEditPayloads = jest.fn();
const mockShowToast = jest.fn();
const mockOnClose = jest.fn();
const mockSetName = jest.fn();

const mockProfile = {
  backendUserId: '1',
  photo: null,
  name: 'Mary',
  email: 'mary@example.com',
  birthday: '1994-06-12',
  expectedDueDate: null,
  height: 165,
  weight: 62,
  language: 'en',
  country: 'KE',
  area: 'urban',
  timezone: 'Africa/Nairobi',
  pregnancyWeek: 11,
  pregnancyWeekSetDate: null,
  pregnancyWeekConfirmed: true,
  pregnancyNumber: 'first',
  timeSpent: 'indoors',
  timeOfDay: 'mornings',
  cookingMethod: 'gas',
  ventilation: 'moderate',
  sleepHours: 8,
  activeHours: 2,
  workType: 'Desk',
  diet: 'carnivore',
  agreementAccepted: true,
  notifTimeFromHour: 9,
  notifTimeFromMinute: 0,
  notifTimeToHour: 21,
  notifTimeToMinute: 0,
  notifDays: '1111111',
};

const mockStore = {
  profile: mockProfile,
  setName: mockSetName,
  setEmail: jest.fn(),
  setBirthday: jest.fn(),
  setHeight: jest.fn(),
  setWeight: jest.fn(),
  setLanguage: jest.fn(),
  setCountry: jest.fn(),
  setArea: jest.fn(),
  setTimezone: jest.fn(),
  setPregnancyWeek: jest.fn(),
  setPregnancyNumber: jest.fn(),
  setTimeSpent: jest.fn(),
  setTimeOfDay: jest.fn(),
  setCookingMethod: jest.fn(),
  setVentilation: jest.fn(),
  setSleepHours: jest.fn(),
  setActiveHours: jest.fn(),
  setWorkType: jest.fn(),
  setDiet: jest.fn(),
};

jest.mock('../src/store/useUserStore', () => {
  const useUserStore = () => mockStore;
  useUserStore.getState = () => mockStore;
  return { useUserStore };
});

jest.mock('../src/services/profile/ProfileEditSaveService', () => ({
  saveProfileEditPayloads: (...args: unknown[]) =>
    mockSaveProfileEditPayloads(...args),
}));

jest.mock('../src/config/dev', () => ({ DEV_LOCAL_SESSION: false }));

jest.mock('../src/hooks/useMetaChoices', () => ({
  useMetaChoices: () => ({
    countries: [],
    languages: [],
    cooking_methods: [],
    work_types: [],
    diet_types: [],
  }),
}));

jest.mock('../src/theme', () => ({
  spacing: () => 8,
  radius: () => 8,
  useTheme: () => ({
    colors: {
      background: '#fff',
      neutral300: '#ddd',
      neutral400: '#aaa',
      neutral600: '#666',
      textPrimary: '#111',
    },
    typography: { fontFamily: { bold: 'Bold', regular: 'Regular' } },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en' },
  }),
}));

jest.mock('../src/components/ui', () => {
  const ReactModule = require('react');
  const {
    Pressable: NativePressable,
    Text: NativeText,
    View: NativeView,
  } = require('react-native');

  return {
    BottomSheet: ({ visible, children }: any) =>
      visible ? ReactModule.createElement(NativeView, null, children) : null,
    BottomSheetOption: () => null,
    Button: ({ title, onPress, disabled }: any) =>
      ReactModule.createElement(
        NativePressable,
        { testID: 'save-profile', onPress, disabled },
        ReactModule.createElement(NativeText, null, title),
      ),
    DatePicker: () => null,
    Dropdown: () => null,
    HeightWeightPicker: () => null,
    Input: ({ type, value, onChangeText }: any) =>
      ReactModule.createElement(NativeView, {
        testID: `profile-input-${type}`,
        value,
        onChangeText,
      }),
    useToast: () => ({ showToast: mockShowToast }),
  };
});

import { ProfileEditSheet } from '../src/components/profile/ProfileEditSheet';
import type { ProfileEditSaveResult } from '../src/services/profile/ProfileEditSaveService';

const saved: ProfileEditSaveResult = {
  profileSaved: true,
  emailSaved: true,
  lifestyleSaved: true,
  languageSaved: true,
  failed: false,
  partial: false,
};

const renderIdentitySheet = async () => {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <ProfileEditSheet visible section="identity" onClose={mockOnClose} />,
    );
  });
  return renderer!;
};

const changeName = (renderer: TestRenderer.ReactTestRenderer) => {
  act(() => {
    renderer.root
      .findByProps({ testID: 'profile-input-text' })
      .props.onChangeText('Mary A');
  });
};

describe('ProfileEditSheet save lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveProfileEditPayloads.mockResolvedValue(saved);
  });

  it('commits locally and closes only after the backend succeeds', async () => {
    const renderer = await renderIdentitySheet();
    changeName(renderer);

    await act(async () => {
      renderer.root.findByProps({ testID: 'save-profile' }).props.onPress();
      await Promise.resolve();
    });

    expect(mockSaveProfileEditPayloads).toHaveBeenCalledTimes(1);
    expect(mockSetName).toHaveBeenCalledWith('Mary A');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
  });

  it('keeps the draft open and local profile unchanged after a failure', async () => {
    mockSaveProfileEditPayloads.mockResolvedValue({
      ...saved,
      profileSaved: false,
      failed: true,
    });
    const renderer = await renderIdentitySheet();
    changeName(renderer);

    await act(async () => {
      renderer.root.findByProps({ testID: 'save-profile' }).props.onPress();
      await Promise.resolve();
    });

    expect(mockSetName).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(
      renderer.root.findAllByType(Text).map(node => node.props.children),
    ).toContain('profile.update_failed_message');
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('keeps failed email pending while committing the successful name', async () => {
    mockSaveProfileEditPayloads.mockResolvedValue({
      ...saved,
      emailSaved: false,
      failed: true,
      partial: true,
    });
    const renderer = await renderIdentitySheet();
    changeName(renderer);
    act(() => {
      renderer.root
        .findByProps({ testID: 'profile-input-email' })
        .props.onChangeText('mary.a@example.com');
    });

    await act(async () => {
      renderer.root.findByProps({ testID: 'save-profile' }).props.onPress();
      await Promise.resolve();
    });

    expect(mockSetName).toHaveBeenCalledWith('Mary A');
    expect(mockStore.setEmail).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(
      renderer.root.findAllByType(Text).map(node => node.props.children),
    ).toContain('profile.update_partial_message');
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('coalesces rapid save taps into one backend operation', async () => {
    let finishSave: (() => void) | undefined;
    mockSaveProfileEditPayloads.mockReturnValue(
      new Promise<ProfileEditSaveResult>(resolve => {
        finishSave = () => resolve(saved);
      }),
    );
    const renderer = await renderIdentitySheet();
    changeName(renderer);
    const saveButton = renderer.root.findByProps({ testID: 'save-profile' });

    act(() => {
      saveButton.props.onPress();
      saveButton.props.onPress();
    });

    expect(mockSaveProfileEditPayloads).toHaveBeenCalledTimes(1);
    expect(mockSetName).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(
      renderer.root.findByProps({ testID: 'save-profile' }).props.disabled,
    ).toBe(true);

    await act(async () => {
      finishSave?.();
      await Promise.resolve();
    });
  });
});
