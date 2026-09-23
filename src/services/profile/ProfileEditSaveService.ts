import type { ProfileEditPayloads } from '../../utils/profileEdit';
import { LanguageService } from '../api/LanguageService';
import { LifestyleService } from '../api/LifestyleService';
import { ProfileService } from '../api/ProfileService';

export interface ProfileEditSaveResult {
  profileSaved: boolean;
  emailSaved: boolean;
  lifestyleSaved: boolean;
  languageSaved: boolean;
  failed: boolean;
  partial: boolean;
}

export const saveProfileEditPayloads = async (
  payloads: ProfileEditPayloads,
): Promise<ProfileEditSaveResult> => {
  const hasProfile = Object.keys(payloads.profile).length > 0;
  const hasEmail = Object.keys(payloads.email).length > 0;
  const hasLifestyle = Object.keys(payloads.lifestyle).length > 0;
  let profileSaved = !hasProfile;
  let emailSaved = !hasEmail;
  let lifestyleSaved = !hasLifestyle;
  let languageSaved = !payloads.languageChanged;

  if (hasProfile) {
    try {
      await ProfileService.patchProfile(payloads.profile);
      profileSaved = true;
    } catch {
      // Keep going: independent fields can still be saved.
    }
  }
  if (hasEmail) {
    try {
      await ProfileService.patchProfile(payloads.email);
      emailSaved = true;
    } catch {
      // Account-level email restrictions must not block lifestyle updates.
    }
  }
  if (hasLifestyle) {
    try {
      await LifestyleService.patchLifestyle(payloads.lifestyle);
      lifestyleSaved = true;
    } catch {
      // Leave this group pending for retry.
    }
  }
  if (payloads.languageChanged && profileSaved) {
    try {
      await LanguageService.setLanguage(String(payloads.profile.language));
      languageSaved = true;
    } catch {
      // A successful profile PATCH must not be reported as a complete save.
    }
  }

  const failed =
    !profileSaved || !emailSaved || !lifestyleSaved || !languageSaved;
  const partial =
    failed &&
    ((hasProfile && profileSaved) ||
      (hasEmail && emailSaved) ||
      (hasLifestyle && lifestyleSaved));

  return {
    profileSaved,
    emailSaved,
    lifestyleSaved,
    languageSaved,
    failed,
    partial,
  };
};
