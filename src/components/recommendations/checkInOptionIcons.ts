import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBatteryQuarter,
  faBed,
  faBolt,
  faBrain,
  faChildReaching,
  faCloud,
  faDroplet,
  faEye,
  faFaceAngry,
  faFaceDizzy,
  faFaceGrimace,
  faFaceMeh,
  faFaceTired,
  faGlassWaterDroplet,
  faHandDots,
  faHeartPulse,
  faLeaf,
  faLungs,
  faPersonPregnant,
  faShoePrints,
  faStethoscope,
  faTemperatureHigh,
  faToilet,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import type { FeelingCheckInItem } from '../../types/recommendationExperience';

export interface CheckInOptionIconPresentation {
  icon: IconDefinition;
  color: string;
  backgroundColor: string;
}

interface SemanticIconRule {
  pattern: RegExp;
  icon: IconDefinition;
}

const SEMANTIC_ICON_RULES: SemanticIconRule[] = [
  {
    pattern: /bleed/,
    icon: faDroplet,
  },
  {
    pattern: /leak|fluid/,
    icon: faDroplet,
  },
  {
    pattern: /thirst|dry mouth/,
    icon: faGlassWaterDroplet,
  },
  {
    pattern: /fever|temperature/,
    icon: faTemperatureHigh,
  },
  {
    pattern: /blur|vision|eye/,
    icon: faEye,
  },
  {
    pattern: /fetal movement|stillness|baby movement|kick/,
    icon: faChildReaching,
  },
  {
    pattern: /chest|heart|palpitation/,
    icon: faHeartPulse,
  },
  {
    pattern: /breath|lung/,
    icon: faLungs,
  },
  {
    pattern: /urinat|toilet/,
    icon: faToilet,
  },
  {
    pattern: /headache|head pain/,
    icon: faFaceGrimace,
  },
  {
    pattern: /dizz|lightheaded|vertigo/,
    icon: faFaceDizzy,
  },
  {
    pattern: /nause|vomit|appetite|feel sick/,
    icon: faFaceTired,
  },
  {
    pattern: /sleep|insomnia/,
    icon: faBed,
  },
  {
    pattern: /fatigue|tired|exhaust|weak|energy/,
    icon: faBatteryQuarter,
  },
  {
    pattern: /anxious|anxiety|worr|nervous/,
    icon: faBrain,
  },
  {
    pattern: /stress|overwhelm|distress/,
    icon: faCloud,
  },
  {
    pattern: /irritab|restless|agitat/,
    icon: faBolt,
  },
  {
    pattern: /angry|anger/,
    icon: faFaceAngry,
  },
  {
    pattern: /swollen feet|foot swell|feet swell/,
    icon: faShoePrints,
  },
  {
    pattern: /swell|pale|pallor|skin|nail/,
    icon: faHandDots,
  },
  {
    pattern: /abdom|back pain|uter|contraction|pelvic/,
    icon: faPersonPregnant,
  },
];

const getCategoryPresentation = (
  item: FeelingCheckInItem,
): Omit<CheckInOptionIconPresentation, 'icon'> => {
  if (item.group === 'warning') {
    return {
      color: '#B93838',
      backgroundColor: '#FFF0F0',
    };
  }

  if (item.kind === 'mood') {
    return {
      color: '#76508F',
      backgroundColor: '#F4EEFA',
    };
  }

  if (item.kind === 'wellbeingFeeling') {
    return {
      color: '#2D7B46',
      backgroundColor: '#EAF6EE',
    };
  }

  return {
    color: '#C84B00',
    backgroundColor: '#FFF1E6',
  };
};

const getDefaultIcon = (
  item: FeelingCheckInItem,
): IconDefinition => {
  if (item.group === 'warning') return faTriangleExclamation;
  if (item.kind === 'mood') return faFaceMeh;
  if (item.kind === 'wellbeingFeeling') return faLeaf;
  return faStethoscope;
};

export const resolveCheckInOptionIcon = (
  item: FeelingCheckInItem,
): CheckInOptionIconPresentation => {
  const searchableValue = `${item.key} ${item.name}`.toLowerCase();
  const semanticIcon = SEMANTIC_ICON_RULES.find(rule =>
    rule.pattern.test(searchableValue),
  )?.icon;

  return {
    icon: semanticIcon ?? getDefaultIcon(item),
    ...getCategoryPresentation(item),
  };
};
