import React from 'react';

const statusStyles = {
  Reported: 'bg-slate-100 text-slate-700 border-slate-300',
  Pending: 'bg-amber-50 text-amber-800 border-amber-300',
  Assigned: 'bg-violet-50 text-violet-800 border-violet-300',
  'In Progress': 'bg-blue-50 text-blue-800 border-blue-300',
  Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-300',
};

export default function StatusBadge({ status, className = '' }) {
  const current = statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-300';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {status || 'Unknown'}
    </span>
  );
}
