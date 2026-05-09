
export interface MarketPrice {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

const BASE_URLS = {
  West: 'https://west.albion-online-data.com',
  East: 'https://east.albion-online-data.com',
  Europe: 'https://europe.albion-online-data.com',
};

export async function fetchPrices(
  itemIds: string[], 
  server: keyof typeof BASE_URLS = 'West',
  locations: string[] = ['Caerleon', 'Bridgewatch', 'Martlock', 'Thetford', 'FortSterling', 'Lymhurst']
): Promise<MarketPrice[]> {
  const BATCH_SIZE = 100; // Increased for faster fetching of large item lists
  const allResults: MarketPrice[] = [];
  
  for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
    const batch = itemIds.slice(i, i + BATCH_SIZE);
    const url = `${BASE_URLS[server]}/api/v2/stats/prices/${batch.join(',')}?locations=${locations.join(',')}`;
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      allResults.push(...data);
    } catch (error) {
      console.error('Error fetching Albion market batch:', error);
    }
  }
  
  return allResults;
}
