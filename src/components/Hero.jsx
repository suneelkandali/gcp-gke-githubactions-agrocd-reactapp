import React from 'react'

export default function Hero() {
  return (
    <div className="hero-container">
      <h1>🚀 React App Successfully Deployed! -- Deployed with GitHub actions and AgroCD ... Automated sync</h1>
      <p>Powered by <strong>GitHub Actions</strong> (CI) & <strong>ArgoCD</strong> (CD) running on <strong>GKE</strong>.</p>
      <div className="status-badge">
        <span className="dot"></span> GitOps Sync: Active
      </div>
    </div>
  )
}