const mockValues = new Map<string, boolean>();

jest.mock('../src/store/useUserStore', () => ({
  userStorage: {
    getBoolean: jest.fn((key: string) => mockValues.get(key)),
    set: jest.fn((key: string, value: boolean) => mockValues.set(key, value)),
    remove: jest.fn((key: string) => mockValues.delete(key)),
  },
}));

import {
  consumeInitialLanguagePrompt,
  hasSeenInitialLanguagePrompt,
  markInitialLanguagePromptSeen,
  resetInitialLanguagePrompt,
} from '../src/utils/initialLanguagePrompt';

describe('initial language prompt session preference', () => {
  beforeEach(() => {
    mockValues.clear();
    jest.clearAllMocks();
  });

  it('is visible only until it has been marked as seen', () => {
    expect(hasSeenInitialLanguagePrompt()).toBe(false);

    markInitialLanguagePromptSeen();

    expect(hasSeenInitialLanguagePrompt()).toBe(true);
  });

  it('consumes the automatic prompt on its first visit', () => {
    expect(consumeInitialLanguagePrompt(false)).toBe(true);
    expect(consumeInitialLanguagePrompt(false)).toBe(false);
  });

  it('migrates an existing language without showing the prompt', () => {
    expect(consumeInitialLanguagePrompt(true)).toBe(false);
    expect(hasSeenInitialLanguagePrompt()).toBe(true);
  });

  it('can be reset so logout or account deletion shows it next session', () => {
    markInitialLanguagePromptSeen();

    resetInitialLanguagePrompt();

    expect(hasSeenInitialLanguagePrompt()).toBe(false);
    expect(consumeInitialLanguagePrompt(false)).toBe(true);
  });
});
