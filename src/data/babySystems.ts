export interface BabySystemDef {
  id: string;
  name: string;
  iconKey: string;
  startWeek: number;
  matureWeek: number;
}

export interface BabySystem {
  id: string;
  name: string;
  iconKey: string;
  percentage: number;
  increment: number;
  isActive: boolean;
  startInWeeks?: number;
}

export const BABY_SYSTEM_DEFS: BabySystemDef[] = [
  { id: 'nervous', name: 'Nervous', iconKey: 'brainSystem.svg', startWeek: 3, matureWeek: 40 },
  { id: 'cardiovascular', name: 'Cardiovascular', iconKey: 'heartSystem.svg', startWeek: 4, matureWeek: 40 },
  { id: 'sensory', name: 'Sensory Organs', iconKey: 'senseSystem.svg', startWeek: 6, matureWeek: 37 },
  { id: 'digestive', name: 'Digestive', iconKey: 'digestiveSystem.svg', startWeek: 9, matureWeek: 38 },
  { id: 'urinary', name: 'Urinary', iconKey: 'urinary.svg', startWeek: 10, matureWeek: 34 },
  { id: 'skeletal', name: 'Skeletal', iconKey: 'boneSystem.svg', startWeek: 13, matureWeek: 36 },
  { id: 'muscular', name: 'Muscular', iconKey: 'boneSystem.svg', startWeek: 14, matureWeek: 38 },
  { id: 'endocrine', name: 'Endocrine', iconKey: 'endocrineSystem.svg', startWeek: 14, matureWeek: 37 },
  { id: 'respiratory', name: 'Respiratory', iconKey: 'respiratorySystem.svg', startWeek: 18, matureWeek: 37 },
  { id: 'integumentary', name: 'Integumentary', iconKey: 'integumentarySystem.svg', startWeek: 18, matureWeek: 38 },
  { id: 'immune', name: 'Immune', iconKey: 'immuneSystem.svg', startWeek: 28, matureWeek: 37 },
];

export function computeBabySystems(currentWeek: number): BabySystem[] {
  return BABY_SYSTEM_DEFS.map((def) => {
    const isActive = currentWeek >= def.startWeek;
    const range = def.matureWeek - def.startWeek;
    const percentage = Math.min(100, Math.max(0, Math.round(((currentWeek - def.startWeek) / range) * 100)));
    const incrementPerWeek = range > 0 ? Math.round((1 / range) * 100) : 0;
    const startInWeeks = !isActive ? def.startWeek - currentWeek : undefined;
    return {
      id: def.id,
      name: def.name,
      iconKey: def.iconKey,
      percentage: isActive ? percentage : 0,
      increment: isActive && percentage < 100 ? incrementPerWeek : 0,
      isActive,
      startInWeeks,
    };
  });
}

/**
 * Compute circleIcons for a given week number (1-based) for use in HomeScreen WEEKS_DATA.
 * Returns only active systems with their computed percentages.
 */
export function computeCircleIconsForWeek(weekNumber: number): Array<{ index: number; iconPath: string; percentage: number }> {
  const systems = computeBabySystems(weekNumber);
  const activeIcons: Array<{ index: number; iconPath: string; percentage: number }> = [];
  let idx = 0;
  for (const sys of systems) {
    if (sys.isActive && sys.percentage > 0) {
      activeIcons.push({
        index: idx,
        iconPath: sys.iconKey,
        percentage: sys.percentage,
      });
      idx++;
    }
  }
  return activeIcons;
}
