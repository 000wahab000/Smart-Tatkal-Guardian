import React from 'react'

export default function HoneypotLog({ logs }){
  return (
    <div className="honeypot-log">
      {logs.map((l,idx)=> <div key={idx} className="honeypot-item">{l}</div>)}
    </div>
  )
}
