
export interface AlbionItem {
  id: string;
  name: string;
  tier: number;
}

const WEAPON_TEMPLATES = [
  // Swords
  { name: 'Broadsword', baseId: 'MAIN_SWORD' },
  { name: 'Claymore', baseId: '2H_CLAYMORE' },
  { name: 'Dual Swords', baseId: '2H_DUALSWORD' },
  { name: 'Carving Sword', baseId: '2H_CLEAVER_HELL' },
  { name: 'Clarent Blade', baseId: 'MAIN_SCIMITAR_MORGANA' },
  { name: 'Galatine Pair', baseId: '2H_DUALSCIMITAR_UNDEAD' },
  { name: 'Kingmaker', baseId: '2H_CLAYMORE_AVALON' },
  
  // Axes
  { name: 'Battleaxe', baseId: 'MAIN_AXE' },
  { name: 'Halberd', baseId: '2H_HALBERD' },
  { name: 'Greataxe', baseId: '2H_AXE' },
  { name: 'Carrioncaller', baseId: '2H_HALBERD_MORGANA' },
  { name: 'Infernal Scythe', baseId: '2H_SCYTHE_HELL' },
  { name: 'Bear Paws', baseId: '2H_AXE_HELL' },
  { name: 'Realmbreaker', baseId: '2H_AXE_AVALON' },

  // Daggers
  { name: 'Dagger', baseId: 'MAIN_DAGGER' },
  { name: 'Bloodletter', baseId: 'MAIN_DAGGER_HELL' },
  { name: 'Dagger Pair', baseId: '2H_DAGGERPAIR' },
  { name: 'Claws', baseId: '2H_CLAW' },
  { name: 'Deathgivers', baseId: '2H_DUALDAGGER_HELL' },
  { name: 'Bridled Fury', baseId: '2H_DAGGER_AVALON' },

  // Bows
  { name: 'Bow', baseId: '2H_BOW' },
  { name: 'Warbow', baseId: '2H_WARBOW' },
  { name: 'Longbow', baseId: '2H_LONGBOW' },
  { name: 'Whispering Bow', baseId: '2H_LONGBOW_UNDEAD' },
  { name: 'Wailing Bow', baseId: '2H_BOW_HELL' },
  { name: 'Bow of Badon', baseId: '2H_BOW_KEEPER' },
  { name: 'Mistpiercer', baseId: '2H_BOW_AVALON' },

  // Crossbows
  { name: 'Crossbow', baseId: 'MAIN_CROSSBOW' },
  { name: 'Heavy Crossbow', baseId: '2H_CROSSBOW' },
  { name: 'Light Crossbow', baseId: 'MAIN_LIGHTCROSSBOW' },
  { name: 'Weeping Repeater', baseId: '2H_REPEATINGCROSSBOW_UNDEAD' },
  { name: 'Boltcasters', baseId: '2H_DUALCROSSBOW_HELL' },
  { name: 'Siegebow', baseId: '2H_CROSSBOWLARGE_MORGANA' },
  { name: 'Energy Shaper', baseId: '2H_CROSSBOW_AVALON' },

  // Staffs
  { name: 'Fire Staff', baseId: 'MAIN_FIRESTAFF' },
  { name: 'Frost Staff', baseId: 'MAIN_FROSTSTAFF' },
  { name: 'Cursed Staff', baseId: 'MAIN_CURSESTAFF' },
  { name: 'Holy Staff', baseId: 'MAIN_HOLYSTAFF' },
  { name: 'Nature Staff', baseId: 'MAIN_NATURESTAFF' },
  { name: 'Brimstone Staff', baseId: '2H_FIRESTAFF_HELL' },
  { name: 'Permafrost Prism', baseId: '2H_ICESTAFF_KEEPER' },
];

