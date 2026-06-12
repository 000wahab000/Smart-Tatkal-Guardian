import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Shield, LogOut, Play, Square, Activity, Target, Database, Ban, Scale, Wifi, WifiOff, Zap, ShieldAlert, Bug, Users, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type RequestType = "ALLOW" | "BLOCK" | "HONEY";

interface LiveRequest {
  id: string;
  timestamp: string;
  type: RequestType;
  user_id: string;
  train_id: string;
  route: string;
  score: number;
}

interface HoneypotEntry {
  id: string;
  text: string;
  time: string;
  isConfirmed: boolean;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [rps, setRps] = useState(10);
  
  const [stats, setStats] = useState({ total: 0, blocked: 0, passed: 0, honey: 0 });
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [blacklist, setBlacklist] = useState<{ip: string, time: string}[]>([]);
  const [honeypotLog, setHoneypotLog] = useState<HoneypotEntry[]>([]);
  const pendingHoneypotsRef = useRef<{ userId: string; countdown: number; train_id: string; route: string; timestamp: string }[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<{time: string; bots: number; genuine: number}[]>([]);
  const currentSecondCounts = useRef({ bots: 0, genuine: 0 });
  const [dataSource, setDataSource] = useState<'ws' | 'mock' | null>(null);

  useEffect(() => {
    const tatkalUser = localStorage.getItem("tatkal_user");
    if (!tatkalUser) {
      setLocation("/login");
    } else {
      setUser(tatkalUser);
    }
  }, [setLocation]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Shared handler: updates all dashboard state from a single event
  const handleEvent = useCallback((data: LiveRequest) => {
    const type = data.type;

    setStats(prev => ({
      total: prev.total + 1,
      blocked: prev.blocked + (type === "BLOCK" ? 1 : 0),
      passed: prev.passed + (type === "ALLOW" ? 1 : 0),
      honey: prev.honey + (type === "HONEY" ? 1 : 0)
    }));

    setRequests(prev => [data, ...prev].slice(0, 30));

    if (type === "BLOCK" && Math.random() > 0.5) {
      setBlacklist(prev => [{ ip: `103.45.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, time: data.timestamp }, ...prev].slice(0, 10));
    }

    // Process countdowns for any pending honeypots
    const completedEntries: HoneypotEntry[] = [];
    pendingHoneypotsRef.current = pendingHoneypotsRef.current
      .map(p => {
        const nextCountdown = p.countdown - 1;
        if (nextCountdown <= 0) {
          completedEntries.push({
            id: `${p.userId}_confirmed_${Math.random().toString(36).substring(2, 9)}`,
            text: `${p.userId} → Attempted fake booking ← CONFIRMED BOT`,
            time: data.timestamp,
            isConfirmed: true
          });
        }
        return { ...p, countdown: nextCountdown };
      })
      .filter(p => p.countdown > 0);

    const newEntries: HoneypotEntry[] = [];
    if (type === "HONEY") {
      newEntries.push({
        id: `${data.user_id}_shown_${Math.random().toString(36).substring(2, 9)}`,
        text: `${data.user_id} → Shown fake slot [${data.train_id}] [${data.route}]`,
        time: data.timestamp,
        isConfirmed: false
      });

      // Track pending honeypot user: 3-5 events later
      pendingHoneypotsRef.current.push({
        userId: data.user_id,
        countdown: Math.floor(Math.random() * 3) + 3, // 3, 4, or 5 events later
        train_id: data.train_id,
        route: data.route,
        timestamp: data.timestamp
      });
    }

    // Combine completed and new entries
    const entriesToAdd = [...completedEntries, ...newEntries];
    if (entriesToAdd.length > 0) {
      setHoneypotLog(prev => [...entriesToAdd, ...prev].slice(0, 15));
    }

    if (type === "BLOCK" || type === "HONEY") {
      currentSecondCounts.current.bots += 1;
    } else {
      currentSecondCounts.current.genuine += 1;
    }
  }, []);

  // Generate a mock request and feed it through handleEvent
  const generateRequest = useCallback(() => {
    const isBot = Math.random() < 0.8;
    const score = isBot ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 31) + 5;

    let type: RequestType = "ALLOW";
    if (score >= 85) type = "HONEY";
    else if (score >= 70) type = "BLOCK";

    const newReq: LiveRequest = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 }),
      type,
      user_id: `USR_${Math.floor(Math.random() * 9000) + 1000}`,
      train_id: ["12903_GOLD", "12904_EXP", "22691_RAJD", "12431_TRV"][Math.floor(Math.random() * 4)],
      route: ["NDLS-BCT", "BCT-NDLS", "SBC-NZM", "HWH-MAS"][Math.floor(Math.random() * 4)],
      score
    };

    handleEvent(newReq);
  }, [handleEvent]);

  // Start mock fallback interval
  const startMockInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const ms = 1000 / rps;
    intervalRef.current = setInterval(generateRequest, ms);
    setDataSource('mock');
  }, [rps, generateRequest]);

  // WebSocket-first with 2-second fallback to mock data
  useEffect(() => {
    if (!isRunning) {
      // Clean up everything when stopped
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDataSource(null);
      return;
    }

    let fallbackTimer: NodeJS.Timeout | null = null;
    let cancelled = false;

    try {
      const ws = new WebSocket('ws://localhost:8000/ws/events');
      wsRef.current = ws;

      // Start a 2-second countdown — if WS hasn't opened by then, fall back
      fallbackTimer = setTimeout(() => {
        if (!cancelled && ws.readyState !== WebSocket.OPEN) {
          console.log('[Dashboard] WebSocket timeout — falling back to mock data');
          ws.close();
          wsRef.current = null;
          startMockInterval();
        }
      }, 2000);

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        console.log('[Dashboard] WebSocket connected');
        if (fallbackTimer) clearTimeout(fallbackTimer);
        setDataSource('ws');
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "stats") {
            setStats({
              total: data.stats.total || 0,
              blocked: data.stats.blocked || data.stats.block || 0,
              passed: data.stats.passed || data.stats.allowed || 0,
              honey: data.stats.honey || 0
            });
          } else {
            handleEvent(data as LiveRequest);
          }
        } catch (err) {
          console.warn('[Dashboard] Bad WS message:', err);
        }
      };

      ws.onerror = () => {
        if (cancelled) return;
        console.log('[Dashboard] WebSocket error — falling back to mock data');
        if (fallbackTimer) clearTimeout(fallbackTimer);
        ws.close();
        wsRef.current = null;
        startMockInterval();
      };

      ws.onclose = () => {
        if (cancelled) return;
        // If WS closes unexpectedly while we're still running, fall back
        if (wsRef.current === ws && !intervalRef.current) {
          console.log('[Dashboard] WebSocket closed — falling back to mock data');
          wsRef.current = null;
          startMockInterval();
        }
      };
    } catch {
      // WebSocket constructor itself failed
      console.log('[Dashboard] WebSocket unavailable — using mock data');
      startMockInterval();
    }

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, rps, handleEvent, startMockInterval]);

  // Sample per-second counts into the time series
  const timeSeriesRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isRunning) {
      currentSecondCounts.current = { bots: 0, genuine: 0 };
      timeSeriesRef.current = setInterval(() => {
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const { bots, genuine } = currentSecondCounts.current;
        currentSecondCounts.current = { bots: 0, genuine: 0 };
        setTimeSeriesData(prev => [...prev, { time: now, bots, genuine }].slice(-30));
      }, 1000);
    } else {
      if (timeSeriesRef.current) clearInterval(timeSeriesRef.current);
    }
    return () => {
      if (timeSeriesRef.current) clearInterval(timeSeriesRef.current);
    };
  }, [isRunning]);

  const handleToggleSimulation = async () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    try {
      if (nextState) {
        await fetch(`http://localhost:8001/simulate/start?rps=${rps}`, { method: 'POST' });
      } else {
        await fetch('http://localhost:8001/simulate/stop', { method: 'POST' });
      }
    } catch (err) {
      console.warn('Failed to control backend simulator:', err);
    }
  };

  useEffect(() => {
    fetch('http://localhost:8001/simulate/status')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.running === 'boolean') {
          setIsRunning(data.running);
        }
      })
      .catch(err => console.warn('Simulator offline or unreachable:', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tatkal_user");
    setLocation("/");
  };

  if (!user) return null;

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  // Computed helpers
  const blockRate = stats.total > 0 ? ((stats.blocked + stats.honey) / stats.total * 100).toFixed(1) : '0.0';

  return (
    <div className="h-screen w-full bg-background flex flex-col font-sans overflow-hidden">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.35)]">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.85rem] font-bold text-foreground tracking-tight leading-tight">Smart Tatkal Guardian</span>
            <span className="text-[0.6rem] text-muted-foreground uppercase tracking-[0.15em] leading-tight">Network Operations Center</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Data source indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-semibold border transition-colors ${
            dataSource === 'ws'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : dataSource === 'mock'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-card text-muted-foreground border-border'
          }`}>
            {dataSource === 'ws' ? <Wifi className="w-3 h-3" /> : dataSource === 'mock' ? <Zap className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {dataSource === 'ws' ? 'LIVE' : dataSource === 'mock' ? 'SIMULATED' : 'IDLE'}
          </div>
          {/* User avatar */}
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-white flex items-center justify-center text-[0.65rem] font-bold shadow-sm">
              {getInitials(user)}
            </div>
            <div className="flex flex-col">
              <span className="text-[0.75rem] text-foreground font-medium leading-tight">{user}</span>
              <span className="text-[0.6rem] text-muted-foreground leading-tight">Operator</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-1 p-2 border border-border rounded-lg text-muted-foreground hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
        <div className="flex-[2] border-r border-border flex flex-col p-4 gap-3 overflow-hidden bg-background">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {[
              { label: 'Total Requests', value: stats.total, color: 'blue', icon: TrendingUp, sub: `${blockRate}% threat rate` },
              { label: 'Bots Blocked', value: stats.blocked, color: 'red', icon: ShieldAlert, sub: `${stats.total > 0 ? (stats.blocked / stats.total * 100).toFixed(1) : '0.0'}%` },
              { label: 'Humans Passed', value: stats.passed, color: 'green', icon: Users, sub: `${stats.total > 0 ? (stats.passed / stats.total * 100).toFixed(1) : '0.0'}%` },
              { label: 'Honeypot Caught', value: stats.honey, color: 'yellow', icon: Bug, sub: `${honeypotLog.length} logged` },
            ].map((card) => {
              const colorMap: Record<string, { text: string; bg: string; glow: string }> = {
                blue:   { text: 'text-blue-400',   bg: 'bg-blue-500/10',   glow: 'shadow-[inset_0_1px_0_rgba(96,165,250,0.1)]' },
                red:    { text: 'text-red-400',     bg: 'bg-red-500/10',    glow: 'shadow-[inset_0_1px_0_rgba(248,113,113,0.1)]' },
                green:  { text: 'text-green-400',   bg: 'bg-green-500/10',  glow: 'shadow-[inset_0_1px_0_rgba(74,222,128,0.1)]' },
                yellow: { text: 'text-yellow-400',  bg: 'bg-yellow-500/10', glow: 'shadow-[inset_0_1px_0_rgba(250,204,21,0.1)]' },
              };
              const c = colorMap[card.color];
              const textColor = card.color === 'blue' ? 'text-foreground' : c.text.replace('400', '500');
              return (
                <div key={card.label} className={`bg-card border border-border rounded-xl p-3.5 flex flex-col gap-2 ${c.glow}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] text-muted-foreground font-semibold uppercase tracking-wider">{card.label}</span>
                    <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center`}>
                      <card.icon className={`w-3.5 h-3.5 ${c.text}`} />
                    </div>
                  </div>
                  <motion.span key={card.value} initial={{ opacity: 0.5, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`text-2xl font-bold ${textColor} tabular-nums`}>
                    {card.value.toLocaleString()}
                  </motion.span>
                  <span className="text-[0.6rem] text-muted-foreground">{card.sub}</span>
                </div>
              );
            })}
          </div>

          {/* Live request feed */}
          <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isRunning && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">Live Request Feed</span>
                <span className="text-[0.6rem] text-muted-foreground/60 font-mono">{requests.length} entries</span>
              </div>
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-green-500/15 text-green-400 border border-green-500/10">ALLOW</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/10">BLOCK</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/10">HONEY</span>
              </div>
            </div>
            {/* Column headers */}
            <div className="px-3.5 py-1.5 border-b border-border/50 flex items-center gap-3 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground/60">
              <span className="w-20 shrink-0">Time</span>
              <span className="w-12 shrink-0 text-center">Action</span>
              <span className="w-16">User</span>
              <span className="w-20">Train</span>
              <span className="w-20">Route</span>
              <span className="ml-auto">Score</span>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-1 font-mono text-[0.73rem] flex flex-col gap-1 dashboard-scrollbar">
              <AnimatePresence initial={false}>
                {requests.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -12, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-lg border transition-colors ${
                      req.type === 'ALLOW' ? 'bg-green-500/[0.04] border-green-500/10 hover:bg-green-500/[0.08]' :
                      req.type === 'BLOCK' ? 'bg-red-500/[0.04] border-red-500/10 hover:bg-red-500/[0.08]' :
                      'bg-yellow-500/[0.04] border-yellow-500/10 hover:bg-yellow-500/[0.08]'
                    }`}
                  >
                    <span className="text-muted-foreground/70 w-20 shrink-0 text-[0.7rem]">{req.timestamp}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[0.6rem] font-bold w-12 text-center shrink-0 ${
                      req.type === 'ALLOW' ? 'bg-green-500/20 text-green-400' :
                      req.type === 'BLOCK' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {req.type}
                    </span>
                    <span className="text-foreground/90 w-16 text-[0.7rem]">{req.user_id}</span>
                    <span className="text-muted-foreground/70 w-20 text-[0.7rem]">{req.train_id}</span>
                    <span className="text-muted-foreground/70 w-20 text-[0.7rem]">{req.route}</span>
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className={`font-bold text-[0.75rem] tabular-nums ${req.score > 70 ? 'text-red-400' : req.score > 40 ? 'text-yellow-400' : 'text-green-400'}`}>{req.score}</span>
                      {/* Mini score bar */}
                      <div className="w-10 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${req.score > 70 ? 'bg-red-500' : req.score > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${req.score}%` }}
                        />
                      </div>
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {requests.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground/50 py-8">
                  <Activity className="w-8 h-8" />
                  <span className="text-xs">Start simulation to see live requests</span>
                </div>
              )}
            </div>
          </div>

          {/* Traffic chart */}
          <div className="h-48 bg-card border border-border rounded-xl p-3.5 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">Live Traffic — Last 30s</span>
              <div className="flex items-center gap-3 text-[0.6rem]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-[2px] rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Bots</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-[2px] rounded-full bg-green-500 opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22c55e 0, #22c55e 3px, transparent 3px, transparent 5px)' }} />
                  <span className="text-muted-foreground">Genuine</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '0.7rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '0.65rem', marginBottom: 4 }}
                  />
                  <Line type="monotone" dataKey="bots" stroke="#ef4444" strokeWidth={2} dot={false} name="Bot Traffic" animationDuration={300} />
                  <Line type="monotone" dataKey="genuine" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Genuine Traffic" animationDuration={300} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto dashboard-scrollbar bg-background">
          {/* Simulation controls */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[0.75rem] font-semibold text-foreground">Simulation Controls</span>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[0.6rem] font-bold flex items-center gap-1.5 uppercase tracking-wider transition-colors ${
                isRunning
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-card text-muted-foreground border border-border'
              }`}>
                {isRunning && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                {isRunning ? 'Running' : 'Stopped'}
              </div>
            </div>            <button
              onClick={handleToggleSimulation}
              className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                isRunning 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-[0_2px_12px_rgba(59,130,246,0.3)]'
              }`}
            >
              {isRunning ? <><Square className="w-3.5 h-3.5" fill="currentColor" /> Stop Simulation</> : <><Play className="w-3.5 h-3.5" fill="currentColor" /> Start Simulation</>}
            </button>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[0.7rem]">
                <span className="text-muted-foreground">Requests / Second</span>
                <span className="font-bold text-foreground bg-card border border-border rounded px-2 py-0.5 text-[0.65rem] tabular-nums">{rps} RPS</span>
              </div>
              <input 
                type="range" 
                min="1" max="50" 
                value={rps} 
                onChange={(e) => setRps(Number(e.target.value))}
                className="w-full accent-primary h-1.5"
                disabled={isRunning}
              />
              <div className="flex justify-between text-[0.55rem] text-muted-foreground/50">
                <span>1</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>
          </div>

          {/* Agent Status */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between px-0.5 mb-0.5">
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Agent Status</span>
              <span className="text-[0.55rem] text-green-500 font-semibold">5/5 ONLINE</span>
            </div>
            {[
              { name: "Booking Behavior", icon: Activity, processed: stats.total, desc: "Pattern analysis" },
              { name: "Bot Scorer", icon: Target, processed: stats.total, desc: "Risk scoring" },
              { name: "Honeypot", icon: Database, processed: stats.honey, desc: "Trap deployment" },
              { name: "Blacklist Mgr", icon: Ban, processed: stats.blocked, desc: "IP blocking" },
              { name: "Fairness Monitor", icon: Scale, processed: stats.total, desc: "Queue integrity" }
            ].map(agent => (
              <div key={agent.name} className="bg-card border border-border rounded-lg p-2.5 flex items-center gap-2.5 group hover:border-primary/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
                  <agent.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.75rem] font-semibold text-foreground truncate leading-tight">{agent.name}</div>
                  <div className="text-[0.6rem] text-muted-foreground/60 leading-tight">{agent.desc}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <div className="flex items-center gap-1 text-[0.55rem] text-green-500/80 font-bold uppercase tracking-wider">
                    <div className="w-1 h-1 rounded-full bg-green-500" /> ON
                  </div>
                  <div className="text-[0.6rem] text-muted-foreground/60 font-mono tabular-nums">{agent.processed.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Blacklist + Honeypot panels */}
          <div className="flex-1 flex flex-col gap-3 min-h-[280px]">
            <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
              <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
                <Ban className="w-3 h-3 text-red-400" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Recent Blacklist</span>
                <span className="ml-auto text-[0.55rem] text-muted-foreground/50 font-mono">{blacklist.length} IPs</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-[0.68rem] flex flex-col gap-0.5 dashboard-scrollbar">
                {blacklist.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 py-4">
                    <ShieldAlert className="w-6 h-6" />
                    <span className="text-[0.65rem]">No IPs blacklisted yet</span>
                  </div>
                ) : (
                  blacklist.map((entry, i) => (
                    <div key={i} className="flex justify-between items-center px-2 py-1.5 hover:bg-red-500/[0.03] rounded-md transition-colors">
                      <span className="text-red-400/80">⛔ {entry.ip}</span>
                      <span className="text-muted-foreground/50 text-[0.6rem]">{entry.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
              <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
                <Bug className="w-3 h-3 text-yellow-400" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Honeypot Log</span>
                <span className="ml-auto text-[0.55rem] text-muted-foreground/50 font-mono">{honeypotLog.length} traps</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-[0.68rem] flex flex-col gap-0.5 dashboard-scrollbar">
                {honeypotLog.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 py-4">
                    <Database className="w-6 h-6" />
                    <span className="text-[0.65rem]">No traps triggered yet</span>
                  </div>
                ) : (
                  honeypotLog.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex justify-between items-center px-2 py-1.5 rounded-md transition-colors gap-2 ${
                        entry.isConfirmed
                          ? "bg-red-500/10 border border-red-500/20 text-red-400 font-bold"
                          : "hover:bg-yellow-500/[0.03] text-yellow-400/80"
                      }`}
                    >
                      <span className="truncate">
                        {entry.isConfirmed ? "🚨 " : "🍯 "}
                        {entry.text}
                      </span>
                      <span className="text-muted-foreground/50 shrink-0 text-[0.6rem]">
                        {entry.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER STATUS BAR ─────────────────────────────────────────── */}
      <footer className="h-7 border-t border-border bg-card/50 flex items-center justify-between px-6 text-[0.6rem] text-muted-foreground/60 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <span>STG v1.0.0</span>
          <span>•</span>
          <span>{dataSource === 'ws' ? '🟢 WebSocket' : dataSource === 'mock' ? '🟡 Mock Data' : '⚫ Disconnected'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Agents: 5/5</span>
          <span>•</span>
          <span>Uptime: {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .dashboard-scrollbar::-webkit-scrollbar { width: 5px; }
        .dashboard-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .dashboard-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 9999px; }
        .dashboard-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        input[type="range"]::-webkit-slider-thumb { cursor: pointer; }
        input[type="range"]:disabled { opacity: 0.4; }
      `}} />
    </div>
  );
}
