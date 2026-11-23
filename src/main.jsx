import React, { lazy, Suspense, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './merge.css'

// courses.skyeyetechnology.in serves the standalone courses site from this
// same build. Locally (or anywhere), add ?courses to the URL to preview it.
const CoursesSite = lazy(() => import('./courses/CoursesSite.jsx'))
const isCourses = window.location.hostname.startsWith('courses.') || new URLSearchParams(window.location.search).has('courses')

// The KIIT MUN spin-the-wheel: #/spin (players, via the stall's QR code) and
// #/spin-admin (stall team). Full-screen apps of their own, loaded on demand.
const PlayPage = lazy(() => import('./spin/PlayPage.jsx'))
const AdminApp = lazy(() => import('./spin/AdminApp.jsx'))
const spinRoute = () => {
  const p = window.location.hash.replace(/^#/, '').split('?')[0].replace(/\/$/, '')
  return p === '/spin' ? 'play' : p === '/spin-admin' ? 'admin' : null
}

function Root() {
  const [spin, setSpin] = useState(spinRoute)
  useEffect(() => {
    const on = () => setSpin(spinRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  if (isCourses) {
    return (
      <Suspense fallback={null}>
        <CoursesSite />
      </Suspense>
    )
  }
  if (spin) {
    return (
      <Suspense fallback={<div className="sw-app" />}>
        {spin === 'play' ? <PlayPage /> : <AdminApp />}
      </Suspense>
    )
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
