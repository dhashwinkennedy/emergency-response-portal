import React from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { AlertTriangle, AlertCircle, Info, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AlertBanner() {
  const { alerts, dismissAlert } = useSocket();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0">
      {alerts.slice(0, 3).map((alert) => {
        const isCritical = alert.level === 'critical';
        return (
          <div
            key={alert.id}
            className={`flex items-start justify-between p-3.5 rounded-lg border shadow-lg transition-all ${
              isCritical
                ? 'bg-red-50 border-red-300 text-red-900 animate-bounce-short'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {isCritical ? (
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : alert.level === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                {alert.incidentId && (
                  <Link
                    to={
                      location.pathname.startsWith('/admin')
                        ? `/admin/incidents/${alert.incidentId}`
                        : `/citizen/incidents/${alert.incidentId}`
                    }
                    onClick={() => dismissAlert(alert.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 mt-1.5"
                  >
                    View Incident <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
