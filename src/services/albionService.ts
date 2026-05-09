
export interface AlbionEquipmentItem {
  Type: string;
  Count: number;
  Quality: number;
}

export interface AlbionEquipment {
  MainHand: AlbionEquipmentItem | null;
  OffHand: AlbionEquipmentItem | null;
  Head: AlbionEquipmentItem | null;
  Armor: AlbionEquipmentItem | null;
  Shoes: AlbionEquipmentItem | null;
  Cape: AlbionEquipmentItem | null;
  Mount: AlbionEquipmentItem | null;
  Potion: AlbionEquipmentItem | null;
  Food: AlbionEquipmentItem | null;
}

export interface AlbionKill {
  EventId: number;
  TimeStamp: string;
  TotalVictimFame: number;
  Killer: {
    Name: string;
    GuildName: string;
    AllianceName: string;
    AverageItemPower: number;
    ItemPower?: number;
    KillFame?: number;
    Equipment: AlbionEquipment;
  };
  Victim: {
    Name: string;
    GuildName: string;
    AllianceName: string;
    AverageItemPower: number;
    ItemPower?: number;
    DeathFame?: number;
    Fame?: number;
    Inventory: (any | null)[];
    Equipment: AlbionEquipment;
  };
}

export async function fetchLatestKills(
  server: 'West' | 'East' | 'Europe' = 'West',
  limit: number = 100,
  offset: number = 0
): Promise<AlbionKill[]> {
  try {
    const response = await fetch(`/api/kills?server=${server}&limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching kills:', error);
    return [];
  }
}

