import React from 'react'

export default function Header({ running, demoMode, onStart, onStop, onReset, rps }){
  return (
    <header className="card header">
      <div className="title"><span className="shield">🛡️</span> Smart Tatkal Guardian</div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div className="status-badge">{demoMode? 'DEMO MODE':'LIVE'} <span className="pulse" style={{marginLeft:6}}></span></div>
      </div>
      <div className="ctrls">
        <div className="buttons">
          <button type="button" className="btn" onClick={() => { console.log('HEADER START CLICK'); onStart && onStart() }}>Start Simulation</button>
          <button type="button" className="btn" onClick={() => { console.log('HEADER STOP CLICK'); onStop && onStop() }}>Stop Simulation</button>
          <button type="button" className="btn" onClick={() => { console.log('HEADER RESET CLICK'); onReset && onReset() }}>Reset Demo</button>
        </div>
        <div className="small">RPS: {rps ?? 0}</div>
      </div>
    </header>
  )
}
