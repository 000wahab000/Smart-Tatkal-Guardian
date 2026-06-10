import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function RealtimeChart({ data }){
  const fmt = (t)=> new Date(t).toLocaleTimeString()
  return (
    <div className="card" style={{height:'100%'}}>
      <div style={{fontWeight:700,marginBottom:8}}>Traffic (last 30s)</div>
      <LineChart width={900} height={300} data={data} style={{background:'#161b22',borderRadius:6,padding:8}}>
        <CartesianGrid stroke="#1f262b" />
        <XAxis dataKey="t" tickFormatter={fmt} tick={{fill:'#9da6b0'}} />
        <YAxis tick={{fill:'#9da6b0'}} />
        <Tooltip labelFormatter={(v)=>fmt(v)} />
        <Line type="monotone" dataKey="bot" stroke="#f85149" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="genuine" stroke="#3fb950" dot={false} strokeWidth={2} />
      </LineChart>
    </div>
  )
}
