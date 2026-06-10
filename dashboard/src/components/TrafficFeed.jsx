import React, { useEffect, useRef } from 'react'

function Row({ ev }){
  const cls = ev.action === 'ALLOW' ? 'allow-row' : ev.action === 'HONEYPOT' ? 'honeypot-row' : 'block-row'
  const badge = ev.action === 'ALLOW' ? 'action-allow' : ev.action === 'HONEYPOT' ? 'action-honeypot' : 'action-block'
  return (
    <div className={`traffic-row ${cls} new`}>
      <div>{new Date(ev.time).toLocaleTimeString()}</div>
      <div>{ev.user_id}</div>
      <div>
        <div className="progress"><i style={{width: `${Math.round(ev.bot_probability*100)}%`, background: ev.action==='ALLOW' ? 'var(--allow)' : ev.action==='HONEYPOT' ? 'var(--honeypot)' : 'var(--block)'}}></i></div>
      </div>
      <div><span className={`action-badge ${badge}`}>{ev.action}</span></div>
      <div>{(ev.flags || []).join(', ')}</div>
    </div>
  )
}

export default function TrafficFeed({ events }){
  const ref = useRef(null)
  useEffect(()=>{ if(ref.current) ref.current.scrollTop = 0 },[events])
  return (
    <div className="card" style={{height:'100%',display:'flex',flexDirection:'column'}}>
      <div style={{fontWeight:700,marginBottom:8}}>Live Traffic Feed</div>
      <div ref={ref} style={{overflow:'auto'}}>
        {events.map((e,idx)=> <Row key={e.time + '-' + idx} ev={e} />)}
      </div>
    </div>
  )
}
