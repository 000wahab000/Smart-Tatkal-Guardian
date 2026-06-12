import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Shield, CheckCircle2, AlertTriangle, Bug, ArrowLeft } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const demoAccounts = [
    { role: "Admin", email: "admin@tatkal.dev", pass: "admin123" },
    { role: "Viewer", email: "viewer@tatkal.dev", pass: "viewer123" },
    { role: "AlgoMinds", email: "demo@algominds.in", pass: "demo2026" },
    { role: "Judge", email: "judge@faraway.io", pass: "faraway26" }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = demoAccounts.some(acc => acc.email === email && acc.pass === password);
    if (isValid) {
      localStorage.setItem("tatkal_user", email);
      setLocation("/dashboard");
    } else {
      setError(true);
    }
  };

  const handleTabClick = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError(false);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col md:flex-row">
      <div className="flex-1 bg-surface border-r border-border p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />
        
        <div className="flex items-center gap-2.5 text-base font-bold tracking-tight">
          <div className="w-[38px] h-[38px] bg-gradient-to-br from-blue-700 to-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_24px_rgba(59,130,246,0.4)]">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span>SmartTatkalGuardian</span>
        </div>

        <div className="flex-1 flex flex-col justify-center py-8">
          <h2 className="text-[2.2rem] font-extrabold tracking-tight leading-[1.15] mb-4">
            Real-time bot detection for <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-clip-text">Tatkal tickets.</span>
          </h2>
          <p className="text-[0.88rem] text-muted-foreground leading-relaxed max-w-[380px] mb-10">
            Secure the IRCTC booking window. Monitor active threats, analyze bot scores, and trap malicious agents instantly.
          </p>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-[0.82rem]">
              <Bug className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-muted-foreground">Bots caught today</span>
              <span className="ml-auto font-bold text-[0.9rem] text-red-500">800/1000</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-[0.82rem]">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-muted-foreground">Genuine success rate</span>
              <span className="ml-auto font-bold text-[0.9rem] text-green-500">94%</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-[0.82rem]">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
              <span className="text-muted-foreground">Honeypot flagged</span>
              <span className="ml-auto font-bold text-[0.9rem] text-yellow-500">47</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          Internal Security Operations Center
        </div>
      </div>

      <div className="flex-1 p-16 flex flex-col items-center justify-center relative">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="inline-flex items-center gap-1.5 text-muted-foreground text-[0.82rem] hover:text-foreground transition-colors mb-10">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>

          <h3 className="text-[1.6rem] font-bold tracking-tight mb-1.5">Welcome back</h3>
          <p className="text-[0.83rem] text-muted-foreground mb-8">Select a demo account to enter the dashboard.</p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleTabClick(acc)}
                className={`p-3 rounded-lg border text-left transition-all ${email === acc.email ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-primary hover:bg-primary/5'}`}
                data-testid={`tab-${acc.role.toLowerCase()}`}
              >
                <div className="text-[0.68rem] text-muted-foreground tracking-widest uppercase mb-1">{acc.role}</div>
                <div className="text-[0.78rem] text-foreground font-mono">{acc.email}</div>
                <div className="text-[0.7rem] text-muted-foreground mt-0.5">pwd: {acc.pass}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 my-5 text-[0.75rem] text-muted-foreground before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
            or enter manually
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.78rem] text-muted-foreground tracking-wide">Email address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2.5 bg-[#0a0f1a] border border-secondary rounded-lg text-foreground text-[0.88rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="agent@tatkal.dev"
                data-testid="input-email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.78rem] text-muted-foreground tracking-wide">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2.5 bg-[#0a0f1a] border border-secondary rounded-lg text-foreground text-[0.88rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                data-testid="input-password"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[0.78rem] text-red-400 mt-2">
                Invalid credentials. Please select a demo account above.
              </div>
            )}

            <button 
              type="submit"
              className="w-full p-3 bg-gradient-to-br from-blue-700 to-blue-500 text-white rounded-lg text-[0.92rem] font-bold mt-2 hover:-translate-y-px transition-transform shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_28px_rgba(59,130,246,0.45)]"
              data-testid="button-submit"
            >
              Sign in to dashboard
            </button>
          </form>

          <div className="text-center text-[0.72rem] text-muted-foreground mt-5">
            Internal use only. Monitored session.
          </div>
        </div>
      </div>
    </div>
  );
}
