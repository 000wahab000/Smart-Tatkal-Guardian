import React from 'react'

function Metric({ label, value, color }){
  return (
    <div className="card metric">
      <div>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
      </div>
      <div className="pct" style={{color}}></div>
    </div>
  )
}

export default function StatsPanel({ stats }){
  const total = stats.total || 0
  const pct = (n) => total === 0 ? '0%' : Math.round((n/total)*100) + '%'
  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontSize:16,fontWeight:700}}>Realtime Stats</div>
      </div>
      <Metric label="Total Requests" value={stats.total} color={null} />
      <Metric label="Genuine Allowed" value={`${stats.allowed} (${pct(stats.allowed)})`} color={'var(--allow)'} />
      <Metric label="In Honeypot" value={`${stats.honeypot} (${pct(stats.honeypot)})`} color={'var(--honeypot)'} />
      <Metric label="Blocked" value={`${stats.blocked} (${pct(stats.blocked)})`} color={'var(--block)'} />
      <Metric label="Bot Catch Rate" value={`${stats.bot_catch_rate}%`} color={'var(--block)'} />
      <Metric label="Genuine Success Rate" value={`${stats.genuine_success_rate}%`} color={'var(--allow)'} />
    </div>
  )
}