const ARMOR_TEMPLATES = [
  // Cloth
  { name: 'Scholar Cowl', baseId: 'HEAD_CLOTH_SET1' },
  { name: 'Scholar Robe', baseId: 'ARMOR_CLOTH_SET1' },
  { name: 'Scholar Sandals', baseId: 'SHOES_CLOTH_SET1' },
  { name: 'Mage Cowl', baseId: 'HEAD_CLOTH_SET2' },
  { name: 'Mage Robe', baseId: 'ARMOR_CLOTH_SET2' },
  { name: 'Mage Sandals', baseId: 'SHOES_CLOTH_SET2' },
  { name: 'Cleric Cowl', baseId: 'HEAD_CLOTH_SET3' },
  { name: 'Cleric Robe', baseId: 'ARMOR_CLOTH_SET3' },
  { name: 'Cleric Sandals', baseId: 'SHOES_CLOTH_SET3' },
  // Leather
  { name: 'Mercenary Hood', baseId: 'HEAD_LEATHER_SET1' },
  { name: 'Mercenary Jacket', baseId: 'ARMOR_LEATHER_SET1' },
  { name: 'Mercenary Shoes', baseId: 'SHOES_LEATHER_SET1' },
  { name: 'Hunter Hood', baseId: 'HEAD_LEATHER_SET2' },
  { name: 'Hunter Jacket', baseId: 'ARMOR_LEATHER_SET2' },
  { name: 'Hunter Shoes', baseId: 'SHOES_LEATHER_SET2' },
  { name: 'Assassin Hood', baseId: 'HEAD_LEATHER_SET3' },
  { name: 'Assassin Jacket', baseId: 'ARMOR_LEATHER_SET3' },
  { name: 'Assassin Shoes', baseId: 'SHOES_LEATHER_SET3' },
  // Plate
  { name: 'Soldier Helmet', baseId: 'HEAD_PLATE_SET1' },
  { name: 'Soldier Armor', baseId: 'ARMOR_PLATE_SET1' },
  { name: 'Soldier Boots', baseId: 'SHOES_PLATE_SET1' },
  { name: 'Knight Helmet', baseId: 'HEAD_PLATE_SET2' },
  { name: 'Knight Armor', baseId: 'ARMOR_PLATE_SET2' },
  { name: 'Knight Boots', baseId: 'SHOES_PLATE_SET2' },
  { name: 'Guardian Helmet', baseId: 'HEAD_PLATE_SET3' },
  { name: 'Guardian Armor', baseId: 'ARMOR_PLATE_SET3' },
  { name: 'Guardian Boots', baseId: 'SHOES_PLATE_SET3' },
];

const MATERIAL_TEMPLATES = [
  { name: 'Cloth', baseId: 'CLOTH' },
  { name: 'Metal Bar', baseId: 'METALBAR' },
  { name: 'Planks', baseId: 'WOOD' },
  { name: 'Leather', baseId: 'LEATHER' },
  { name: 'Stone Block', baseId: 'STONEBLOCK' },
];

const OFFHAND_TEMPLATES = [
  { name: 'Shield', baseId: 'OFF_SHIELD' },
  { name: 'Tome of Spells', baseId: 'OFF_BOOK' },
  { name: 'Torch', baseId: 'OFF_TORCH' },
  { name: 'Caitiff Shield', baseId: 'OFF_SHIELD_HELL' },
  { name: 'Eye of Secrets', baseId: 'OFF_BOOK_HELL' },
  { name: 'Muasak', baseId: 'OFF_DEMONSKULL_HELL' },
];

const generateItems = () => {
  const items: AlbionItem[] = [];
  const tiers = [4, 5, 6, 7, 8];
  const enchants = [0, 1, 2, 3, 4];

  // Helper to generate with enchants
  const addEnchanted = (baseId: string, name: string) => {
    tiers.forEach(t => {
      enchants.forEach(e => {
        const id = e === 0 ? `T${t}_${baseId}` : `T${t}_${baseId}@${e}`;
        const displayName = e === 0 ? name : `${name} (.${e})`;
        items.push({ id, name: displayName, tier: t });
      });
    });
  };

  // Weapons
  WEAPON_TEMPLATES.forEach(w => addEnchanted(w.baseId, w.name));

  // Armors
  ARMOR_TEMPLATES.forEach(a => addEnchanted(a.baseId, a.name));

  // Materials (usually no enchants in this specific format, but we keep base tiers)
  MATERIAL_TEMPLATES.forEach(m => {
    tiers.forEach(t => {
      items.push({ id: `T${t}_${m.baseId}`, name: m.name, tier: t });
    });
  });

  // Offhands
  OFFHAND_TEMPLATES.forEach(o => addEnchanted(o.baseId, o.name));

  // MISC / Popular
  const misc = [
    { id: 'T8_BAG', name: 'Bag', tier: 8 },
    { id: 'T7_BAG', name: 'Bag', tier: 7 },
    { id: 'T6_BAG', name: 'Bag', tier: 6 },
    { id: 'T5_BAG', name: 'Bag', tier: 5 },
    { id: 'T4_BAG', name: 'Bag', tier: 4 },
    { id: 'T8_CAPE', name: 'Cape', tier: 8 },
    { id: 'T4_CAPE', name: 'Cape', tier: 4 },
    { id: 'T1_CARROT', name: 'Carrot', tier: 1 },
    { id: 'T4_TOME_TRAINING_MANUAL', name: 'Tome of Insight', tier: 4 },
    { id: 'T5_MOUNT_SWIFTCLAW', name: 'Swiftclaw', tier: 5 },
    { id: 'T8_MOUNT_DIREWOLF', name: 'Direwolf', tier: 8 },
    { id: 'T4_MOUNT_HORSE', name: 'Riding Horse', tier: 4 },
    { id: 'T8_MOUNT_HORSE', name: 'Riding Horse', tier: 8 },
  ];

  return [...items, ...misc];
};

export const POPULAR_ITEMS: AlbionItem[] = generateItems();
