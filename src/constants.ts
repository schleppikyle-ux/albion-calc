export const FAME_DATA = {
  WEAPON: {
    base_1_100: 33975414,
    elite_100_120_cfc: 50034690,
    silver_per_cfc: 1,
  },
  CHEST: {
    base_1_100: 16987707,
    elite_100_120_cfc: 25017345,
    silver_per_cfc: 1,
  },
  HEAD_SHOES: {
    base_1_100: 8493854,
    elite_100_120_cfc: 12508673,
    silver_per_cfc: 1,
  },
  OFFHAND: {
    base_1_100: 1698771,
    elite_100_120_cfc: 2501735,
    silver_per_cfc: 1,
  }
};

// Simplified cumulative fame function for levels 1-100
export function getCumulativeFame100(level: number, type: 'WEAPON' | 'CHEST' | 'HEAD_SHOES' | 'OFFHAND'): number {
  if (level <= 1) return 0;
  if (level >= 100) return FAME_DATA[type].base_1_100;
  const ratio = Math.pow(level / 100, 4.2);
  return Math.floor(FAME_DATA[type].base_1_100 * ratio);
}

// 100-120 is also a curve but steeper
export function getCumulativeFame120(level: number, type: 'WEAPON' | 'CHEST' | 'HEAD_SHOES' | 'OFFHAND'): number {
  if (level <= 100) return 0;
  if (level >= 120) return FAME_DATA[type].elite_100_120_cfc;
  const eliteLevel = level - 100;
  const ratio = Math.pow(eliteLevel / 20, 3.5);
  return Math.floor(FAME_DATA[type].elite_100_120_cfc * ratio);
}

export const ITEM_POWER = {
  TIER_BASE: {
    4: 700,
    5: 800,
    6: 900,
    7: 1000,
    8: 1100
  },
  ENCHANT_BONUS: 100,
  QUALITY_BONUS: {
    'Normal': 0,
    'Good': 10,
    'Outstanding': 20,
    'Excellent': 50,
    'Masterpiece': 100
  },
  TYPE_BONUS: {
    'STANDARD': 0,
    'ARTIFACT': 25,
    'AVALONIAN': 100,
    'CRYSTAL': 100
  }
};

export type SpecNodeType = 'STANDARD' | 'ARTIFACT' | 'AVALONIAN' | 'CRYSTAL';

export interface ItemSpecNode {
  level: number;
  type: SpecNodeType;
  isEquipped: boolean;
}

export interface IPBreakdown {
  base: number;
  enchant: number;
  quality: number;
  typeBonus: number;
  mastery: number;
  specSelf: number;
  specCross: number;
  masteryModifier: number;
  total: number;
}

export function calculateTotalIP(
  tier: number, 
  enchant: number, 
  quality: string,
  masteryLevel: number,
  treeNodes: ItemSpecNode[]
): IPBreakdown {
  const base = ITEM_POWER.TIER_BASE[tier as keyof typeof ITEM_POWER.TIER_BASE] || 700;
  const enchantBonus = enchant * ITEM_POWER.ENCHANT_BONUS;
  const qualityBonus = ITEM_POWER.QUALITY_BONUS[quality as keyof typeof ITEM_POWER.QUALITY_BONUS] || 0;
  
  // Find equipped item type for base bonus
  const equippedNode = treeNodes.find(n => n.isEquipped);
  const typeBonus = equippedNode ? (ITEM_POWER.TYPE_BONUS[equippedNode.type as keyof typeof ITEM_POWER.TYPE_BONUS] || 0) : 0;

  // Mastery Modifier (applied to mastery/spec bonuses)
  // T5: 5%, T6: 10%, T7: 15%, T8: 20%
  const masteryModifier = tier >= 5 ? (tier - 4) * 0.05 : 0;
  
  // Node Mastery (1-100) -> 0.2 IP/lvl
  let masteryBonus = masteryLevel * 0.2;
  
  let specSelf = 0;
  let specCross = 0;

  const getCrossSpecBonus = (type: SpecNodeType) => {
    switch (type) {
      case 'STANDARD': return 0.2;
      case 'ARTIFACT':
      case 'AVALONIAN':
      case 'CRYSTAL': return 0.1;
      default: return 0.1;
    }
  };

  treeNodes.forEach(node => {
    if (node.isEquipped) {
      // Equipped item: +2.0 IP per level
      specSelf += node.level * 2;
    } else {
      // Cross-spec
      specCross += node.level * getCrossSpecBonus(node.type);
    }
  });

  // Apply Mastery Modifier
  const masteryBonusFinal = masteryBonus * (1 + masteryModifier);
  const specSelfFinal = specSelf * (1 + masteryModifier);
  const specCrossFinal = specCross * (1 + masteryModifier);
  
  const total = Math.floor(base + enchantBonus + qualityBonus + typeBonus + masteryBonusFinal + specSelfFinal + specCrossFinal);

  return {
    base,
    enchant: enchantBonus,
    quality: qualityBonus,
    typeBonus,
    mastery: masteryBonusFinal,
    specSelf: specSelfFinal,
    specCross: specCrossFinal,
    masteryModifier,
    total
  };
}
