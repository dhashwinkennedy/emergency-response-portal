import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import IncidentMapViewer from '../components/IncidentMapViewer.jsx';
import AttachmentList from '../components/AttachmentList.jsx';
import { formatDate, formatCoordinates } from '../utils/formatters.js';
import { ArrowLeft, Clock, MapPin, Users, Phone, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';

export default function IncidentDetails() {
  const { incidentId } = useParams();
  const [incident, setIncident] = useState(null);
  const [history, setHistory] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [incRes, histRes, assignmentRes] = await Promise.all([
        api.getIncident(incidentId),
        api.getIncidentHistory(incidentId),
        api.getCitizenAssignments(incidentId),
      ]);
      setIncident(incRes?.data?.incident);
      setHistory(histRes?.data?.history || []);
      setAssignments(assignmentRes?.data?.assignments || []);
    } catch (err) {
      setError(err.message || 'Failed to load incident details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs text-slate-500">Loading incident details...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Unable to load incident</p>
            <p className="text-xs mt-0.5">{error || 'Incident was not found or you lack permission to view it.'}</p>
            <Link to="/citizen/my-reports" className="inline-block mt-3 text-xs font-bold text-red-800 underline">
              Back to My Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coordinates = incident.location?.coordinates;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Back link */}
      <div className="flex items-center justify-between">
        <Link
          to="/citizen/my-reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Reports</span>
        </Link>
        <span className="text-xs text-slate-500">
          Reported {formatDate(incident.createdAt)}
        </span>
      </div>

      {/* Main Incident Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {incident.incidentId}
              </span>
              {incident.source === 'SOS' && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">
                  SOS DISPATCH
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {incident.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Category: <span className="font-semibold text-slate-700">{incident.category}</span>
              {incident.subcategory && ` (${incident.subcategory})`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <SeverityBadge severity={incident.severity} className="text-sm px-3 py-1" />
            <StatusBadge status={incident.status} className="text-sm px-3 py-1" />
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Description
          </h2>
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-lg border border-slate-200">
            {incident.description || 'No detailed description provided with this alert.'}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Attachments</h2><AttachmentList incidentId={incident.incidentId} attachments={incident.attachments}/></div>
        <div className="border-t border-slate-200 pt-5"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Response Teams</h2>{assignments.length?<div className="mt-3 space-y-2">{assignments.map(a=><div key={a.id} className="rounded-lg border border-slate-200 p-3"><p className="text-sm font-bold">{a.team?.category} · {a.team?.teamName}</p><p className="mt-1 text-xs text-slate-600">Progress: <span className="font-semibold">{a.assignmentStatus}</span> · Assigned {formatDate(a.assignedAt)}</p></div>)}</div>:<p className="mt-2 text-sm text-slate-500">No response team has been assigned yet.</p>}<div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500"><span>Reported</span><span>→</span><span>Pending</span><span>→</span><span className={incident.status==='Assigned'||incident.status==='In Progress'||incident.status==='Resolved'?'text-violet-700':'opacity-50'}>Assigned</span><span>→</span><span className={incident.status==='In Progress'||incident.status==='Resolved'?'text-blue-700':'opacity-50'}>In Progress</span><span>→</span><span className={incident.status==='Resolved'?'text-emerald-700':'opacity-50'}>Resolved</span></div></div>

        {/* Location & Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Details column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Location
              </h3>
              <p className="text-xs font-medium text-slate-800">
                {incident.location?.address || 'Address not resolved'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {formatCoordinates(coordinates)} &bull; Source: {incident.location?.source || 'N/A'}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                People Affected
              </h3>
              <p className="text-xs font-semibold text-slate-800">
                {incident.peopleAffected !== undefined ? incident.peopleAffected : 'Unspecified'}
              </p>
            </div>

            {incident.contactInfo && (incident.contactInfo.name || incident.contactInfo.phone) && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  Contact on Record
                </h3>
                <p className="text-xs text-slate-800">
                  {incident.contactInfo.name} {incident.contactInfo.phone ? `(${incident.contactInfo.phone})` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Map Preview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Incident Map
            </h3>
            <IncidentMapViewer
              coordinates={coordinates}
              title={incident.title}
              severity={incident.severity}
              className="h-48"
            />
          </div>
        </div>
      </div>

      {/* Status History Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Status & Activity History</span>
        </h2>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No activity logged yet.</p>
        ) : (
          <div className="mt-4 relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((h, i) => (
              <div key={h._id || i} className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white"></div>
                <div className="text-xs font-semibold text-slate-800">
                  {h.action.replace(/_/g, ' ')}
                  {h.newValue && typeof h.newValue === 'string' && ` → ${h.newValue}`}
                </div>
                {h.reason && (
                  <p className="text-xs text-slate-600 mt-0.5 italic">"{h.reason}"</p>
                )}
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {formatDate(h.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
