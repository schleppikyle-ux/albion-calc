import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sword, 
  Shield, 
  ChevronRight, 
  Coins, 
  Zap, 
  TrendingUp, 
  Info,
  X,
  Layers,
  ArrowRightLeft,
  Globe,
  RefreshCw,
  Search,
  ShoppingCart,
  LayoutDashboard,
  Skull
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FAME_DATA, getCumulativeFame100, getCumulativeFame120, calculateTotalIP, ITEM_POWER, ItemSpecNode, SpecNodeType } from './constants';
import { fetchPrices, MarketPrice } from './services/marketService';
import { fetchLatestKills, AlbionKill, AlbionEquipmentItem } from './services/albionService';
import { POPULAR_ITEMS, AlbionItem } from './data/items';
import type { LevelType } from './types';

type ViewMode = 'CALCULATOR' | 'MARKET' | 'FLIPPER' | 'KILLBOARD';

const ItemIcon: React.FC<{ item: AlbionEquipmentItem, eventId: number, slot: string }> = ({ item, eventId, slot }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="w-8 h-8 rounded bg-black/40 border border-white/5 p-0.5 flex-none group/item relative overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
          <div className="w-1/2 h-1/2 rounded-full border border-white/10" />
        </div>
      )}
      <img 
        src={`https://render.albiononline.com/v1/item/${item.Type}.png?size=32&quality=${item.Quality || 1}`} 
        alt={item.Type}
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => (e.currentTarget.style.display = 'none')}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('CALCULATOR');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [targetLevel, setTargetLevel] = useState<number>(100);
  const [itemType, setItemType] = useState<'WEAPON' | 'CHEST' | 'HEAD_SHOES' | 'OFFHAND'>('WEAPON');
  const [server, setServer] = useState<'West' | 'East' | 'Europe'>('West');
  const [selectedCity, setSelectedCity] = useState<string>('Global');
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleFlipsCount, setVisibleFlipsCount] = useState(20);
  const [marketSortField, setMarketSortField] = useState<'name' | 'tier' | 'enchantment' | 'price'>('name');
  const [marketSortOrder, setMarketSortOrder] = useState<'asc' | 'desc'>('asc');

  const [kills, setKills] = useState<AlbionKill[]>([]);
  const [isLoadingKills, setIsLoadingKills] = useState(false);
  const [visibleKillsCount, setVisibleKillsCount] = useState(5);

  // Flipper Sort State
  const [flipperSortField, setFlipperSortField] = useState<'roi' | 'buyPrice' | 'profit' | 'tier' | 'enchantment'>('roi');
  const [flipperSortOrder, setFlipperSortOrder] = useState<'asc' | 'desc'>('desc');

  // IP Preview State
  const [selectedTier, setSelectedTier] = useState(4);
  const [selectedEnchant, setSelectedEnchant] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState('Normal');
  const [masteryLevel, setMasteryLevel] = useState(100);
  const [treeNodes, setTreeNodes] = useState<ItemSpecNode[]>([
    { level: 100, type: 'STANDARD', isEquipped: true }, 
    { level: 100, type: 'STANDARD', isEquipped: false },
    { level: 100, type: 'STANDARD', isEquipped: false },
    { level: 100, type: 'ARTIFACT', isEquipped: false },
    { level: 100, type: 'ARTIFACT', isEquipped: false },
    { level: 100, type: 'ARTIFACT', isEquipped: false },
    { level: 100, type: 'AVALONIAN', isEquipped: false },
    { level: 100, type: 'CRYSTAL', isEquipped: false },
  ]);
  const [showIPBreakdown, setShowIPBreakdown] = useState(false);

  const CITIES = ['Global', 'Caerleon', 'Bridgewatch', 'Martlock', 'Thetford', 'FortSterling', 'Lymhurst', 'Brecilien', 'Black Market'];

  const loadMarketData = async () => {
    setIsLoadingMarket(true);
    // Fetching all items initially (batched by service)
    const itemsToFetch = ['T4_TOME_TRAINING_MANUAL', ...POPULAR_ITEMS.map(i => i.id)]; 
    const uniqueItems = Array.from(new Set(itemsToFetch));
    
    const locations = ['Caerleon', 'Bridgewatch', 'Martlock', 'Thetford', 'FortSterling', 'Lymhurst', 'Brecilien', 'Black Market'];

    const prices = await fetchPrices(uniqueItems, server, locations);
    setMarketPrices(prices);
    setIsLoadingMarket(false);
  };

  const loadKills = async (isLoadMore = false) => {
    setIsLoadingKills(true);
    try {
      const offset = isLoadMore ? kills.length : 0;
      const latestKills = await fetchLatestKills(server, 50, offset);
      
      if (isLoadMore) {
        setKills(prev => [...prev, ...latestKills]);
        setVisibleKillsCount(prev => prev + 10);
      } else {
        setKills(latestKills);
        setVisibleKillsCount(10);
      }
    } catch (error) {
      console.error('Failed to load kills:', error);
    } finally {
      setIsLoadingKills(false);
    }
  };

  // Fetch prices for calculator (Tome of Insight) and initially for market
  useEffect(() => {
    loadMarketData();
    if (viewMode === 'KILLBOARD') loadKills();
  }, [server, viewMode]);

  const tomePrice = useMemo(() => {
    const tomePrices = marketPrices.filter(p => p.item_id === 'T4_TOME_TRAINING_MANUAL' && p.sell_price_min > 0);
    if (!tomePrices.length) return 20000;
    return Math.min(...tomePrices.map(p => p.sell_price_min));
  }, [marketPrices]);

  const getItemMarketData = (itemId: string) => {
    let itemPrices = marketPrices.filter(p => p.item_id === itemId && p.sell_price_min > 0);
    
    if (selectedCity !== 'Global') {
      itemPrices = itemPrices.filter(p => p.city === selectedCity);
    }

    if (!itemPrices.length) return null;
    
    const minSell = Math.min(...itemPrices.map(p => p.sell_price_min));
    const maxBuy = Math.max(...itemPrices.map(p => p.buy_price_max));
    const avg = Math.floor((minSell + maxBuy) / 2);
    
    return { minSell, maxBuy, avg, city: itemPrices[0].city };
  };

  const filteredItems = useMemo(() => {
    let items = POPULAR_ITEMS.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return items.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (marketSortField === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (marketSortField === 'tier') {
        valA = a.tier;
        valB = b.tier;
      } else if (marketSortField === 'enchantment') {
        valA = a.id.includes('@') ? parseInt(a.id.split('@')[1]) : 0;
        valB = b.id.includes('@') ? parseInt(b.id.split('@')[1]) : 0;
      } else if (marketSortField === 'price') {
        const dataA = getItemMarketData(a.id);
        const dataB = getItemMarketData(b.id);
        valA = dataA?.minSell || 0;
        valB = dataB?.minSell || 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return marketSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return marketSortOrder === 'asc' ? ((valA as number) - (valB as number)) : ((valB as number) - (valA as number));
    }).slice(0, 100);
  }, [searchQuery, marketSortField, marketSortOrder, marketPrices, selectedCity]); // Added selectedCity to dep array since price depends on it

  const calculation = useMemo(() => {
    const start = Math.max(1, Math.min(120, currentLevel));
    const end = Math.max(start, Math.min(120, targetLevel));

    let fameNeeded = 0;
    let cfcNeeded = 0;
    let silverNeeded = 0;

    if (start < 100) {
      const lower = getCumulativeFame100(start, itemType);
      const upper = getCumulativeFame100(Math.min(end, 100), itemType);
      fameNeeded = upper - lower;
    }

    if (end > 100) {
      const eliteStart = Math.max(100, start);
      const eliteEnd = end;
      
      const lowerElite = getCumulativeFame120(eliteStart, itemType);
      const upperElite = getCumulativeFame120(eliteEnd, itemType);
      
      cfcNeeded = upperElite - lowerElite;
      silverNeeded = cfcNeeded * FAME_DATA[itemType].silver_per_cfc;
    }

    const predictedTreeNodes = treeNodes.map(node => {
        if (node.isEquipped) return { ...node, level: targetLevel };
        return node;
    });

    const currentTreeNodes = treeNodes.map(node => {
        if (node.isEquipped) return { ...node, level: currentLevel };
        return node;
    });

    const predictedBreakdown = calculateTotalIP(
      selectedTier,
      selectedEnchant,
      selectedQuality,
      masteryLevel,
      predictedTreeNodes
    );

    const currentBreakdown = calculateTotalIP(
      selectedTier,
      selectedEnchant,
      selectedQuality,
      masteryLevel,
      currentTreeNodes
    );

    return {
      fameNeeded,
      cfcNeeded,
      silverNeeded,
      tomeCost: Math.ceil(fameNeeded / 10000) * tomePrice,
      predictedIP: predictedBreakdown.total,
      currentIP: currentBreakdown.total,
      ipGain: predictedBreakdown.total - currentBreakdown.total,
      breakdown: predictedBreakdown
    };
  }, [currentLevel, targetLevel, itemType, tomePrice, selectedTier, selectedEnchant, selectedQuality, masteryLevel, treeNodes]);

  const getQualityName = (q: number) => {
    return ["", "Normal", "Good", "Outstanding", "Excellent", "Masterpiece"][q] || "Normal";
  };

  const getQualityColor = (q: number) => {
    const colors = ["", "text-gray-400", "text-emerald-400", "text-blue-400", "text-purple-400", "text-amber-400"];
    return colors[q] || "text-gray-400";
  };

  const flipperData = useMemo(() => {
    const flips: any[] = [];
    const royalCities = ['Bridgewatch', 'Martlock', 'Thetford', 'FortSterling', 'Lymhurst', 'Caerleon', 'Brecilien'];
    
    POPULAR_ITEMS.forEach(item => {
      const itemPrices = marketPrices.filter(p => p.item_id === item.id);
      if (itemPrices.length < 2) return;

      // Group by quality since BM buys specific qualities
      const qualities = [1, 2, 3, 4, 5];

      qualities.forEach(q => {
        const bmPriceData = itemPrices.find(p => p.city === 'Black Market' && p.quality === q);
        if (!bmPriceData || bmPriceData.buy_price_max === 0) return;

        // In BM, we usually sell to the Buy Order (buy_price_max)
        const sellPrice = bmPriceData.buy_price_max;

        royalCities.forEach(buyCity => {
          const buyPriceData = itemPrices.find(p => p.city === buyCity && p.quality === q);
          const buyPrice = buyPriceData?.sell_price_min;
          if (!buyPrice || buyPrice === 0) return;

          // No tax when selling to a Buy Order on BM
          const profit = sellPrice - buyPrice;
          const roi = (profit / buyPrice) * 100;

          if (roi > 0) { 
            // Extract enchantment from ID (e.g. T4_ITEM@1 -> 1)
            const enchantment = item.id.includes('@') ? parseInt(item.id.split('@')[1]) : 0;
            
            flips.push({
              item,
              buyCity,
              buyPrice,
              sellCity: 'Black Market',
              sellPrice,
              profit,
              roi,
              quality: q,
              tier: item.tier,
              enchantment,
              isBlackMarket: true
            });
          }
        });
      });
    });

    return flips.sort((a, b) => {
      const fieldA = a[flipperSortField as keyof typeof a];
      const fieldB = b[flipperSortField as keyof typeof b];
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return flipperSortOrder === 'desc' ? fieldB - fieldA : fieldA - fieldB;
      }
      return 0;
    }).slice(0, 500);
  }, [marketPrices, flipperSortField, flipperSortOrder]);

  const formatNumber = (val: any) => {
    const num = Number(val);
    if (val === undefined || val === null || isNaN(num)) return '0';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return (
    <div className="h-screen w-full bg-[#0a0b0d] text-[#e1e1e1] font-sans flex flex-col overflow-hidden">
      {/* Header Navigation */}
      <header className="h-14 border-b border-white/10 bg-[#121417] flex items-center justify-between px-6 flex-none">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-black text-xs shadow-lg shadow-amber-500/20">A</div>
          <h1 className="text-lg font-bold tracking-tight text-white uppercase italic">Albion <span className="text-amber-500 font-black">Mastery HUD</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-4 text-[10px] font-bold uppercase tracking-widest">
            <button 
              onClick={() => setViewMode('CALCULATOR')}
              className={`pb-0.5 transition-all outline-none ${viewMode === 'CALCULATOR' ? 'text-amber-500 border-b border-amber-500' : 'text-gray-500 hover:text-white'}`}
            >
              Calculators
            </button>
            <button 
              onClick={() => setViewMode('MARKET')}
              className={`pb-0.5 transition-all outline-none ${viewMode === 'MARKET' ? 'text-amber-500 border-b border-amber-500' : 'text-gray-500 hover:text-white'}`}
            >
              Market HUD
            </button>
            <button 
              onClick={() => setViewMode('FLIPPER')}
              className={`pb-0.5 transition-all outline-none ${viewMode === 'FLIPPER' ? 'text-amber-500 border-b border-amber-500' : 'text-gray-500 hover:text-white'}`}
            >
              BM Flipper
            </button>
            <button 
              onClick={() => setViewMode('KILLBOARD')}
              className={`pb-0.5 transition-all outline-none ${viewMode === 'KILLBOARD' ? 'text-amber-500 border-b border-amber-500' : 'text-gray-500 hover:text-white'}`}
            >
              Killboard
            </button>
          </nav>
          <div className="flex items-center gap-3 border-l border-white/10 pl-6 h-6">
            <Globe className="w-3 h-3 text-gray-500" />
            <select 
              value={server}
              onChange={(e) => setServer(e.target.value as any)}
              className="bg-[#1c1f24] border border-white/10 text-[10px] rounded px-2 py-0.5 text-amber-500 font-mono outline-none cursor-pointer hover:border-amber-500/30 transition-colors"
            >
              <option value="West" className="bg-[#1c1f24] text-white">Americas (West)</option>
              <option value="East" className="bg-[#1c1f24] text-white">Asia (East)</option>
              <option value="Europe" className="bg-[#1c1f24] text-white">Europe</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-[#0e1013] flex flex-col flex-none">
          <div className="p-4 space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-3 block border-b border-white/5 pb-1">Navigation</span>
              <div className="space-y-1">
                <button
                  onClick={() => setViewMode('CALCULATOR')}
                  className={`w-full p-2 text-xs flex items-center gap-3 transition-all rounded ${
                    viewMode === 'CALCULATOR' 
                      ? 'bg-white/5 border-l-2 border-amber-500 text-white font-bold' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="uppercase tracking-tight">Mastery Tool</span>
                </button>
                <button
                  onClick={() => setViewMode('MARKET')}
                  className={`w-full p-2 text-xs flex items-center gap-3 transition-all rounded ${
                    viewMode === 'MARKET' 
                      ? 'bg-white/5 border-l-2 border-amber-500 text-white font-bold' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="uppercase tracking-tight">Market Indices</span>
                </button>
                <button
                  onClick={() => setViewMode('FLIPPER')}
                  className={`w-full p-2 text-xs flex items-center gap-3 transition-all rounded ${
                    viewMode === 'FLIPPER' 
                      ? 'bg-white/5 border-l-2 border-amber-500 text-white font-bold' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="uppercase tracking-tight">Black Market Scout</span>
                </button>
                <button
                  onClick={() => setViewMode('KILLBOARD')}
                  className={`w-full p-2 text-xs flex items-center gap-3 transition-all rounded ${
                    viewMode === 'KILLBOARD' 
                      ? 'bg-white/5 border-l-2 border-amber-500 text-white font-bold' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Skull className="w-4 h-4" />
                  <span className="uppercase tracking-tight">Killboard HUD</span>
                </button>
              </div>
            </div>

            {viewMode === 'CALCULATOR' && (
              <>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-3 block border-b border-white/5 pb-1">Calculation Class</span>
                  <div className="space-y-1">
                    {(['WEAPON', 'CHEST', 'HEAD_SHOES', 'OFFHAND'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setItemType(type)}
                        className={`w-full p-2 text-xs flex items-center gap-3 transition-all rounded ${
                          itemType === type 
                            ? 'bg-white/5 border-l-2 border-amber-500 text-white font-bold' 
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {type === 'WEAPON' && <Sword className="w-4 h-4" />}
                        {type === 'CHEST' && <Shield className="w-4 h-4" />}
                        {type === 'HEAD_SHOES' && <Layers className="w-4 h-4" />}
                        {type === 'OFFHAND' && <TrendingUp className="w-4 h-4" />}
                        <span className="uppercase tracking-tight">{type.replace('_', ' ')}</span>
                        <ChevronRight className={`ml-auto w-3 h-3 transition-transform ${itemType === type ? 'translate-x-0' : '-translate-x-2 opacity-0'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block">Weapon Tree (8 items)</span>
                    <div className="flex gap-2">
                        <button 
                          onClick={() => setTreeNodes(treeNodes.map(n => ({ ...n, level: 100 })))}
                          className="text-[8px] font-bold text-gray-500 hover:text-white uppercase transition-colors"
                        >
                          All 100
                        </button>
                        <button 
                          onClick={() => setTreeNodes(treeNodes.map(n => ({ ...n, level: 0 })))}
                          className="text-[8px] font-bold text-gray-500 hover:text-white uppercase transition-colors"
                        >
                          Clear
                        </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {treeNodes.map((node, idx) => (
                      <div 
                        key={idx}
                        className={`p-1.5 rounded-lg border transition-all ${node.isEquipped ? 'bg-amber-500/10 border-amber-500/30' : 'bg-black/20 border-white/5'}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div 
                            onClick={() => {
                                const types: SpecNodeType[] = ['STANDARD', 'ARTIFACT', 'AVALONIAN', 'CRYSTAL'];
                                const currentIdx = types.indexOf(node.type);
                                const nextType = types[(currentIdx + 1) % types.length];
                                const newNodes = [...treeNodes];
                                newNodes[idx].type = nextType;
                                setTreeNodes(newNodes);
                            }}
                            className={`text-[7px] font-black tracking-tighter cursor-pointer px-1 rounded bg-black/40 hover:text-white transition-colors
                              ${node.type === 'STANDARD' ? 'text-gray-400' : ''}
                              ${node.type === 'ARTIFACT' ? 'text-purple-400' : ''}
                              ${node.type === 'AVALONIAN' ? 'text-cyan-400' : ''}
                              ${node.type === 'CRYSTAL' ? 'text-pink-400' : ''}
                            `}
                          >
                            {node.type.substring(0, 3)}
                          </div>
                          <button 
                            onClick={() => {
                              const newNodes = treeNodes.map((n, i) => ({ ...n, isEquipped: i === idx }));
                              setTreeNodes(newNodes);
                            }}
                            className={`w-2 h-2 rounded-full border ${node.isEquipped ? 'bg-amber-500 border-amber-500' : 'border-white/20'}`}
                          />
                        </div>
                        <input 
                          type="number"
                          value={node.isEquipped ? targetLevel : node.level}
                          onChange={(e) => {
                            const val = Math.min(120, Math.max(0, parseInt(e.target.value) || 0));
                            if (node.isEquipped) {
                              setTargetLevel(val);
                            } else {
                              const newNodes = [...treeNodes];
                              newNodes[idx].level = val;
                              setTreeNodes(newNodes);
                            }
                          }}
                          className="w-full bg-transparent text-center font-mono text-xs font-bold text-white outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 px-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-600 flex justify-between uppercase">Mastery Node <span>{masteryLevel}</span></label>
                      <input 
                        type="range" min="1" max="100" value={masteryLevel}
                        onChange={(e) => setMasteryLevel(parseInt(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-3 block border-b border-white/5 pb-1">Quick Select</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setCurrentLevel(1); setTargetLevel(100); }} className="p-2 bg-[#1c1f24] border border-white/10 rounded text-[10px] font-bold text-gray-400 hover:border-amber-500/50 hover:text-white transition-all uppercase">1 - 100</button>
                <button onClick={() => { setCurrentLevel(100); setTargetLevel(120); }} className="p-2 bg-[#1c1f24] border border-white/10 rounded text-[10px] font-bold text-gray-400 hover:border-amber-500/50 hover:text-white transition-all uppercase">100 - 120</button>
                <button onClick={() => { setCurrentLevel(1); setTargetLevel(120); }} className="col-span-2 p-2 bg-[#1c1f24] border border-white/10 rounded text-[10px] font-bold text-gray-400 hover:border-amber-500/50 hover:text-white transition-all uppercase">Fresh Start 1 - 120</button>
              </div>
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-white/10 bg-black/20">
            <div className="text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-tight">Session Calculations</div>
            <div className="text-xl font-mono font-bold text-amber-500 flex items-center gap-2 tracking-tighter">
              <Zap className="w-4 h-4" /> Validated
            </div>
          </div>
        </aside>

        {/* Main Dashboard */}
        <main className="flex-1 grid grid-cols-12 grid-rows-2 gap-4 p-4 overflow-hidden overflow-y-auto">
          
          <AnimatePresence mode="wait">
            {viewMode === 'CALCULATOR' ? (
              <motion.div 
                key="calculator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="col-span-12 grid grid-cols-12 gap-4"
              >
                {/* Base Mastery Block */}
                <section className="col-span-12 lg:col-span-8 bg-[#121417] border border-white/10 rounded-lg flex flex-col p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-black tracking-widest italic decoration-amber-500 decoration-2">BASE PROGRESSION</h2>
                      <div className="px-2 py-0.5 bg-zinc-800 text-[10px] text-gray-400 rounded border border-white/5 font-mono">1.0 FAME INDEX</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-gray-500 uppercase font-black leading-none">Starting Level</span>
                        <span className="text-lg font-mono font-bold text-white">{currentLevel}</span>
                      </div>
                      <ArrowRightLeft className="w-4 h-4 text-gray-700" />
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-amber-500 uppercase font-black leading-none">Target Level</span>
                        <span className="text-lg font-mono font-bold text-amber-500">{targetLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center space-y-10">
                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Level Presets */}
                        <div className="flex gap-1 mb-2">
                           {[1, 100, 120].map(level => (
                             <button 
                               key={level}
                               onClick={() => {
                                 setCurrentLevel(level === 120 ? 100 : 1);
                                 setTargetLevel(level);
                               }}
                               className="px-2 py-0.5 bg-white/5 hover:bg-amber-500 hover:text-black border border-white/5 rounded text-[8px] font-bold text-gray-400 transition-all uppercase"
                             >
                               Set {level}
                             </button>
                           ))}
                        </div>

                        {/* Fame Counter */}
                        <div className="flex flex-col">
                          <span className="text-4xl font-mono font-black tracking-tighter text-white">
                            {formatNumber(calculation.fameNeeded)}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mt-1">Fame Credits Required</span>
                        </div>
                        
                        {/* IP Simulation */}
                        <div className="bg-black/30 border border-white/5 rounded-lg p-3 flex items-center justify-between relative overflow-hidden group">
                            <div className="flex flex-col relative z-10">
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                Simulated Item Power
                                <div 
                                  onClick={() => setShowIPBreakdown(!showIPBreakdown)}
                                  className="cursor-pointer hover:text-amber-500 transition-colors"
                                >
                                  <Info className="w-3 h-3" />
                                </div>
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-mono font-black text-amber-500">{calculation.predictedIP}</span>
                                <span className="text-[10px] text-green-400 font-bold">+{calculation.ipGain} Gain</span>
                              </div>
                            </div>
                            
                            {/* Breakdown Popover */}
                            <AnimatePresence>
                              {showIPBreakdown && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="absolute inset-0 bg-[#0d0e12] z-20 p-2 flex flex-col justify-center"
                                >
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <div className="flex justify-between text-[8px] uppercase"><span className="text-gray-500">Base & Type</span> <span className="text-white">{calculation.breakdown.base + calculation.breakdown.typeBonus}</span></div>
                                    <div className="flex justify-between text-[8px] uppercase"><span className="text-gray-500">Quality/Ench</span> <span className="text-white">+{calculation.breakdown.quality + calculation.breakdown.enchant}</span></div>
                                    <div className="flex justify-between text-[8px] uppercase"><span className="text-gray-500">Mastery Mod</span> <span className="text-amber-500">+{Math.round(calculation.breakdown.masteryModifier * 100)}%</span></div>
                                    <div className="flex justify-between text-[8px] uppercase"><span className="text-gray-500">Node Mastery</span> <span className="text-white">+{Math.floor(calculation.breakdown.mastery)}</span></div>
                                    <div className="flex justify-between text-[8px] uppercase"><span className="text-gray-500">Self Spec</span> <span className="text-white">+{Math.floor(calculation.breakdown.specSelf)}</span></div>
                                    <div className="flex justify-between text-[8px] uppercase"><span className="text-gray-500">Cross Spec</span> <span className="text-white">+{Math.floor(calculation.breakdown.specCross)}</span></div>
                                    <div className="flex justify-between text-[8px] uppercase text-amber-500 font-bold"><span>Total IP</span> <span>{calculation.predictedIP}</span></div>
                                  </div>
                                  <button 
                                    onClick={() => setShowIPBreakdown(false)}
                                    className="absolute top-1 right-1 text-gray-600 hover:text-white"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="flex flex-col items-end gap-1 relative z-10">
                               <div className="flex gap-1">
                                 <select 
                                   value={selectedTier} 
                                   onChange={(e) => setSelectedTier(parseInt(e.target.value))}
                                   className="bg-zinc-800 text-[9px] font-bold text-white p-1 rounded border border-white/10 outline-none"
                                 >
                                   {[4, 5, 6, 7, 8].map(t => <option key={t} value={t} className="bg-[#121417] text-white">T{t}</option>)}
                                 </select>
                                 <select 
                                   value={selectedEnchant} 
                                   onChange={(e) => setSelectedEnchant(parseInt(e.target.value))}
                                   className="bg-zinc-800 text-[9px] font-bold text-white p-1 rounded border border-white/10 outline-none"
                                 >
                                   {[0, 1, 2, 3, 4].map(en => <option key={en} value={en} className="bg-[#121417] text-white">.{en}</option>)}
                                 </select>
                               </div>
                               <select 
                                   value={selectedQuality} 
                                   onChange={(e) => setSelectedQuality(e.target.value)}
                                   className="bg-[#0a0b0d] text-[8px] font-bold text-white p-1 rounded border border-white/10 outline-none w-full"
                                 >
                                   {Object.keys(ITEM_POWER.QUALITY_BONUS).map(q => <option key={q} value={q} className="bg-[#121417] text-white">{q}</option>)}
                                 </select>
                            </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end mb-2">
                        <div className="invisible h-1 w-1" />
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">{targetLevel >= 100 ? 'MAX BASE MET' : 'IN PROGRESS'}</span>
                          <div className="w-32 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (targetLevel/100)*100)}%` }}
                              className="h-full bg-green-500"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex justify-between">
                            Adjust Current <span>{currentLevel}</span>
                          </label>
                          <input 
                            type="range" min="1" max="120" value={currentLevel}
                            onChange={(e) => setCurrentLevel(parseInt(e.target.value))}
                            className="w-full account-slider"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex justify-between">
                            Adjust Target <span>{targetLevel}</span>
                          </label>
                          <input 
                            type="range" min="1" max="120" value={targetLevel}
                            onChange={(e) => setTargetLevel(parseInt(e.target.value))}
                            className="w-full account-slider"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Elite Mastery Stats */}
                <section className="col-span-12 lg:col-span-4 bg-[#121417] border border-white/10 rounded-lg p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <TrendingUp className="w-32 h-32" />
                  </div>
                  <h2 className="text-xs font-black mb-6 flex items-center gap-2 italic uppercase tracking-widest text-amber-500">Elite Spec Allocation <span className="text-[10px] font-normal text-gray-500">(100-120)</span></h2>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Elite Fame Required</span>
                        <Zap className="w-3 h-3 text-amber-500" />
                      </div>
                      <div className="text-2xl font-mono font-bold text-white tracking-widest">
                        {formatNumber(calculation.cfcNeeded)}
                      </div>
                      <p className="text-[9px] text-gray-500 leading-tight">Elite levels require using available Fame Credits or Silver Respec at a 1:1 ratio.</p>
                    </div>

                    <div className="p-4 bg-amber-500 border border-amber-600 rounded-xl space-y-1 shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all">
                      <span className="text-[10px] font-black text-black/60 uppercase tracking-tighter">Total Silver Investment</span>
                      <div className="text-2xl font-mono font-black text-black tracking-widest">
                        {formatNumber(calculation.silverNeeded + (calculation.fameNeeded > 0 ? calculation.tomeCost : 0))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-black/10">
                        <span className="text-[9px] font-bold text-black/50 uppercase">Elite + Tome Estimate</span>
                        <Coins className="w-3 h-3 text-black/60" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Detailed Costs Table */}
                <section className="col-span-12 lg:col-span-12 xl:col-span-7 bg-[#121417] border border-white/10 rounded-lg p-6 flex flex-col shadow-xl">
                   <div className="flex justify-between items-center mb-6">
                     <h2 className="text-[10px] font-black italic uppercase tracking-[0.2em] text-gray-400">Milestone Breakdown (Raw Fame)</h2>
                   </div>
                   <div className="flex-1 overflow-auto">
                     <table className="w-full text-left text-[11px] font-mono border-separate border-spacing-y-2">
                       <thead>
                         <tr className="text-[9px] text-gray-600 uppercase tracking-tighter font-black">
                           <th className="pb-2">Segment</th>
                           <th className="pb-2">Fame Needed</th>
                           <th className="pb-2">Fame Credits</th>
                           <th className="pb-2 text-right">Benefit</th>
                         </tr>
                       </thead>
                       <tbody className="space-y-2">
                          <tr className="bg-white/[0.02] border border-white/5 rounded">
                            <td className="p-3 border-l border-white/5">01 - 50</td>
                            <td className="p-3">0.95 M</td>
                            <td className="p-3 text-gray-500">—</td>
                            <td className="p-3 text-right text-green-400">+100 IP</td>
                          </tr>
                          <tr className="bg-white/[0.04] border border-white/5 rounded">
                            <td className="p-3 border-l border-white/5">51 - 75</td>
                            <td className="p-3">4.50 M</td>
                            <td className="p-3 text-gray-500">—</td>
                            <td className="p-3 text-right text-green-400">+50 IP</td>
                          </tr>
                          <tr className="bg-white/[0.02] border border-white/5 rounded">
                            <td className="p-3 border-l border-white/5">76 - 100</td>
                            <td className="p-3">28.52 M</td>
                            <td className="p-3 text-gray-500">—</td>
                            <td className="p-3 text-right text-green-400">+50 IP</td>
                          </tr>
                          <tr className="bg-amber-500/5 border-l-2 border-amber-500 rounded">
                            <td className="p-3 text-amber-500 font-bold italic">100 - 120</td>
                            <td className="p-3 font-bold">{formatNumber(calculation.cfcNeeded)}</td>
                            <td className="p-3 text-amber-500/80">{formatNumber(calculation.cfcNeeded)}</td>
                            <td className="p-3 text-right text-amber-500 font-black">+40 IP</td>
                          </tr>
                       </tbody>
                     </table>
                   </div>
                </section>

                {/* Efficiency & Insight */}
                <section className="col-span-12 lg:col-span-12 xl:col-span-5 bg-[#1c1f24] border border-amber-500/20 rounded-lg p-6 shadow-2xl relative">
                  <div className="absolute top-4 right-4 animate-spin-slow">
                    {isLoadingMarket ? <RefreshCw className="w-3 h-3 text-amber-500/30" /> : <Globe className="w-3 h-3 text-amber-500/30" />}
                  </div>
                  <h2 className="text-xs font-black text-amber-500 mb-6 tracking-widest uppercase italic flex items-center gap-2">
                    <Info className="w-4 h-4" /> Market-Driven Analytics
                  </h2>
                  <div className="space-y-5">
                    <div className="flex flex-col gap-1 p-3 bg-black/40 rounded border border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Tome of Insight Price</span>
                        <span className="text-[9px] text-zinc-600 font-mono uppercase">{server} Market</span>
                      </div>
                      <div className="flex items-center justify-between text-white font-mono text-xs">
                        <span className="flex items-center gap-1.5"><Layers className="w-3 h-3 text-amber-500" /> Lowest Sell Price</span>
                        <span className="text-emerald-500 font-bold">~{formatNumber(tomePrice)} Silver</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded">
                        <div className="text-[8px] text-blue-400 font-black uppercase mb-1">Tomes for 1-100</div>
                        <div className="text-lg font-mono font-bold text-white leading-none tracking-tighter">
                          {formatNumber(Math.ceil(calculation.fameNeeded / 10000))} <span className="text-[8px] text-gray-500 font-normal">UNITS</span>
                        </div>
                        <div className="text-[7px] text-gray-600 mt-1 uppercase">Approx {formatNumber(calculation.tomeCost)} silver</div>
                      </div>
                      <div className="bg-green-500/5 border border-green-500/10 p-3 rounded">
                        <div className="text-[8px] text-green-400 font-black uppercase mb-1">Combat Spec Utility</div>
                        <div className="text-lg font-mono font-bold text-white leading-none tracking-tighter">
                          +240 <span className="text-[8px] text-gray-500 font-normal">TOTAL IP</span>
                        </div>
                        <div className="text-[7px] text-gray-600 mt-1 uppercase">Combined Stats</div>
                      </div>
                    </div>

                    <button className="w-full bg-[#121417] hover:bg-amber-500 border border-white/10 hover:border-amber-400 group p-4 rounded-xl transition-all duration-300 flex items-center justify-between shadow-lg">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[8px] font-black text-gray-500 group-hover:text-black uppercase tracking-widest mb-0.5">Automated Strategy</span>
                        <span className="text-xs font-bold text-white group-hover:text-black italic uppercase">Export Mastery Checklist</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-500 group-hover:text-black" />
                    </button>
                  </div>
                </section>
              </motion.div>
            ) : viewMode === 'MARKET' ? (
              <motion.div 
                key="market"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="col-span-12 flex flex-col gap-4"
              >
                {/* Market Header */}
                <div className="bg-[#121417] border border-white/10 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <ShoppingCart className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black italic uppercase tracking-widest">Market Indices</h2>
                      <p className="text-[9px] text-gray-500 uppercase">Live Global Item Value HUD</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative">
                      <div 
                        onClick={() => setIsCityOpen(!isCityOpen)}
                        className="flex items-center gap-2 bg-[#0a0b0d] p-1.5 rounded-lg border border-white/5 cursor-pointer hover:border-amber-500/30 transition-all min-w-[124px] justify-between group"
                      >
                          <div className="flex items-center gap-2">
                            <Globe className={`w-3 h-3 transition-colors ${isCityOpen ? 'text-amber-500' : 'text-gray-500'}`} />
                            <span className="text-[10px] font-bold text-amber-500 uppercase">{selectedCity}</span>
                          </div>
                          <ChevronRight className={`w-3 h-3 text-gray-500 transition-transform ${isCityOpen ? 'rotate-90' : ''}`} />
                      </div>
                      
                      <AnimatePresence>
                        {isCityOpen && (
                          <>
                            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsCityOpen(false)} />
                            <motion.div 
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full left-0 mt-2 w-full bg-[#121417] border border-white/10 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                            >
                              <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {CITIES.map(city => (
                                  <div 
                                    key={city}
                                    onClick={() => { setSelectedCity(city); setIsCityOpen(false); }}
                                    className={`px-3 py-2 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all rounded mb-0.5 last:mb-0 ${selectedCity === city ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                  >
                                    {city}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="relative w-full md:w-80 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="SEARCH ITEMS, TIERS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0b0d] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-[10px] font-mono tracking-widest focus:outline-none focus:border-amber-500/30 transition-all placeholder:text-gray-700 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Market Table */}
                <div className="bg-[#121417] border border-white/10 rounded-lg overflow-hidden shadow-2xl flex-1 flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="text-[9px] text-gray-600 uppercase tracking-tighter font-black bg-[#0e1013] border-b border-white/5">
                          <th className="p-4 cursor-pointer hover:text-amber-500 transition-all select-none" onClick={() => {
                            if (marketSortField === 'name') setMarketSortOrder(marketSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setMarketSortField('name'); setMarketSortOrder('asc'); }
                          }}>
                            <div className="flex items-center gap-1">
                              Item Catalog ID {marketSortField === 'name' && (marketSortOrder === 'asc' ? '↑' : '↓')}
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer hover:text-amber-500 transition-all select-none" onClick={() => {
                            if (marketSortField === 'tier') setMarketSortOrder(marketSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setMarketSortField('tier'); setMarketSortOrder('asc'); }
                          }}>
                            <div className="flex items-center gap-1">
                              Tier {marketSortField === 'tier' && (marketSortOrder === 'asc' ? '↑' : '↓')}
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer hover:text-amber-500 transition-all select-none" onClick={() => {
                            if (marketSortField === 'enchantment') setMarketSortOrder(marketSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setMarketSortField('enchantment'); setMarketSortOrder('asc'); }
                          }}>
                            <div className="flex items-center gap-1">
                              Ench {marketSortField === 'enchantment' && (marketSortOrder === 'asc' ? '↑' : '↓')}
                            </div>
                          </th>
                          <th className="p-4 cursor-pointer hover:text-amber-500 transition-all select-none" onClick={() => {
                            if (marketSortField === 'price') setMarketSortOrder(marketSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setMarketSortField('price'); setMarketSortOrder('asc'); }
                          }}>
                            <div className="flex items-center gap-1">
                              Min Sell Price {marketSortField === 'price' && (marketSortOrder === 'asc' ? '↑' : '↓')}
                            </div>
                          </th>
                          <th className="p-4">Market Location</th>
                          <th className="p-4 text-center">HUD Avg Value</th>
                          <th className="p-4 text-right">Liquidity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredItems.map((item) => {
                          const data = getItemMarketData(item.id);
                          return (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-white font-bold group-hover:text-amber-500 transition-colors">{item.name}</span>
                                  <span className="text-[8px] text-gray-600 uppercase tracking-widest">{item.id}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="px-1.5 py-0.5 bg-zinc-800 text-[10px] text-white rounded font-bold border border-white/5">T{item.tier}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-[10px] text-gray-400 font-bold">.{item.id.includes('@') ? item.id.split('@')[1] : '0'}</span>
                              </td>
                              <td className="p-4 text-emerald-400 font-bold">
                                {data ? formatNumber(data.minSell) : <span className="text-gray-800">—</span>}
                              </td>
                              <td className="p-4 text-gray-500 italic">
                                {data ? data.city : 'N/A'}
                              </td>
                              <td className="p-4 text-center">
                                <span className="px-2 py-1 bg-black/40 rounded text-amber-500 font-black tracking-tight border border-white/5">
                                  {data ? formatNumber(data.avg) : '...'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className={`w-1 h-1 rounded-full ${data ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-800'}`}></div>
                                  <span className="text-[9px] text-gray-600 font-bold uppercase">{data ? 'Stable' : 'Unknown'}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : viewMode === 'FLIPPER' ? (
              <motion.div 
                key="flipper"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-12 flex flex-col gap-6"
              >
                 <div className="bg-[#121417] border border-white/10 rounded-lg p-6 flex items-center justify-between shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <ArrowRightLeft className="w-24 h-24" />
                    </div>
                    <div className="z-10">
                      <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Royal to <span className="text-amber-500 underline decoration-amber-500/30">Black Market</span> Scout</h2>
                      <p className="text-[10px] text-gray-500 uppercase font-black mt-1">Comparing royal city prices vs Black Market buy orders</p>
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/5 z-10">
                       <span className="text-[9px] text-gray-600 uppercase font-bold px-2">Market Logic: <span className="text-emerald-500">Instant BM Buy-Order Fill</span></span>
                       <div className="w-px h-4 bg-white/10 mx-1" />
                       <button 
                        onClick={() => {
                          loadMarketData();
                          setVisibleFlipsCount(20);
                        }}
                        disabled={isLoadingMarket}
                        className={`p-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all group/refresh ${isLoadingMarket ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Refresh Market Data"
                       >
                         <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMarket ? 'animate-spin' : 'group-hover/refresh:rotate-180 transition-transform duration-500'}`} />
                       </button>
                    </div>
                 </div>

                 {/* Sort Controls */}
                 <div className="flex flex-wrap items-center gap-4 bg-[#121417]/50 border border-white/5 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mr-2">Sort Field:</span>
                       <button 
                        onClick={() => setFlipperSortField('roi')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${flipperSortField === 'roi' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                       >
                         ROI %
                       </button>
                       <button 
                        onClick={() => setFlipperSortField('buyPrice')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${flipperSortField === 'buyPrice' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                       >
                         Buy-In Value
                       </button>
                       <button 
                        onClick={() => setFlipperSortField('profit')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${flipperSortField === 'profit' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                       >
                         Silver Earned
                       </button>
                       <button 
                        onClick={() => setFlipperSortField('tier')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${flipperSortField === 'tier' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                       >
                         Tier
                       </button>
                       <button 
                        onClick={() => setFlipperSortField('enchantment')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${flipperSortField === 'enchantment' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                       >
                         Enchant
                       </button>
                    </div>

                    <div className="w-px h-4 bg-white/10" />

                    <div className="flex items-center gap-2">
                       <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mr-2">Direction:</span>
                       <button 
                        onClick={() => setFlipperSortOrder('desc')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${flipperSortOrder === 'desc' ? 'bg-zinc-100 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                       >
                         High to Low
                       </button>
                       <button 
                        onClick={() => setFlipperSortOrder('asc')}
                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase transition-all ${flipperSortOrder === 'asc' ? 'bg-zinc-100 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                       >
                         Low to High
                       </button>
                    </div>

                    <div className="ml-auto text-[9px] text-zinc-600 font-mono tracking-tighter uppercase italic">
                       Displaying {Math.min(visibleFlipsCount, flipperData.length)} of {flipperData.length} opportunities
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flipperData.slice(0, visibleFlipsCount).map((flip, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={`${flip.item.id}-${flip.buyCity}-${flip.sellCity}-${flip.quality}`}
                        className="bg-[#121417] border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-amber-500/30 transition-all hover:bg-amber-500/[0.02]"
                      >
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white italic uppercase group-hover:text-amber-500 transition-colors">{flip.item.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] text-gray-600 block">T{flip.item.tier} • {flip.item.id}</span>
                                <span className={`text-[8px] font-black uppercase ${getQualityColor(flip.quality)}`}>{getQualityName(flip.quality)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                               <div className="text-emerald-500 font-mono font-black text-sm">+{formatNumber(flip.profit)}</div>
                               <div className="text-[9px] text-emerald-500/50 font-bold">{flip.roi.toFixed(1)}% ROI</div>
                            </div>
                         </div>

                         <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 bg-black/40 p-2 rounded-lg border border-white/5">
                               <div className="text-[7px] text-gray-500 uppercase font-black mb-1">Buy in</div>
                               <div className="text-[10px] font-bold text-white uppercase">{flip.buyCity}</div>
                               <div className="text-[9px] font-mono text-gray-400">{formatNumber(flip.buyPrice)}</div>
                            </div>
                            <div className="flex flex-col items-center">
                               <ArrowRightLeft className="w-4 h-4 text-amber-500/40" />
                            </div>
                            <div className="flex-1 bg-black/40 p-2 rounded-lg border border-white/5 border-r-amber-500/20 border-r-2">
                               <div className="text-[7px] text-gray-500 uppercase font-black mb-1">Sell in</div>
                               <div className="text-[10px] font-bold text-amber-500 uppercase">{flip.sellCity}</div>
                               <div className="text-[9px] font-mono text-gray-400">{formatNumber(flip.sellPrice)}</div>
                            </div>
                         </div>

                         <button className="w-full py-2 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 transition-all transform active:scale-95 italic">
                            Track Trade
                         </button>
                      </motion.div>
                    ))}
                 </div>

                 {flipperData.length > visibleFlipsCount && (
                   <div className="flex justify-center mt-6">
                     <button 
                       onClick={() => setVisibleFlipsCount(prev => prev + 20)}
                       className="px-8 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase rounded-xl hover:bg-white/10 hover:border-amber-500/30 transition-all flex items-center gap-2 group/more"
                     >
                       Show More Opportunities 
                       <ChevronRight className="w-4 h-4 text-amber-500 group-hover/more:translate-x-1 transition-transform" />
                     </button>
                   </div>
                 )}
              </motion.div>
            ) : (
               <motion.div 
                 key="killboard"
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0 }}
                 className="col-span-12 flex flex-col gap-6"
               >
                  <div className="bg-[#121417] border border-white/10 rounded-lg p-6 flex items-center justify-between shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Skull className="w-24 h-24" />
                    </div>
                    <div className="z-10">
                      <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Latest <span className="text-amber-500 underline decoration-amber-500/30">High Fame</span> Kills</h2>
                      <p className="text-[10px] text-gray-500 uppercase font-black mt-1">Live tracking of notable PvP events on {server}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/5 z-10">
                       <button 
                        onClick={() => {
                          loadKills();
                          setVisibleKillsCount(5);
                        }}
                        disabled={isLoadingKills}
                        className={`p-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all group/refresh ${isLoadingKills ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Refresh Killboard"
                       >
                         <RefreshCw className={`w-3.5 h-3.5 ${isLoadingKills ? 'animate-spin' : 'group-hover/refresh:rotate-180 transition-transform duration-500'}`} />
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {isLoadingKills && kills.length === 0 ? (
                      <div className="p-20 flex flex-col items-center justify-center text-gray-600 gap-4">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Intercepting Kill Feeds...</span>
                      </div>
                    ) : kills.length === 0 ? (
                      <div className="p-20 flex flex-col items-center justify-center text-gray-600 gap-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <Skull className="w-8 h-8 text-red-500/50" />
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Terminal Connection Error</span>
                          <span className="text-[9px] text-gray-500 mt-1">THE ALBION API IS CURRENTLY UNREACHABLE OR BLOCKING REQUESTS</span>
                        </div>
                        <button 
                          onClick={() => loadKills()}
                          className="mt-4 px-6 py-2 bg-white/5 border border-white/10 text-[10px] font-black uppercase rounded-lg hover:bg-white/10 transition-all"
                        >
                          Retry Uplink
                        </button>
                      </div>
                    ) : (
                      kills.slice(0, visibleKillsCount).map((kill, idx) => (
                        <motion.div 
                          key={kill.EventId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-[#121417] border border-white/10 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all group"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-stretch border-b border-white/5">
                              {/* Killer */}
                              <div className="flex-1 p-4 bg-emerald-500/[0.02] flex flex-col justify-center border-r border-white/5">
                                <div className="text-[8px] text-emerald-500 uppercase font-black mb-1">Killer</div>
                                <div className="flex items-center gap-3">
                                  <div className="text-lg font-black text-white italic truncate max-w-[120px]">{kill.Killer?.Name || 'Unknown'}</div>
                                  <div className="text-[10px] font-mono text-gray-500">
                                    {Math.round(kill.Killer?.AverageItemPower || kill.Killer?.ItemPower || 0)} IP
                                  </div>
                                </div>
                                <div className="text-[9px] text-gray-600 font-bold uppercase mt-1 truncate">
                                  {kill.Killer?.GuildName ? `[${kill.Killer.GuildName}]` : 'No Guild'}
                                </div>
                              </div>

                              {/* Center Divider / Fame */}
                              <div className="w-32 bg-black/40 flex flex-col items-center justify-center border-x border-white/5 relative shrink-0">
                                <div className="text-[8px] text-gray-500 uppercase font-black mb-1">Fame</div>
                                <div className="text-sm font-mono font-black text-amber-500">
                                  +{formatNumber(kill.TotalVictimFame || kill.Victim?.DeathFame || kill.Victim?.Fame || 0)}
                                </div>
                                <div className="text-[7px] text-gray-700 font-mono mt-1 text-center">EVENT ID: {kill.EventId}</div>
                                <div className="text-[8px] text-red-500 font-mono font-bold mt-1 text-center bg-red-500/10 px-1 rounded">
                                  {kill.TimeStamp.replace('T', ' ').split('.')[0]} UTC
                                </div>
                              </div>

                              {/* Victim */}
                              <div className="flex-1 p-4 bg-red-500/[0.02] flex flex-col justify-center text-right border-l border-white/5">
                                <div className="text-[8px] text-red-500 uppercase font-black mb-1">Victim</div>
                                <div className="flex items-center justify-end gap-3">
                                  <div className="text-[10px] font-mono text-gray-500">
                                    {Math.round(kill.Victim?.AverageItemPower || kill.Victim?.ItemPower || 0)} IP
                                  </div>
                                  <div className="text-lg font-black text-white italic truncate max-w-[120px]">{kill.Victim?.Name || 'Unknown'}</div>
                                </div>
                                <div className="text-[9px] text-gray-600 font-bold uppercase mt-1 truncate text-right">
                                  {kill.Victim?.GuildName ? `[${kill.Victim.GuildName}]` : 'No Guild'}
                                </div>
                              </div>
                            </div>

                            {/* Gear Displays */}
                            <div className="flex justify-between items-center px-4 py-2 bg-black/30">
                              {/* Killer Gear */}
                              <div className="flex gap-1 overflow-x-auto pb-1 max-w-[42%] scrollbar-hide">
                                {kill.Killer?.Equipment && (Object.entries(kill.Killer.Equipment) as [string, AlbionEquipmentItem | null][])
                                  .filter((entry): entry is [string, AlbionEquipmentItem] => !!(entry[1] && entry[1].Type))
                                  .map(([slot, item]) => (
                                    <ItemIcon key={`killer-gear-${kill.EventId}-${slot}`} item={item} eventId={kill.EventId} slot={slot} />
                                  ))}
                              </div>

                              <div className="hidden md:block text-[8px] text-gray-700 uppercase font-black tracking-[0.2em] opacity-30">VS</div>

                              {/* Victim Gear */}
                              <div className="flex gap-1 overflow-x-auto pb-1 max-w-[42%] justify-end scrollbar-hide">
                                {kill.Victim?.Equipment && (Object.entries(kill.Victim.Equipment) as [string, AlbionEquipmentItem | null][])
                                  .filter((entry): entry is [string, AlbionEquipmentItem] => !!(entry[1] && entry[1].Type))
                                  .map(([slot, item]) => (
                                    <ItemIcon key={`victim-gear-${kill.EventId}-${slot}`} item={item} eventId={kill.EventId} slot={slot} />
                                  ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-center mt-2">
                     <button 
                       onClick={() => {
                         if (visibleKillsCount + 10 > kills.length) {
                           loadKills(true);
                         } else {
                           setVisibleKillsCount(prev => prev + 10);
                         }
                       }}
                       disabled={isLoadingKills}
                       className="px-8 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase rounded-xl hover:bg-white/10 hover:border-amber-500/30 transition-all flex items-center gap-2 group/more disabled:opacity-50"
                     >
                       {isLoadingKills ? 'Loading...' : 'Load Older Reports'}
                       <ChevronRight className={`w-4 h-4 text-amber-500 group-hover/more:translate-x-1 transition-transform ${isLoadingKills ? 'animate-spin' : ''}`} />
                     </button>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-8 bg-[#121417] border-t border-white/10 flex items-center px-4 justify-between text-[10px] font-mono text-gray-500 flex-none">
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> SYSTEM: ONLINE</span>
          <span className="w-px h-3 bg-white/10" />
          <span>FAME COEFF: <span className="text-amber-500">1.000</span></span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="hidden sm:inline">ALBION VERSION: <span className="text-gray-300">PATHS TO GLORY</span></span>
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Layers className="w-3 h-3" />
            <span>ENCRYPTED_HUD_v2.0.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
