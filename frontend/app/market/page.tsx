'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  RefreshCw, ZoomIn, ZoomOut, Maximize, Sprout, Star, Search,
  TrendingUp, TrendingDown, CandlestickChart, LineChart as LineIcon
} from 'lucide-react';
import {
  ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Line,
} from 'recharts';

/* ───────── Types ───────── */
interface MarketPrice { id: string; commodity: string; market: string; price: number; unit: string; date: string; trend: number; }
interface Candle {
  displayDate: string; open: number; high: number; low: number; close: number; volume: number;
  range: [number, number]; ma7: number | null; ma25: number | null; rsi: number | null;
}

/* ───────── Design Tokens ───────── */
const UP = '#16a34a', DOWN = '#dc2626', AMBER = '#f59e0b', VIOLET = '#8b5cf6';
const TIMEFRAMES = ['1m', '5m', '15m', '1H', '1D'] as const;

const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const rnd = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); }; 
const clock = () => new Date().toLocaleTimeString('en-GB');

const calcRSI = (p: number[], period = 14): (number | null)[] => {
  const out: (number | null)[] = new Array(p.length).fill(null);
  if (p.length <= period) return out;
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) { const d = p[i] - p[i - 1]; d >= 0 ? (g += d) : (l -= d); }
  let ag = g / period, al = l / period;
  out[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = period + 1; i < p.length; i++) {
    const d = p[i] - p[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
};

const CandleShape = (p: any) => {
  const { x, y, width, height, payload } = p;
  if (!payload || height <= 0) return null;
  const { open, close, high, low } = payload;
  const color = close >= open ? UP : DOWN;
  const k = height / (high - low || 1);
  const top = y + (high - Math.max(open, close)) * k;
  const bodyH = Math.max(Math.abs(close - open) * k, 1.5);
  const cx = x + width / 2, bw = Math.max(width * 0.68, 2);
  return (
    <g>
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={cx - bw / 2} y={top} width={bw} height={bodyH} fill={color} rx={1} />
    </g>
  );
};

const Sparkline = ({ up, seed }: { up: boolean; seed: number }) => {
  const pts = Array.from({ length: 14 }, (_, i) => 12 + (rnd(seed + i) - 0.5) * 14 + (up ? -i : i) * 0.5);
  return (
    <svg viewBox="0 0 70 24" className="h-6 w-16">
      <polyline fill="none" stroke={up ? UP : DOWN} strokeWidth="1.5" points={pts.map((y, i) => `${i * 5.4},${y}`).join(' ')} />
    </svg>
  );
};

export default function MarketPage() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('Coffee');
  const [rawHistory, setRawHistory] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>('1D');

  // Chart
  const [zoom, setZoom] = useState(1);
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [showMA, setShowMA] = useState({ ma7: true, ma25: true });
  const [showRSI, setShowRSI] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartCardRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, startX: 0, left: 0 });

  // Watchlist
  const [query, setQuery] = useState('');
  const [favs, setFavs] = useState<string[]>([]);
  const [sort, setSort] = useState<'name' | 'change' | 'price'>('name');

  // Order Book State
  const [feed, setFeed] = useState<{ id: number; time: string; price: number; amount: number; side: 'Buy' | 'Sell' }[]>([]);
  const [bookTab, setBookTab] = useState<'Order Book' | 'Market Trades'>('Order Book');

  const fetchPrices = async () => {
    setLoading(true);
    try { setPrices((await api.get('/market/latest')).data); }
    catch { toast.error('Failed to load market prices'); }
    finally { setLoading(false); }
  };
  const fetchHistory = async (c: string) => {
    try { const r = await api.get(`/market/history/${c}`); setRawHistory(r.data); setSelected(c); setHoverIdx(null); }
    catch { toast.error('Failed to load history'); }
  };
  useEffect(() => { fetchPrices(); fetchHistory('Coffee'); }, []);

  const candles: Candle[] = useMemo(() => {
    if (!rawHistory.length) return [];
    const size = { '1m': 1, '5m': 5, '15m': 15, '1H': 60, '1D': 1440 }[timeframe];
    const out: Candle[] = [];
    for (let i = 0; i < rawHistory.length; i += size) {
      const ch = rawHistory.slice(i, i + size);
      if (!ch.length) continue;
      const ps = ch.map((c) => c.price);
      const d = new Date(ch[0].date);
      const high = Math.max(...ps) * 1.0005, low = Math.min(...ps) * 0.9995;
      out.push({
        displayDate: timeframe === '1D' ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        open: ps[0], close: ps[ps.length - 1], high, low, range: [low, high],
        volume: Math.floor(rnd(i + 1) * 2000) + 500, ma7: null, ma25: null, rsi: null,
      });
    }
    const s = out.slice(-150); // Display 150 points max
    const rsi = calcRSI(s.map((c) => c.close));
    const avg = (i: number, n: number) => Number((s.slice(i - n + 1, i + 1).reduce((a, c) => a + c.close, 0) / n).toFixed(2));
    s.forEach((c, i) => { if (i >= 6) c.ma7 = avg(i, 7); if (i >= 24) c.ma25 = avg(i, 25); c.rsi = rsi[i] == null ? null : Number(rsi[i]!.toFixed(2)); });
    return s;
  }, [rawHistory, timeframe]);

  const last = candles[candles.length - 1];
  const first = candles[0];
  const [livePrice, setLivePrice] = useState(0);
  
  useEffect(() => { if (last) setLivePrice(last.close); }, [last?.close, selected]);
  
  const view = hoverIdx != null && candles[hoverIdx] ? candles[hoverIdx] : last;
  const isUp = (view?.close ?? 0) >= (view?.open ?? 0);
  const high24 = candles.length ? Math.max(...candles.map((c) => c.high)) : 0;
  const low24 = candles.length ? Math.min(...candles.map((c) => c.low)) : 0;
  const vol24 = candles.reduce((a, c) => a + c.volume, 0);
  const change = first && last ? ((last.close - first.open) / first.open) * 100 : 0;
  const rsiNow = last?.rsi ?? 50;
  const signal = rsiNow > 70 ? { t: 'Overbought', c: DOWN } : rsiNow < 30 ? { t: 'Oversold', c: UP } : { t: 'Neutral', c: '#9ca3af' };

  const pair = `${selected}/ETB`;

  // Live tick simulation
  useEffect(() => {
    if (!last) return;
    let n = 0;
    const id = setInterval(() => {
      n++;
      const base = last.close;
      const px = Number((base * (1 + (Math.random() - 0.5) * 0.004)).toFixed(2));
      setLivePrice(px);
      setFeed((f) => [{ id: Date.now() + n, time: clock(), price: px, amount: Number((Math.random() * 4 + 0.1).toFixed(3)), side: (Math.random() > 0.5 ? 'Buy' : 'Sell') as 'Buy' | 'Sell' }, ...f].slice(0, 30));
    }, 2000);
    return () => clearInterval(id);
  }, [last?.close, pair]);

  const price = livePrice || last?.close || 0;
  const book = useMemo(() => {
    const row = (i: number, dir: 1 | -1) => ({ p: price + dir * (i + 1) * 1.5, a: rnd(Math.round(price) + i * dir + 7) * 5 + 0.1 });
    return { asks: Array.from({ length: 8 }, (_, i) => row(i, 1)).reverse(), bids: Array.from({ length: 8 }, (_, i) => row(i, -1)) };
  }, [Math.round(price)]);

  const list = useMemo(() => {
    const l = prices.filter((p) => p.commodity.toLowerCase().includes(query.toLowerCase()));
    l.sort((a, b) => (favs.includes(b.commodity) ? 1 : 0) - (favs.includes(a.commodity) ? 1 : 0)
      || (sort === 'change' ? b.trend - a.trend : sort === 'price' ? b.price - a.price : a.commodity.localeCompare(b.commodity)));
    return l;
  }, [prices, query, favs, sort]);

  // Wheel zoom (limit to 0.05)
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const wheel = (e: WheelEvent) => { 
      if (!e.ctrlKey && !e.metaKey) return; 
      e.preventDefault(); 
      setZoom((z) => Math.min(Math.max(z + (e.deltaY < 0 ? 0.1 : -0.1), 0.05), 5)); 
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  
  useEffect(() => { 
    const t = setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth; }, 100); 
    return () => clearTimeout(t); 
  }, [timeframe, candles.length, zoom]);

  const tabBtn = (active: boolean, color = '#16a34a') => ({ className: `px-3 py-2 text-xs font-semibold transition-colors ${active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`, style: active ? { boxShadow: `inset 0 -2px 0 ${color}` } : undefined });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-green-200">
        
        {/* Ticker Tape */}
        <div className="overflow-hidden border-b border-gray-200 bg-white py-2 shadow-sm">
          <div className="flex w-max gap-8 text-xs animate-[tape_40s_linear_infinite]" style={{ animation: 'tape 40s linear infinite' }}>
            {[...prices, ...prices].map((p, i) => (
              <button key={i} onClick={() => fetchHistory(p.commodity)} className="flex items-center gap-2 whitespace-nowrap hover:text-green-600 transition-colors">
                <span className="font-semibold text-gray-800">{p.commodity}</span>
                <span className="font-mono tabular-nums text-gray-600">{fmt(p.price)}</span>
                <span className="font-mono tabular-nums font-medium" style={{ color: p.trend >= 0 ? UP : DOWN }}>{p.trend >= 0 ? '+' : ''}{p.trend}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-[1700px] space-y-4 px-4 py-6">
          
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-100">
                <Sprout className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">AgriLink Market</h1>
                <p className="text-xs text-gray-500">Live commodity exchange</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <div><div className="text-gray-500 mb-0.5">Active User</div><div className="font-semibold text-gray-900">{user?.name ?? 'Guest'}</div></div>
              <Button onClick={() => { fetchPrices(); fetchHistory(selected); }} variant="outline" className="h-9 bg-white text-xs border-gray-300">
                <RefreshCw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            
            <Card className="rounded-xl border-gray-200 bg-white p-0 shadow-sm xl:col-span-2 xl:max-h-[780px]">
              <div className="space-y-3 border-b border-gray-100 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commodity" 
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-2 text-xs text-gray-900 outline-none focus:border-green-500 focus:bg-white transition-all" />
                </div>
                <div className="flex gap-1 text-[11px]">
                  {(['name', 'change', 'price'] as const).map((s) => (
                    <button key={s} onClick={() => setSort(s)} className={`rounded px-2.5 py-1 font-medium capitalize ${sort === s ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto xl:max-h-[600px] xl:flex-1">
                {list.map((p) => {
                  const up = p.trend >= 0, on = selected === p.commodity, fav = favs.includes(p.commodity);
                  return (
                    <div key={p.id} onClick={() => fetchHistory(p.commodity)}
                      className={`flex cursor-pointer items-center justify-between gap-2 border-b border-gray-50 px-4 py-3 transition-colors ${on ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
                      style={on ? { boxShadow: `inset 3px 0 0 ${UP}` } : undefined}>
                      <div className="flex min-w-0 items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setFavs((f) => (fav ? f.filter((x) => x !== p.commodity) : [...f, p.commodity])); }}>
                          <Star className="h-4 w-4" style={fav ? { color: AMBER, fill: AMBER } : { color: '#d1d5db' }} />
                        </button>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">{p.commodity}</div>
                          <div className="truncate text-[11px] text-gray-500">{p.market}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Sparkline up={up} seed={p.price} />
                        <div className="font-mono text-xs font-medium text-gray-800">{fmt(p.price)}</div>
                        <div className="font-mono text-[11px] font-medium" style={{ color: up ? UP : DOWN }}>{up ? '+' : ''}{p.trend}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card 
              ref={chartCardRef}
              className="overflow-hidden rounded-xl border-gray-200 bg-white p-0 shadow-sm xl:col-span-7 flex flex-col"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-bold text-gray-900">{pair}</h2>
                    <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: price >= (first?.open ?? 0) ? UP : DOWN }}>{fmt(price)}</span>
                    <span className="flex items-center gap-1 font-mono text-sm font-medium tabular-nums" style={{ color: change >= 0 ? UP : DOWN }}>
                      {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-gray-500">
                    <span>24h High <b className="font-mono text-gray-800">{fmt(high24)}</b></span>
                    <span>24h Low <b className="font-mono text-gray-800">{fmt(low24)}</b></span>
                    <span>24h Vol <b className="font-mono text-gray-800">{vol24.toLocaleString()} Q</b></span>
                    <span>RSI(14) <b className="font-mono font-medium" style={{ color: signal.c }}>{rsiNow.toFixed(1)} · {signal.t}</b></span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    {TIMEFRAMES.map((tf) => (
                      <button key={tf} onClick={() => setTimeframe(tf)} className={`rounded-md px-3 py-1 text-[11px] font-bold ${timeframe === tf ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tf}</button>
                    ))}
                  </div>
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    <button onClick={() => setChartType('candles')} className={`rounded-md p-1.5 ${chartType === 'candles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><CandlestickChart className="h-4 w-4" /></button>
                    <button onClick={() => setChartType('line')} className={`rounded-md p-1.5 ${chartType === 'line' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><LineIcon className="h-4 w-4" /></button>
                  </div>
                  <div className="flex gap-1 text-[11px] font-medium">
                    <button onClick={() => setShowMA((m) => ({ ...m, ma7: !m.ma7 }))} className="rounded px-2 py-1 hover:bg-gray-50" style={{ color: showMA.ma7 ? AMBER : '#d1d5db' }}>MA7</button>
                    <button onClick={() => setShowMA((m) => ({ ...m, ma25: !m.ma25 }))} className="rounded px-2 py-1 hover:bg-gray-50" style={{ color: showMA.ma25 ? VIOLET : '#d1d5db' }}>MA25</button>
                    <button onClick={() => setShowRSI((v) => !v)} className="rounded px-2 py-1 hover:bg-gray-50" style={{ color: showRSI ? '#3b82f6' : '#d1d5db' }}>RSI</button>
                  </div>
                  <div className="flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => setZoom((z) => Math.min(z + 0.2, 5))}><ZoomIn className="h-4 w-4" /></Button>
                    {/* ✅ Fixed the zoom limit and the step to go much lower */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.05))}><ZoomOut className="h-4 w-4" /></Button>
                    {/* ✅ Fixed fullscreen targeting the card */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => {
                      if (chartCardRef.current) {
                        if (document.fullscreenElement) document.exitFullscreen();
                        else chartCardRef.current.requestFullscreen();
                      }
                    }}>
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {view && (
                <div className="flex flex-wrap gap-x-4 px-4 pt-3 font-mono text-[11px] tabular-nums text-gray-500">
                  <span>{view.displayDate}</span>
                  <span>O <b style={{ color: isUp ? UP : DOWN }}>{fmt(view.open)}</b></span>
                  <span>H <b style={{ color: isUp ? UP : DOWN }}>{fmt(view.high)}</b></span>
                  <span>L <b style={{ color: isUp ? UP : DOWN }}>{fmt(view.low)}</b></span>
                  <span>C <b style={{ color: isUp ? UP : DOWN }}>{fmt(view.close)}</b></span>
                  <span>Vol <b className="text-gray-800">{view.volume.toLocaleString()}</b></span>
                </div>
              )}

              <div
                ref={scrollRef}
                className="relative overflow-x-auto overflow-y-hidden flex-1"
                style={{ cursor: drag.current.on ? 'grabbing' : 'crosshair' }}
                onMouseDown={(e) => { drag.current = { on: true, startX: e.pageX, left: scrollRef.current?.scrollLeft || 0 }; }}
                onMouseUp={() => (drag.current.on = false)}
                onMouseLeave={() => { drag.current.on = false; setHoverIdx(null); }}
                onMouseMove={(e) => { if (drag.current.on && scrollRef.current) scrollRef.current.scrollLeft = drag.current.left - (e.pageX - drag.current.startX) * 1.5; }}
              >
                {/* ✅ Removed minWidth: '100%' so it can shrink infinitely */}
                <div className="h-[450px]" style={{ width: `${100 * zoom}%` }}>
                  {candles.length === 0 ? (
                    <div className="grid h-full place-items-center text-xs text-gray-400">Loading price history…</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={candles} margin={{ top: 10, right: 0, bottom: 0, left: 0 }} onMouseMove={(s: any) => setHoverIdx(s?.activeTooltipIndex ?? null)}>
                        <defs>
                          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={UP} stopOpacity={0.15} /><stop offset="100%" stopColor={UP} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} dy={8} minTickGap={30} />
                        <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} domain={['dataMin', 'dataMax']} width={56} tickFormatter={(v) => v.toLocaleString()} />
                        <Tooltip cursor={{ stroke: '#9ca3af', strokeDasharray: '3 3' }} content={() => null} />
                        
                        <ReferenceLine y={price} stroke={price >= (first?.open ?? 0) ? UP : DOWN} strokeDasharray="3 3" opacity={0.6}
                          label={{ value: fmt(price), position: 'right', fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                        
                        {chartType === 'candles'
                          ? <Bar dataKey="range" shape={<CandleShape />} isAnimationActive={false}>{candles.map((_, i) => <Cell key={i} />)}</Bar>
                          : <Area type="monotone" dataKey="close" stroke={UP} strokeWidth={2} fill="url(#area)" isAnimationActive={false} />}
                        
                        {showMA.ma7 && <Line type="monotone" dataKey="ma7" stroke={AMBER} strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                        {showMA.ma25 && <Line type="monotone" dataKey="ma25" stroke={VIOLET} strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="h-[130px] border-t border-gray-100 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={candles} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="displayDate" hide />
                    <YAxis yAxisId="vol" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 9 }} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                    <YAxis yAxisId="rsi" orientation="right" domain={[0, 100]} ticks={[30, 70]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 9 }} width={36} />
                    <Bar yAxisId="vol" dataKey="volume" isAnimationActive={false} opacity={0.4}>
                      {candles.map((c, i) => <Cell key={i} fill={c.close >= c.open ? UP : DOWN} />)}
                    </Bar>
                    {showRSI && <Line yAxisId="rsi" type="monotone" dataKey="rsi" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                    {showRSI && <ReferenceLine yAxisId="rsi" y={70} stroke={DOWN} strokeDasharray="3 3" opacity={0.4} />}
                    {showRSI && <ReferenceLine yAxisId="rsi" y={30} stroke={UP} strokeDasharray="3 3" opacity={0.4} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 text-center flex-shrink-0">Drag to pan · Ctrl/⌘ + scroll to zoom</p>
            </Card>

            <div className="space-y-4 xl:col-span-3">
              <Card className="flex h-[640px] flex-col rounded-xl border-gray-200 bg-white p-0 shadow-sm">
                <div className="flex border-b border-gray-100 px-2">
                  {(['Order Book', 'Market Trades'] as const).map((t) => <button key={t} onClick={() => setBookTab(t)} {...tabBtn(bookTab === t)}>{t}</button>)}
                </div>
                <div className="flex justify-between px-4 py-2 text-[10px] font-medium text-gray-400"><span>Price (ETB)</span><span>Amount (Q)</span></div>
                
                {bookTab === 'Order Book' ? (
                  <div className="flex flex-1 flex-col overflow-hidden px-1 font-mono text-[11px] tabular-nums">
                    {book.asks.map((r, i) => (
                      <div key={`a${i}`} className="relative flex justify-between px-3 py-1">
                        <i className="absolute inset-y-0 right-0" style={{ width: `${(r.a / 5.1) * 100}%`, background: `${DOWN}1a` }} />
                        <span className="z-10 text-red-600 font-medium">{r.p.toFixed(2)}</span><span className="z-10 text-gray-600">{r.a.toFixed(3)}</span>
                      </div>
                    ))}
                    <div className="my-1 flex items-center justify-between border-y border-gray-100 bg-gray-50 px-3 py-2">
                      <span className="text-base font-bold" style={{ color: isUp ? UP : DOWN }}>{fmt(price)}</span>
                      <span className="text-[10px] text-gray-500">Spread {fmt(book.asks[7].p - book.bids[0].p)}</span>
                    </div>
                    {book.bids.map((r, i) => (
                      <div key={`b${i}`} className="relative flex justify-between px-3 py-1">
                        <i className="absolute inset-y-0 right-0" style={{ width: `${(r.a / 5.1) * 100}%`, background: `${UP}1a` }} />
                        <span className="z-10 text-green-600 font-medium">{r.p.toFixed(2)}</span><span className="z-10 text-gray-600">{r.a.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto px-3 font-mono text-[11px] tabular-nums mt-1">
                    {feed.map((f) => (
                      <div key={f.id} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0"><span style={{ color: f.side === 'Buy' ? UP : DOWN }}>{fmt(f.price)}</span><span className="text-gray-600">{f.amount.toFixed(3)}</span><span className="text-gray-400">{f.time}</span></div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}