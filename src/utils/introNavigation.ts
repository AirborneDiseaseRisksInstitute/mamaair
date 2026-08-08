export type IntroCompletionReason = 'completed' | 'skipped';

export const resolveIntroCompletionRoute = (
  _reason: IntroCompletionReason,
): 'IntroLoading' => 'IntroLoading';
