import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Auto-set siteCode from URL query parameter
const urlParams = new URLSearchParams(window.location.search)
const siteCodeFromUrl = urlParams.get('siteCode')
if (siteCodeFromUrl) {
  localStorage.setItem('siteCode', siteCodeFromUrl.toUpperCase())
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
