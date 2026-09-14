import React, { useCallback, useMemo, useState } from 'react';
import { IntroStep03 } from './intro/steps/IntroStep03';
import { IntroStep05 } from './intro/steps/IntroStep05';
import { IntroStep05Timezone } from './intro/steps/IntroStep05Timezone';
import { IntroStep06 } from './intro/steps/IntroStep06';
import { IntroStep07 } from './intro/steps/IntroStep07';
import { IntroStep08 } from './intro/steps/IntroStep08';
import { IntroStep09 } from './intro/steps/IntroStep09';
import { IntroStep10 } from './intro/steps/IntroStep10';
import { IntroStep10Pregnancy } from './intro/steps/IntroStep10Pregnancy';
import { IntroStep11 } from './intro/steps/IntroStep11';
import { IntroStep14 } from './intro/steps/IntroStep14';
import { useUserStore } from '../store/useUserStore';
import {
  nextMissingPlanProfileStep,
  type PlanProfileStep,
} from '../utils/planReadiness';

type PlanSetupStep = PlanProfileStep | 'IntroStep14';

interface PlanProfileSetupScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

const resolveInitialStep = (): PlanSetupStep =>
  nextMissingPlanProfileStep(useUserStore.getState().profile) ?? 'IntroStep14';

export const PlanProfileSetupScreen: React.FC<PlanProfileSetupScreenProps> = ({
  onComplete,
  onCancel,
}) => {
  const [history, setHistory] = useState<PlanSetupStep[]>(() => [
    resolveInitialStep(),
  ]);
  const activeStep = history[history.length - 1];

  const handleBack = useCallback(() => {
    if (history.length === 1) {
      onCancel();
      return;
    }
    setHistory(current => current.slice(0, -1));
  }, [history.length, onCancel]);

  const handleNext = useCallback(() => {
    if (activeStep === 'IntroStep14') {
      onComplete();
      return;
    }

    const nextStep = nextMissingPlanProfileStep(
      useUserStore.getState().profile,
      activeStep,
    );
    setHistory(current => [...current, nextStep ?? 'IntroStep14']);
  }, [activeStep, onComplete]);

  return useMemo(() => {
    const shared = { onNext: handleNext, onBack: handleBack };
    switch (activeStep) {
      case 'IntroStep03':
        return <IntroStep03 {...shared} />;
      case 'IntroStep05':
        return <IntroStep05 {...shared} />;
      case 'IntroStep05Timezone':
        return <IntroStep05Timezone {...shared} />;
      case 'IntroStep11':
        return <IntroStep11 {...shared} />;
      case 'IntroStep06':
        return <IntroStep06 {...shared} showSkip={false} />;
      case 'IntroStep07':
        return <IntroStep07 {...shared} showSkip={false} />;
      case 'IntroStep08':
        return <IntroStep08 {...shared} showSkip={false} />;
      case 'IntroStep09':
        return <IntroStep09 {...shared} showSkip={false} />;
      case 'IntroStep10':
        return <IntroStep10 {...shared} showSkip={false} />;
      case 'IntroStep10Pregnancy':
        return <IntroStep10Pregnancy {...shared} showSkip={false} />;
      case 'IntroStep14':
        return (
          <IntroStep14 {...shared} requireSuccessfulSave showSkip={false} />
        );
    }
  }, [activeStep, handleBack, handleNext]);
};
