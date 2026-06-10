import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Shield, LogOut, Play, Square, Activity, Target, Database, Ban, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [rps, setRps] = useState(10);
  
  const [stats, setStats] = useState({ total: 0, blocked: 0, passed: 0, honey: 0 });
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [blacklist, setBlacklist] = useState<{ip: string, time: string}[]>([]);
  const [honeypotLog, setHoneypotLog] = useState<{fake_slot_id: string, ip: string, time: string}[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState([
    { name: "0-20", count: 0, fill: "#22c55e" },
    { name: "20-40", count: 0, fill: "#16a34a" },
    { name: "40-60", count: 0, fill: "#eab308" },
    { name: "60-80", count: 0, fill: "#f97316" },
    { name: "80-100", count: 0, fill: "#ef4444" },
  ]);

  useEffect(() => {
    const tatkalUser = localStorage.getItem("tatkal_user");
    if (!tatkalUser) {
      setLocation("/login");
    } else {
      setUser(tatkalUser);
    }
  }, [setLocation]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateRequest = () => {
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

    setStats(prev => ({
      total: prev.total + 1,
      blocked: prev.blocked + (type === "BLOCK" ? 1 : 0),
      passed: prev.passed + (type === "ALLOW" ? 1 : 0),
      honey: prev.honey + (type === "HONEY" ? 1 : 0)
    }));

    setRequests(prev => [newReq, ...prev].slice(0, 30));

    if (type === "BLOCK" && Math.random() > 0.5) {
      setBlacklist(prev => [{ ip: `103.45.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, time: newReq.timestamp }, ...prev].slice(0, 10));
    }
    if (type === "HONEY") {
      setHoneypotLog(prev => [{ fake_slot_id: `FAKE_${Math.floor(Math.random() * 1000)}`, ip: `103.45.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, time: newReq.timestamp }, ...prev].slice(0, 5));
    }

    setScoreDistribution(prev => {
      const idx = Math.min(Math.floor(score / 20), 4);
      const next = [...prev];
      next[idx].count += 1;
      return next;
    });
  };

  useEffect(() => {
    if (isRunning) {
      const ms = 1000 / rps;
      intervalRef.current = setInterval(generateRequest, ms);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, rps]);

  const handleLogout = () => {
    localStorage.removeItem("tatkal_user");
    setLocation("/");
  };

  if (!user) return null;

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  return (
    <div className="h-screen w-full bg-background flex flex-col font-sans overflow-hidden">
      <header className="h-12 border-b border-border bg-surface/95 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-700 to-blue-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[0.88rem] font-semibold text-foreground tracking-tight">SmartTatkalGuardian <span className="text-blue-400 font-normal">NOC</span></span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2 py-1 bg-surface border border-border rounded-full text-[0.78rem] text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 text-white flex items-center justify-center text-[0.65rem] font-bold">
              {getInitials(user)}
            </div>
            <span className="pr-2">{user}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="px-3 py-1 border border-border rounded-md text-[0.75rem] text-muted-foreground hover:border-red-500 hover:text-red-500 transition-colors flex items-center gap-1.5"
          >
            Sign out <LogOut className="w-3 h-3" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex-[2] border-r border-border flex flex-col p-4 gap-4 overflow-hidden bg-background">
          <div className="grid grid-cols-4 gap-3 shrink-0">
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
              <span className="text-[0.7rem] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total Requests</span>
              <motion.span key={stats.total} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</motion.span>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
              <span className="text-[0.7rem] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Bots Blocked</span>
              <motion.span key={stats.blocked} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-red-500">{stats.blocked.toLocaleString()}</motion.span>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
              <span className="text-[0.7rem] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Humans Passed</span>
              <motion.span key={stats.passed} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-green-500">{stats.passed.toLocaleString()}</motion.span>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
              <span className="text-[0.7rem] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Honeypot Caught</span>
              <motion.span key={stats.honey} initial={{ opacity: 0.5, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-yellow-500">{stats.honey.toLocaleString()}</motion.span>
            </div>
          </div>

          <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border bg-[#0a0f1a] flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Request Feed</span>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-500">ALLOW</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500">BLOCK</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500">HONEY</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-[0.75rem] flex flex-col gap-1.5 custom-scrollbar">
              <AnimatePresence initial={false}>
                {requests.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-3 p-2 rounded-md border ${
                      req.type === 'ALLOW' ? 'bg-green-500/5 border-green-500/10' :
                      req.type === 'BLOCK' ? 'bg-red-500/5 border-red-500/10' :
                      'bg-yellow-500/5 border-yellow-500/10'
                    }`}
                  >
                    <span className="text-muted-foreground w-20 shrink-0">{req.timestamp}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[0.65rem] font-bold w-12 text-center shrink-0 ${
                      req.type === 'ALLOW' ? 'bg-green-500/20 text-green-500' :
                      req.type === 'BLOCK' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {req.type}
                    </span>
                    <span className="text-foreground w-16">{req.user_id}</span>
                    <span className="text-muted-foreground w-20">{req.train_id}</span>
                    <span className="text-muted-foreground w-20">{req.route}</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="text-muted-foreground">Score:</span>
                      <span className={`font-bold ${req.score > 70 ? 'text-red-500' : req.score > 40 ? 'text-yellow-500' : 'text-green-500'}`}>{req.score}</span>
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="h-48 bg-card border border-border rounded-xl p-3 flex flex-col shrink-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Bot Score Distribution</span>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto bg-surface/30">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">Simulation Controls</span>
              <div className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold flex items-center gap-1.5 uppercase ${isRunning ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-muted/10 text-muted-foreground border border-border'}`}>
                {isRunning && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                {isRunning ? 'Running' : 'Stopped'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  isRunning 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20' 
                    : 'bg-primary text-white hover:bg-blue-600 shadow-[0_2px_10px_rgba(59,130,246,0.3)]'
                }`}
                data-testid="button-toggle-simulation"
              >
                {isRunning ? <><Square className="w-4 h-4" fill="currentColor" /> Stop Simulation</> : <><Play className="w-4 h-4" fill="currentColor" /> Start Simulation</>}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[0.75rem]">
                <span className="text-muted-foreground">Requests Per Second (RPS)</span>
                <span className="font-bold text-foreground">{rps}</span>
              </div>
              <input 
                type="range" 
                min="1" max="50" 
                value={rps} 
                onChange={(e) => setRps(Number(e.target.value))}
                className="w-full accent-primary"
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Agent Status</span>
            {[
              { name: "Booking Behavior", icon: Activity, processed: stats.total },
              { name: "Bot Scorer", icon: Target, processed: stats.total },
              { name: "Honeypot", icon: Database, processed: stats.honey },
              { name: "Blacklist Manager", icon: Ban, processed: stats.blocked },
              { name: "Fairness Monitor", icon: Scale, processed: stats.total }
            ].map(agent => (
              <div key={agent.name} className="bg-card border border-border rounded-lg p-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <agent.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8rem] font-semibold text-foreground truncate">{agent.name}</div>
                  <div className="text-[0.65rem] text-muted-foreground">Processed: {agent.processed.toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-[0.6rem] text-green-500 font-bold uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> ACTIVE
                  </div>
                  <div className="text-[0.6rem] text-muted-foreground font-mono">{new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-4 min-h-[300px]">
            <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
              <div className="p-2 border-b border-border bg-[#0a0f1a] text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
                Recent Blacklist
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-[0.7rem] flex flex-col gap-1 custom-scrollbar">
                {blacklist.length === 0 ? (
                  <div className="text-muted-foreground text-center p-4">No IPs blacklisted yet</div>
                ) : (
                  blacklist.map((entry, i) => (
                    <div key={i} className="flex justify-between items-center p-1.5 hover:bg-surface rounded">
                      <span className="text-red-400">{entry.ip}</span>
                      <span className="text-muted-foreground">{entry.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
              <div className="p-2 border-b border-border bg-[#0a0f1a] text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
                Honeypot Log
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-[0.7rem] flex flex-col gap-1 custom-scrollbar">
                {honeypotLog.length === 0 ? (
                  <div className="text-muted-foreground text-center p-4">No traps triggered yet</div>
                ) : (
                  honeypotLog.map((entry, i) => (
                    <div key={i} className="flex justify-between items-center p-1.5 hover:bg-surface rounded gap-2">
                      <span className="text-yellow-500 truncate">{entry.fake_slot_id}</span>
                      <span className="text-muted-foreground shrink-0">{entry.ip}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2d3f55; }
      `}} />
    </div>
  );
}
