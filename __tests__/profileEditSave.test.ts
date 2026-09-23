const mockPatchProfile = jest.fn();
const mockPatchLifestyle = jest.fn();
const mockSetLanguage = jest.fn();

jest.mock('../src/services/api/ProfileService', () => ({
  ProfileService: {
    patchProfile: (...args: unknown[]) => mockPatchProfile(...args),
  },
}));

jest.mock('../src/services/api/LifestyleService', () => ({
  LifestyleService: {
    patchLifestyle: (...args: unknown[]) => mockPatchLifestyle(...args),
  },
}));

jest.mock('../src/services/api/LanguageService', () => ({
  LanguageService: {
    setLanguage: (...args: unknown[]) => mockSetLanguage(...args),
  },
}));

import { saveProfileEditPayloads } from '../src/services/profile/ProfileEditSaveService';
import type { ProfileEditPayloads } from '../src/utils/profileEdit';

const payloads: ProfileEditPayloads = {
  profile: { name: 'Mary A', language: 'fr' },
  email: { email: 'mary.a@example.com' },
  lifestyle: { average_sleep_hours: 9 },
  languageChanged: true,
};

describe('saveProfileEditPayloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPatchProfile.mockResolvedValue({});
    mockPatchLifestyle.mockResolvedValue({});
    mockSetLanguage.mockResolvedValue({});
  });

  it('waits for every changed profile API', async () => {
    await expect(saveProfileEditPayloads(payloads)).resolves.toEqual({
      profileSaved: true,
      emailSaved: true,
      lifestyleSaved: true,
      languageSaved: true,
      failed: false,
      partial: false,
    });

    expect(mockPatchProfile).toHaveBeenNthCalledWith(1, payloads.profile);
    expect(mockPatchProfile).toHaveBeenNthCalledWith(2, payloads.email);
    expect(mockPatchLifestyle).toHaveBeenCalledWith(payloads.lifestyle);
    expect(mockSetLanguage).toHaveBeenCalledWith('fr');
  });

  it('reports a partial save when one independent API fails', async () => {
    mockPatchLifestyle.mockRejectedValue(new Error('network failed'));

    await expect(saveProfileEditPayloads(payloads)).resolves.toEqual({
      profileSaved: true,
      emailSaved: true,
      lifestyleSaved: false,
      languageSaved: true,
      failed: true,
      partial: true,
    });
    expect(mockPatchProfile).toHaveBeenCalledTimes(2);
    expect(mockSetLanguage).toHaveBeenCalledTimes(1);
  });

  it('reports a complete failure when no changed field is saved', async () => {
    mockPatchProfile.mockRejectedValue(new Error('profile failed'));
    mockPatchLifestyle.mockRejectedValue(new Error('lifestyle failed'));

    await expect(saveProfileEditPayloads(payloads)).resolves.toEqual({
      profileSaved: false,
      emailSaved: false,
      lifestyleSaved: false,
      languageSaved: false,
      failed: true,
      partial: false,
    });
    expect(mockSetLanguage).not.toHaveBeenCalled();
  });

  it('does not call APIs when nothing changed', async () => {
    await expect(
      saveProfileEditPayloads({
        profile: {},
        email: {},
        lifestyle: {},
        languageChanged: false,
      }),
    ).resolves.toMatchObject({ failed: false, partial: false });

    expect(mockPatchProfile).not.toHaveBeenCalled();
    expect(mockPatchLifestyle).not.toHaveBeenCalled();
    expect(mockSetLanguage).not.toHaveBeenCalled();
  });
});
