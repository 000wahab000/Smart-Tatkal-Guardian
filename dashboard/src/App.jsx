import React, { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import StatsPanel from './components/StatsPanel'
import RealtimeChart from './components/RealtimeChart'
import TrafficFeed from './components/TrafficFeed'
import HoneypotLog from './components/HoneypotLog'
import './App.css'

const WS_URL = 'ws://localhost:8000/ws/events'

function genUserId(){
  return 'USR_' + Math.random().toString(36).slice(2,6).toUpperCase()
}

function randomFlags(){
  const pool = ['RAPID_FIRE','SHARED_IP','NO_MOUSE','PASTE_INPUT','BOT_UA']
  const n = Math.random() < 0.4 ? 1 : Math.random() < 0.2 ? 2 : 0
  if(n===0) return []
  const out = []
  while(out.length < n){
    const f = pool[Math.floor(Math.random()*pool.length)]
    if(!out.includes(f)) out.push(f)
  }
  return out
}

export default function App(){
  const [running, setRunning] = useState(false)
  const [demoMode, setDemoMode] = useState(true)
  const [stats, setStats] = useState({ total:0, allowed:0, honeypot:0, blocked:0, genuine_success_rate:0, bot_catch_rate:0 })
  const [events, setEvents] = useState([])
  const [honeypotLog, setHoneypotLog] = useState([])
  const [chartData, setChartData] = useState(() => Array.from({length:30}).map((_,i)=>({t:Date.now()-((29-i)*1000), bot:0, genuine:0})))

  const wsRef = useRef(null)
  const mockRef = useRef(null)

  useEffect(()=>{
    // Try connect WebSocket
    let ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onopen = ()=>{
      console.log('WS open')
      setDemoMode(false)
    }
    ws.onmessage = (ev)=>{
      console.log('WS msg', ev.data)
      try{ const d = JSON.parse(ev.data); handleEvent(d) }catch(e){ }
    }
    ws.onerror = (e)=>{ console.log('WS error', e); ws.close(); setDemoMode(true) }
    ws.onclose = ()=>{ console.log('WS closed'); setDemoMode(true) }

    // fallback to demo mode if no open after 1s
    const t = setTimeout(()=>{
      if(ws.readyState !== WebSocket.OPEN) setDemoMode(true)
    }, 1000)

    return ()=>{ clearTimeout(t); if(ws) ws.close() }
  },[])

  useEffect(()=>{
    // chart tick every second
    const id = setInterval(()=>{
      setChartData(prev=>{
        const now = Date.now()
        const bot = events.slice(-100).filter(e=>e.action!=='ALLOW' && (now - e.time) < 1000).length
        const genuine = events.slice(-100).filter(e=>e.action==='ALLOW' && (now - e.time) < 1000).length
        const next = prev.slice(1)
        next.push({ t: now, bot, genuine })
        return next
      })
    },1000)
    return ()=>clearInterval(id)
  },[events])

  useEffect(()=>{
    // keyboard space toggles start/stop
    const onKey = (e)=>{ if(e.code === 'Space'){ e.preventDefault(); running? stop(): start() } }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  },[running])

  function updateStatsWith(ev){
    setStats(s=>{
      const total = s.total + 1
      const allowed = s.allowed + (ev.action==='ALLOW'?1:0)
      const honeypot = s.honeypot + (ev.action==='HONEYPOT'?1:0)
      const blocked = s.blocked + (ev.action==='BLOCK'?1:0)
      const genuine_success_rate = allowed === 0 ? 0 : Math.round((allowed/total)*100)
      const bot_catch_rate = (blocked + honeypot) === 0 ? 0 : Math.round(((blocked+honeypot)/total)*100)
      return { total, allowed, honeypot, blocked, genuine_success_rate, bot_catch_rate }
    })
  }

  function handleEvent(ev){
    // ev: { type, user_id, action, bot_probability, flags, time }
    const e = { time: ev.time ?? Date.now(), user_id: ev.user_id, action: ev.action, bot_probability: ev.bot_probability, flags: ev.flags || [] }
    setEvents(prev=>{
      const next = [e,...prev].slice(0,50)
      return next
    })
    if(e.action === 'HONEYPOT'){
      const msg = `[${new Date(e.time).toLocaleTimeString()}] ${e.user_id} → Shown fake slot`
      setHoneypotLog(l=>[msg,...l].slice(0,200))
    }
    if(e.action === 'BLOCK'){
      const msg = `[${new Date(e.time).toLocaleTimeString()}] ${e.user_id} → CONFIRMED BOT ←`
      setHoneypotLog(l=>[msg,...l].slice(0,200))
    }
    updateStatsWith(e)
  }

  function start(){
    console.log('START CLICKED')
    setRunning(true)
    // start mock generator immediately; interval itself doesn't rely on stale `running` value
    if(demoMode) startMock()
  }
  function stop(){
    console.log('STOP CLICKED')
    setRunning(false)
    stopMock()
  }

  function startMock(){
    if(mockRef.current) return
    mockRef.current = setInterval(()=>{
      const isBot = Math.random() < 0.8
      const action = isBot ? (Math.random()<0.6? 'HONEYPOT':'BLOCK') : 'ALLOW'
      const bot_probability = isBot ? (0.6 + Math.random()*0.4) : (Math.random()*0.3)
      const ev = { type:'event', user_id: genUserId(), action, bot_probability: Number(bot_probability.toFixed(2)), flags: randomFlags(), time: Date.now() }
      handleEvent(ev)
    },200)
  }
  function stopMock(){
    if(mockRef.current){ clearInterval(mockRef.current); mockRef.current = null }
  }

  function resetDemo(){
    setStats({ total:0, allowed:0, honeypot:0, blocked:0, genuine_success_rate:0, bot_catch_rate:0 })
    setEvents([])
    setHoneypotLog([])
    setChartData(Array.from({length:30}).map((_,i)=>({t:Date.now()-((29-i)*1000), bot:0, genuine:0})))
  }

  return (
    <div className="app-root">
      <Header running={running} demoMode={demoMode} onStart={start} onStop={stop} onReset={resetDemo} rps={chartData.slice(-1)[0]?.bot + chartData.slice(-1)[0]?.genuine} />
      <div className="content">
        <main className="main-area">
          <div className="top-half">
            <RealtimeChart data={chartData} />
          </div>
          <div className="bottom-half">
            <TrafficFeed events={events} />
          </div>
        </main>
        <aside className="stats-side">
          <StatsPanel stats={stats} />
        </aside>
      </div>
      <footer className="honeypot-strip">
        <HoneypotLog logs={honeypotLog} />
      </footer>
    </div>
  )
}
