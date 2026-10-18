import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import SessionPage from '../src/pages/SessionPage'
import '../src/index.css'
import '../src/styles/citadel.css'
import './style.css'

// Separate dev HTML entry: never imported by the authenticated production entry.
if (!import.meta.env.DEV || import.meta.env.MODE !== 'demo') throw new Error('The synthetic demo is development-only.')
const session = '11111111-1111-4111-8111-111111111111'
const queryClient = new QueryClient({defaultOptions:{queries:{retry:false}}})
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="demo-label" role="note">LOCAL SYNTHETIC DEMO · recorded facts · read-only API · no application AI calls</div>
    <div className="demo-session"><QueryClientProvider client={queryClient}><HashRouter><Routes>
      <Route path="/session/:sessionId" element={<SessionPage/>}/>
      <Route path="*" element={<Navigate to={'/session/'+session} replace/>}/>
    </Routes></HashRouter></QueryClientProvider></div>
  </React.StrictMode>,
)
