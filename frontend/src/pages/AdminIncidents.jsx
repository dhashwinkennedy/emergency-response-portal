import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import { formatDate } from '../utils/formatters.js';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Download
} from 'lucide-react';

export default function AdminIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (severity) params.severity = severity;
      if (category) params.category = category;
      if (source) params.source = source;

      const res = await api.getAdminIncidents(params);
      setIncidents(res?.data?.incidents || []);
      if (res?.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, status, severity, category, source]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIncidents();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setSeverity('');
    setCategory('');
    setSource('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">All Emergency Incidents</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, triage, and manage emergency incident records across all sources
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Title or Ref ID (e.g. INC-2026-0001)..."
              className="w-full px-3 py-2 pl-9 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 mr-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter by:</span>
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Status: All</option>
            <option value="Reported">Reported</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Severity: All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Category: All</option>
            <option value="Fire Emergency">Fire Emergency</option>
            <option value="Road Accident">Road Accident</option>
            <option value="Medical Emergency">Medical Emergency</option>
            <option value="Flood">Flood</option>
            <option value="Building Collapse">Building Collapse</option>
            <option value="Other Emergencies">Other Emergencies</option>
          </select>

          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Source: All</option>
            <option value="NORMAL_REPORT">Normal Report</option>
            <option value="SOS">SOS Trigger</option>
          </select>

          {(status || severity || category || source || search) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      {/* Incident Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Fetching incident database records...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <p className="font-semibold text-slate-700">No matching incidents found</p>
            <p className="text-slate-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Title / Reporter</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {inc.source === 'SOS' && (
                          <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" title="SOS Emergency"></span>
                        )}
                        <span>{inc.incidentId}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">{inc.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {inc.userId?.fullName || 'Citizen'} {inc.userId?.phone ? `• ${inc.userId.phone}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-700">{inc.category || 'N/A'}</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 truncate" title={inc.location?.address}>
                        {inc.location?.address || (inc.location?.coordinates ? `${inc.location.coordinates[1]}, ${inc.location.coordinates[0]}` : 'Unavailable')}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={inc.severity} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(inc.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/incidents/${inc.incidentId}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <span>
              Showing page <span className="font-semibold">{meta.page}</span> of{' '}
              <span className="font-semibold">{meta.totalPages}</span> ({meta.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
