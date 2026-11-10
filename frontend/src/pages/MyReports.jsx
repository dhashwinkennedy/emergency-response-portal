import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import { formatDate } from '../utils/formatters.js';
import { FileText, ArrowRight, Filter, Loader2, PlusCircle, AlertCircle } from 'lucide-react';

export default function MyReports() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (severityFilter) params.severity = severityFilter;

      const res = await api.getMyIncidents(params);
      setIncidents(res?.data?.incidents || []);
    } catch (err) {
      setError(err.message || 'Failed to load your emergency reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, categoryFilter, severityFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Emergency Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View status history and updates on all incidents you have filed
          </p>
        </div>
        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="Reported">Reported</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="Fire Emergency">Fire Emergency</option>
          <option value="Road Accident">Road Accident</option>
          <option value="Medical Emergency">Medical Emergency</option>
          <option value="Flood">Flood</option>
          <option value="Building Collapse">Building Collapse</option>
          <option value="Other Emergencies">Other Emergencies</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Severities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        {(statusFilter || categoryFilter || severityFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setCategoryFilter('');
              setSeverityFilter('');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      {/* Incidents List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading your reports...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">No emergency reports found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Any emergencies or SOS alerts you submit will appear here with live resolution status.
            </p>
            <div className="pt-2">
              <Link
                to="/citizen/report"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>File a Report</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Title / Category</th>
                  <th className="py-3 px-4">Date Reported</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {incidents.map((incident) => (
                  <tr key={incident._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {incident.incidentId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{incident.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {incident.category}
                        {incident.source === 'SOS' && (
                          <span className="ml-1.5 px-1 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                            SOS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatDate(incident.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/citizen/incidents/${incident.incidentId}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
