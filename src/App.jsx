import React, { useEffect, useState } from 'react'
import { fetchHello } from './api.client'

export default function App() {
  const [msg, setMsg] = useState('Loading…')
  useEffect(() => {
    fetchHello()
      .then((d) => setMsg(d.message || JSON.stringify(d)))
      .catch((err) => setMsg('Error: ' + err.message))
  }, [])
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>TAC — Vite + React</h1>
      <p>Backend message:</p>
      <pre>{msg}</pre>
      <p>
        Deploy targets: Cloudflare Pages (Functions) + Replit dev. Build with
        npm run build.
      </p>
    </div>
  )
}