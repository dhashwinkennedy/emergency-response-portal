import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Loader2, 
  MapPin, 
  Cpu, 
  TrendingUp,
  Radio
} from 'lucide-react';

export default function AdminDashboard() {
  const { latestEvent } = useSocket();
  const [summary, setSummary] = useState(null);
  const [teams, setTeams] = useState([]);
  const [operations,setOperations]=useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError('');
    try {
      const [res,teamRes,operationsRes] = await Promise.all([api.getDashboardSummary(),api.getTeams(),api.getOperationsSummary()]);
      setSummary(res?.data || null);
      setTeams(teamRes?.data?.teams||[]);
      setOperations(operationsRes?.data||{});
    } catch (err) {
      setError(err.message || 'Failed to load summary stats');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Real-time update when an incident or SOS event happens
  useEffect(() => {
    if (latestEvent) {
      fetchSummary();
    }
  }, [latestEvent]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Incident Management Dashboard</span>
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live System
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational overview of live incidents, severity tiers, and category distribution
          </p>
        </div>

        <button
          onClick={() => fetchSummary(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs text-slate-500">Compiling live summary data...</span>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Reported */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Incidents</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.total ?? 0}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Past 24 hours: <span className="font-semibold text-slate-700">{summary?.recent ?? 0}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
            </div>

            {/* Critical Incidents */}
            <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600">Critical Priority</p>
                <p className="text-2xl font-extrabold text-red-700 mt-1">{summary?.critical ?? 0}</p>
                <p className="text-[11px] text-red-500 mt-0.5 font-medium">Immediate action needed</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Review</p>
                <p className="text-2xl font-extrabold text-amber-700 mt-1">{summary?.pending ?? 0}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  In progress: <span className="font-semibold text-blue-600">{summary?.inProgress ?? 0}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Active workload. The backend summary currently does not return a resolved count. */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active workload</p>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                  {(summary?.pending ?? 0) + (summary?.inProgress ?? 0) + (operations?.assigned ?? 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Assigned: {operations?.assigned||0} · Resolved: {operations?.resolved||0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Panels */}
          <div className="rounded-xl border bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Response Team Readiness</h2><p className="mt-1 text-xs text-slate-500">Actual team availability from current MongoDB records.</p></div><Link to="/admin/teams" className="text-xs font-bold text-blue-700">Manage teams</Link></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-bold">{teams.length}</p></div><div><p className="text-xs text-slate-500">Available</p><p className="text-xl font-bold text-emerald-700">{teams.filter(t=>t.availabilityStatus==='Available').length}</p></div><div><p className="text-xs text-slate-500">Busy</p><p className="text-xl font-bold text-amber-700">{teams.filter(t=>t.availabilityStatus==='Busy').length}</p></div><div><p className="text-xs text-slate-500">Off duty</p><p className="text-xl font-bold text-slate-700">{teams.filter(t=>t.availabilityStatus==='Off Duty').length}</p></div></div></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/incidents"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-colors group flex items-start justify-between"
            >
              <div>
                <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Incident Triage Table
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage statuses, adjust severities, review citizen notes, and resolve incidents.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-0.5" />
            </Link>

            <Link
              to="/admin/map"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-colors group flex items-start justify-between"
            >
              <div>
                <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Incident Geo Map
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Interactive Geoapify spatial map, incident bounding box queries and hotspot clusters.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-0.5" />
            </Link>

            <Link
              to="/admin/ai-review"
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-colors group flex items-start justify-between"
            >
              <div>
                <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  AI Review Queue
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Examine automated consistency assessments, missing data checks, and duplicate warnings.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-0.5" />
            </Link>
          </div>

          {/* Incident Category Breakdown using simple CSS bars (No bulky chart libraries) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Incidents by Emergency Category
              </h2>
              <span className="text-xs text-slate-500">
                Total: {summary?.total ?? 0}
              </span>
            </div>

            {(!summary?.byCategory || summary.byCategory.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">No categorized incident data recorded yet.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {summary.byCategory.map((cat) => {
                  const count = cat.count || 0;
                  const total = summary.total || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={cat._id || 'other'} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {cat._id || 'Uncategorized'}
                        </span>
                        <span className="text-slate-500 font-medium">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
