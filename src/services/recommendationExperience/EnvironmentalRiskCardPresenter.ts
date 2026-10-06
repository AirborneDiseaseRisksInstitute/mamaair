import {
  classifyApiFailure,
  type ApiFailure,
} from '../../utils/apiErrors';

export type EnvironmentalRiskLoadError = ApiFailure;

export type EnvironmentalRiskCardState =
  | 'data'
  | 'loading'
  | 'empty'
  | 'error';

export const classifyEnvironmentalRiskLoadError = (
  error: unknown,
): EnvironmentalRiskLoadError => classifyApiFailure(error);

export const resolveEnvironmentalRiskCardState = ({
  hasData,
  isLoading,
  loadError,
}: {
  hasData: boolean;
  isLoading: boolean;
  loadError: EnvironmentalRiskLoadError | null;
}): EnvironmentalRiskCardState => {
  if (hasData) return 'data';
  if (isLoading) return 'loading';
  if (loadError) return 'error';
  return 'empty';
};
