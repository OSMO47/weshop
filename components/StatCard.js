// components/StatCard.js
import React from 'react';

// color: bootstrap color name (primary, success, warning, danger, info)
export default function StatCard({ title, value, icon, color = 'primary' }) {
  return (
    <div className={`card shadow-sm h-100 border-start border-${color} border-4`}>
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col">
            <div className={`text-xs fw-bold text-${color} text-uppercase mb-1`}>{title}</div>
            <div className="h5 mb-0 fw-bold text-gray-800">{value}</div>
          </div>
          <div className="col-auto">
            <i className={`fas ${icon} fa-2x text-gray-300`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}