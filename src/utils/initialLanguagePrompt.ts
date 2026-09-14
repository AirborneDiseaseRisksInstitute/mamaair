import { userStorage } from '../store/useUserStore';

const INITIAL_LANGUAGE_PROMPT_SEEN_KEY = 'install_initial_language_prompt_seen';

export const hasSeenInitialLanguagePrompt = (): boolean =>
  userStorage.getBoolean(INITIAL_LANGUAGE_PROMPT_SEEN_KEY) === true;

export const markInitialLanguagePromptSeen = (): void => {
  userStorage.set(INITIAL_LANGUAGE_PROMPT_SEEN_KEY, true);
};

export const consumeInitialLanguagePrompt = (
  hasExistingLanguage: boolean,
): boolean => {
  if (hasSeenInitialLanguagePrompt()) return false;

  markInitialLanguagePromptSeen();
  return !hasExistingLanguage;
};
