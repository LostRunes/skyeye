import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './merge.css'

// courses.skyeyetechnology.in serves the standalone courses site from this
// same build. Locally (or anywhere), add ?courses to the URL to preview it.
const CoursesSite = lazy(() => import('./courses/CoursesSite.jsx'))
const isCourses = window.location.hostname.startsWith('courses.') || new URLSearchParams(window.location.search).has('courses')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isCourses ? (
      <Suspense fallback={null}>
        <CoursesSite />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
