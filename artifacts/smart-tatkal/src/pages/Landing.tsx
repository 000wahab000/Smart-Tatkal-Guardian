import React from "react";
import { Link } from "wouter";
import { Shield, Activity, Target, Database, Ban, Scale, ArrowRight, ShieldCheck } from "lucide-react";

const GlowOrbs = () => (
  <>
    <div className="fixed rounded-full blur-[120px] pointer-events-none z-0 opacity/12 w-[600px] h-[600px] bg-[#3b82f6] -top-[200px] -left-[100px]" />
    <div className="fixed rounded-full blur-[120px] pointer-events-none z-0 opacity/12 w-[400px] h-[400px] bg-[#06b6d4] top-[40%] -right-[100px]" />
    <div className="fixed rounded-full blur-[120px] pointer-events-none z-0 opacity/12 w-[300px] h-[300px] bg-[#22c55e] bottom-[10%] left-[20%]" />
  </>
);

const AnimatedGrid = () => (
  <div
    className="fixed inset-0 pointer-events-none z-0 opacity-20"
    style={{
      backgroundImage: `linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)`,
      backgroundSize: "60px 60px"
    }}
  />
);

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <AnimatedGrid />
      <GlowOrbs />

      <nav className="fixed top-0 left-0 right-0 z-50 px-12 h-16 flex items-center justify-between bg-background/80 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5 text-foreground hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-[0.95rem] font-semibold tracking-tight">Smart<span className="text-blue-400">Tatkal</span>Guardian</span>
        </Link>
        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="#how-it-works" className="text-muted-foreground hover:text-foreground text-[0.85rem] transition-colors tracking-wide">How it works</a></li>
          <li><a href="#agents" className="text-muted-foreground hover:text-foreground text-[0.85rem] transition-colors tracking-wide">Agents</a></li>
          <li><a href="#evidence" className="text-muted-foreground hover:text-foreground text-[0.85rem] transition-colors tracking-wide">Evidence</a></li>
        </ul>
        <div className="flex gap-2.5 items-center">
          <Link href="/login" className="px-4 py-1.5 border border-secondary rounded-md bg-transparent text-muted-foreground text-[0.82rem] hover:border-primary hover:text-foreground hover:bg-primary/10 transition-all">Sign in</Link>
          <Link href="/dashboard" className="px-4 py-1.5 border-none rounded-md bg-primary text-white text-[0.82rem] font-semibold flex items-center gap-1.5 hover:bg-blue-600 hover:-translate-y-px transition-all shadow-[0_4px_20px_rgba(59,130,246,0.4)]">Launch dashboard <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-8 pt-24 pb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/30 rounded-full text-xs text-blue-400 mb-8 bg-primary/5 tracking-wider uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_0_0_rgba(34,197,94,0.6)] animate-pulse" />
            FAR AWAY 2026 Hackathon · Team AlgoMinds
          </div>
          <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-tight mb-6 max-w-[900px]">
            Bots steal Tatkal tickets<br />
            <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-transparent bg-clip-text">in under 5 minutes.</span><br />
            We catch them first.
          </h1>
          <p className="text-[1.05rem] text-muted-foreground max-w-[540px] leading-relaxed mb-10">
            A real-time, AI-driven security operations center that monitors behavior, detects automated scripts, and deploys honeypots to protect genuine passengers.
          </p>
          <div className="flex gap-3.5 mb-20 flex-wrap justify-center">
            <Link href="/dashboard" className="px-8 py-3 rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 text-white text-[0.95rem] font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-[0_4px_24px_rgba(59,130,246,0.35)] tracking-tight">Launch Dashboard <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/login" className="px-8 py-3 border border-secondary rounded-lg bg-white/5 text-muted-foreground text-[0.95rem] font-medium hover:border-primary hover:text-foreground hover:-translate-y-0.5 transition-all">Agent Login</Link>
          </div>

          <div className="flex flex-col md:flex-row border border-border rounded-xl overflow-hidden bg-card/50 max-w-[800px] w-full backdrop-blur-sm">
            <div className="flex-1 p-6 text-center border-b md:border-b-0 md:border-r border-border">
              <div className="text-3xl font-extrabold tracking-tight leading-none mb-1 text-red-500">60B</div>
              <div className="text-xs text-muted-foreground leading-relaxed">bot requests<br/>blocked</div>
            </div>
            <div className="flex-1 p-6 text-center border-b md:border-b-0 md:border-r border-border">
              <div className="text-3xl font-extrabold tracking-tight leading-none mb-1 text-yellow-500">3.03Cr</div>
              <div className="text-xs text-muted-foreground leading-relaxed">suspicious IDs<br/>deactivated</div>
            </div>
            <div className="flex-1 p-6 text-center border-b md:border-b-0 md:border-r border-border">
              <div className="text-3xl font-extrabold tracking-tight leading-none mb-1 text-green-500">94%</div>
              <div className="text-xs text-muted-foreground leading-relaxed">genuine<br/>success rate</div>
            </div>
            <div className="flex-1 p-6 text-center">
              <div className="text-3xl font-extrabold tracking-tight leading-none mb-1 text-blue-400">23%</div>
              <div className="text-xs text-muted-foreground leading-relaxed">without<br/>protection</div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-12 max-w-[1100px] mx-auto">
          <div className="text-[0.7rem] tracking-[0.12em] uppercase text-blue-400 mb-3 font-semibold">How it works</div>
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold tracking-tight mb-4 max-w-[600px]">Three layers of defense.</h2>
          <p className="text-sm text-muted-foreground max-w-[500px] leading-relaxed mb-12">Our multi-agent system doesn't just block IPs; it analyzes behavior, sets traps, and dynamically adjusts to keep the booking window fair.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-7 relative overflow-hidden group hover:border-secondary hover:-translate-y-1 transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="text-[0.7rem] font-bold tracking-widest text-muted-foreground mb-4 uppercase">Phase 01</div>
              <Activity className="w-8 h-8 mb-4 text-blue-500" />
              <h3 className="text-base font-semibold mb-2 tracking-tight">Score</h3>
              <p className="text-[0.82rem] text-muted-foreground leading-[1.65]">Every request gets a bot score based on typing speed, mouse movement, and fingerprint uniqueness. High scores are flagged immediately.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-7 relative overflow-hidden group hover:border-secondary hover:-translate-y-1 transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="text-[0.7rem] font-bold tracking-widest text-muted-foreground mb-4 uppercase">Phase 02</div>
              <Database className="w-8 h-8 mb-4 text-yellow-500" />
              <h3 className="text-base font-semibold mb-2 tracking-tight">Honeypot</h3>
              <p className="text-[0.82rem] text-muted-foreground leading-[1.65]">We inject invisible fake Tatkal slots into the DOM. Humans can't see them. Bots parse the HTML and click them, instantly revealing themselves.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-7 relative overflow-hidden group hover:border-secondary hover:-translate-y-1 transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="text-[0.7rem] font-bold tracking-widest text-muted-foreground mb-4 uppercase">Phase 03</div>
              <ShieldCheck className="w-8 h-8 mb-4 text-green-500" />
              <h3 className="text-base font-semibold mb-2 tracking-tight">Protect</h3>
              <p className="text-[0.82rem] text-muted-foreground leading-[1.65]">Confirmed bots are blacklisted across the entire IRCTC network. Genuine users experience a seamless, fast booking flow with zero CAPTCHAs.</p>
            </div>
          </div>
        </section>

        <section id="agents" className="py-20 px-12 max-w-[1100px] mx-auto border-t border-border">
          <div className="text-[0.7rem] tracking-[0.12em] uppercase text-blue-400 mb-3 font-semibold">The Swarm</div>
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold tracking-tight mb-4 max-w-[600px]">Meet the Agents.</h2>
          <p className="text-sm text-muted-foreground max-w-[500px] leading-relaxed mb-10">Smart Tatkal Guardian uses a swarm of specialized AI agents working in tandem.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary hover:bg-[#131f35] transition-all">
              <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xs font-semibold mb-1 text-foreground">Booking Behavior</div>
              <div className="text-[0.68rem] text-muted-foreground leading-relaxed">Analyzes pacing & flows</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary hover:bg-[#131f35] transition-all">
              <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xs font-semibold mb-1 text-foreground">Bot Scorer</div>
              <div className="text-[0.68rem] text-muted-foreground leading-relaxed">Assigns 0-100 threat level</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary hover:bg-[#131f35] transition-all">
              <Database className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-xs font-semibold mb-1 text-foreground">Honeypot</div>
              <div className="text-[0.68rem] text-muted-foreground leading-relaxed">Manages invisible traps</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary hover:bg-[#131f35] transition-all">
              <Ban className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <div className="text-xs font-semibold mb-1 text-foreground">Blacklist</div>
              <div className="text-[0.68rem] text-muted-foreground leading-relaxed">Synchronizes blocked IPs</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary hover:bg-[#131f35] transition-all">
              <Scale className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-xs font-semibold mb-1 text-foreground">Fairness Monitor</div>
              <div className="text-[0.68rem] text-muted-foreground leading-relaxed">Ensures high genuine rate</div>
            </div>
          </div>
        </section>

        <section id="evidence" className="py-20 px-12 max-w-[1100px] mx-auto border-t border-border">
          <div className="text-[0.7rem] tracking-[0.12em] uppercase text-blue-400 mb-3 font-semibold">The Proof</div>
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold tracking-tight mb-4 max-w-[600px]">Irrefutable Evidence.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
            <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-r-xl p-5 flex gap-3 items-start text-[0.83rem] text-muted-foreground leading-relaxed hover:border-l-cyan-500 transition-colors">
              <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>IP 103.45.XX.XX attempted 400 requests in 2 seconds. Bot Scorer flagged 99/100. Blocked.</span>
            </div>
            <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-r-xl p-5 flex gap-3 items-start text-[0.83rem] text-muted-foreground leading-relaxed hover:border-l-cyan-500 transition-colors">
              <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>User ID TATKAL_KING clicked hidden train slot 12903_FAKE. Honeypot agent flagged instantly.</span>
            </div>
            <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-r-xl p-5 flex gap-3 items-start text-[0.83rem] text-muted-foreground leading-relaxed hover:border-l-cyan-500 transition-colors">
              <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>Mouse tracking showed perfectly linear movements to the "Book Now" button on 50 sessions. Blocked.</span>
            </div>
            <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-r-xl p-5 flex gap-3 items-start text-[0.83rem] text-muted-foreground leading-relaxed hover:border-l-cyan-500 transition-colors">
              <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>Form filled in 12ms (human average: 4500ms). Agent Booking Behavior intercepted the payload.</span>
            </div>
          </div>
        </section>

        <section className="text-center py-24 px-8 border-t border-border relative z-10">
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold tracking-tight mb-4">See it work live.</h2>
          <p className="text-muted-foreground text-[0.95rem] mb-10 max-w-[400px] mx-auto leading-relaxed">
            Experience the real-time detection engine. We simulate 100s of requests to show the agents in action.
          </p>
          <Link href="/dashboard" className="inline-flex px-8 py-3 rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 text-white text-[0.95rem] font-bold items-center gap-2 hover:-translate-y-0.5 transition-all shadow-[0_4px_24px_rgba(59,130,246,0.35)] tracking-tight">Launch Dashboard <ArrowRight className="w-4 h-4" /></Link>
        </section>
      </main>

      <footer className="border-t border-border py-6 px-12 flex items-center justify-between text-[0.78rem] text-muted-foreground relative z-10">
        <div className="flex items-center gap-2 font-semibold text-muted-foreground/80">
          <Shield className="w-4 h-4" />
          SmartTatkalGuardian
        </div>
        <div>Hackathon Demo · Team AlgoMinds</div>
      </footer>
    </div>
  );
}
