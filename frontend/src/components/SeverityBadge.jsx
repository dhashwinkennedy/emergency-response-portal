import React from 'react';

const severityStyles = {
  Low: 'bg-slate-100 text-slate-700 border-slate-300',
  Medium: 'bg-amber-50 text-amber-800 border-amber-300',
  High: 'bg-orange-50 text-orange-800 border-orange-300',
  Critical: 'bg-red-50 text-red-700 border-red-300 font-semibold animate-pulse',
};

export default function SeverityBadge({ severity, className = '' }) {
  const current = severityStyles[severity] || 'bg-slate-100 text-slate-700 border-slate-300';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${current} ${className}`}
    >
      {severity === 'Critical' && (
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-600"></span>
      )}
      {severity || 'Unknown'}
    </span>
  );
}
