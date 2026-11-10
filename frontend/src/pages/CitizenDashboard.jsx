import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate } from '../utils/formatters.js';
import { 
  AlertTriangle, 
  PhoneCall, 
  PlusCircle, 
  FileText, 
  CheckCircle, 
  Loader2, 
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  // SOS state
  const [sosActive, setSosActive] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosError, setSosError] = useState('');
  const [createdSos, setCreatedSos] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpSaving, setFollowUpSaving] = useState(false);

  // Follow-up form fields
  const [followUpCategory, setFollowUpCategory] = useState('Medical Emergency');
  const [followUpPeople, setFollowUpPeople] = useState('1');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const holdTimerRef = useRef(null);

  // Load recent reports
  const fetchRecent = async () => {
    try {
      const res = await api.getMyIncidents({ limit: 5 });
      setRecentIncidents(res?.data?.incidents || []);
    } catch (e) {
      console.warn('Failed to fetch citizen incidents:', e);
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  // SOS Press & Hold Trigger
  const startHold = () => {
    if (sosLoading || createdSos) return;
    setSosProgress(0);
    const startTime = Date.now();
    const duration = 1800; // 1.8 seconds hold

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setSosProgress(pct);

      if (pct >= 100) {
        clearInterval(holdTimerRef.current);
        triggerSos();
      }
    }, 50);
  };

  const endHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (sosProgress < 100) {
      setSosProgress(0);
    }
  };

  // Direct confirmation modal trigger (alternative to press-and-hold)
  const triggerSos = async () => {
    setSosLoading(true);
    setSosError('');
    setSosProgress(0);

    let locationPayload = undefined;

    // Quick GPS location attempt
    try {
      if (navigator.geolocation) {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 4000,
            enableHighAccuracy: true,
          });
        });
        const lon = Number(pos.coords.longitude.toFixed(6));
        const lat = Number(pos.coords.latitude.toFixed(6));
        locationPayload = {
          coordinates: [lon, lat],
          source: 'GPS',
          accuracyMeters: Math.round(pos.coords.accuracy) || 10,
        };
      }
    } catch (geoErr) {
      // Non-blocking: SOS must submit even without GPS
      console.warn('GPS capture failed during SOS:', geoErr);
    }

    try {
      const payload = {
        title: 'Emergency SOS Alert',
        idempotencyKey: `sos-${user?.id}-${Date.now()}`,
      };
      if (locationPayload) {
        payload.location = locationPayload;
      }
      if (user?.phone || user?.fullName) {
        payload.contactInfo = {
          name: user.fullName,
          phone: user.phone || '',
        };
      }

      const res = await api.createSos(payload);
      const incident = res?.data?.incident;
      setCreatedSos(incident);
      setShowFollowUp(true);
      fetchRecent();
    } catch (err) {
      setSosError(err.message || 'Failed to submit SOS alert. Please dial 112 directly.');
    } finally {
      setSosLoading(false);
    }
  };

  // Save follow-up optional details
  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!createdSos?.incidentId) return;

    setFollowUpSaving(true);
    try {
      await api.updateSosDetails(createdSos.incidentId, {
        category: followUpCategory,
        peopleAffected: Number(followUpPeople) || 0,
        description: followUpNotes || 'Citizen provided follow-up details',
      });
      setShowFollowUp(false);
      fetchRecent();
    } catch (err) {
      setSosError(err.message || 'Failed to save additional details.');
    } finally {
      setFollowUpSaving(false);
    }
  };

  const handleSkipFollowUp = () => {
    setShowFollowUp(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome & Emergency Call banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome, {user?.fullName || 'Citizen'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Emergency Response & Incident Management System
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href="tel:112"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 112 (Police / Fire / EMS)</span>
          </a>
        </div>
      </div>

      {/* Notice about 112 vs Platform SOS */}
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Important notice:</span> Platform SOS creates an emergency incident in our system and dispatches digital alerts to response operators. It does not automatically place a telephone call to emergency services. If you require immediate telephone dispatch, use the <strong>Call 112</strong> button.
        </p>
      </div>

      {/* SOS Incident Confirmation Banner if recently activated */}
      {createdSos && !showFollowUp && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold">SOS Emergency Transmitted Successfully</h2>
              <p className="text-xs text-emerald-800 mt-1">
                Incident Reference: <span className="font-mono font-bold text-slate-900">{createdSos.incidentId}</span> &bull; Status: <span className="font-semibold text-emerald-700">{createdSos.status || 'Reported'}</span>
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Response administrators have received your alert and GPS coordinates.
              </p>
            </div>
          </div>
          <Link
            to={`/citizen/incidents/${createdSos.incidentId}`}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
          >
            Track Incident
          </Link>
        </div>
      )}

      {/* Main Action Grid: SOS Button & Standard Report Button */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prominent SOS Card */}
        <div className="bg-white rounded-xl border-2 border-red-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Critical Assistance
              </span>
            </div>
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>

          <div className="my-6 text-center">
            <h2 className="text-xl font-bold text-slate-900">Emergency SOS</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Hold the button for 2 seconds to immediately broadcast your GPS location to emergency responders.
            </p>

            {/* Deliberate Press-and-Hold Button */}
            <div className="mt-5 flex flex-col items-center justify-center">
              <button
                type="button"
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                disabled={sosLoading}
                className="relative group w-36 h-36 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-2xl tracking-wider shadow-lg flex flex-col items-center justify-center select-none transition-transform active:scale-95 disabled:opacity-50"
              >
                {sosLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <span>SOS</span>
                    <span className="text-[10px] font-normal tracking-normal opacity-90 mt-1">
                      {sosProgress > 0 ? `${sosProgress}%` : 'Hold 2s'}
                    </span>
                  </>
                )}

                {/* Circular / Ring Progress indicator */}
                {sosProgress > 0 && (
                  <div
                    className="absolute inset-0 rounded-full border-4 border-white opacity-80 transition-all pointer-events-none"
                    style={{ transform: `scale(${1 + sosProgress / 400})` }}
                  />
                )}
              </button>

              {/* Instant One-Click Confirmation Fallback */}
              <button
                type="button"
                onClick={() => setSosActive(true)}
                className="mt-3 text-xs text-red-600 hover:text-red-800 font-semibold underline underline-offset-2"
              >
                Or tap here to confirm SOS
              </button>
            </div>
          </div>

          {sosError && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200 text-center font-medium">
              {sosError}
            </div>
          )}

          <div className="text-[11px] text-slate-400 text-center">
            Zero-delay dispatch &bull; Transmits coordinates automatically
          </div>
        </div>

        {/* Normal Emergency Report Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Detailed Reporting
              </span>
              <FileText className="w-6 h-6 text-blue-500" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-4">Report an Incident</h2>
            <p className="text-xs text-slate-500 mt-1">
              File a comprehensive report with incident category, location search, affected persons, and description.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Fire, Road Accident, Flood, Building Collapse & more
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Pinpoint address via Geoapify map or search
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Track resolution status and updates in real time
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/citizen/report"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report an Emergency Now</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Reports Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Recent Reports</h2>
            <p className="text-xs text-slate-500">Track current status of submitted incidents</p>
          </div>
          <Link
            to="/citizen/my-reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {loadingIncidents ? (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading reports...</span>
            </div>
          ) : recentIncidents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <p>You have not submitted any emergency reports yet.</p>
            </div>
          ) : (
            recentIncidents.map((incident) => (
              <div
                key={incident._id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded px-2 -mx-2 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {incident.incidentId}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {incident.title}
                    </span>
                    {incident.source === 'SOS' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                        SOS
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                    <span>{incident.category || 'General'}</span>
                    <span>&bull;</span>
                    <span>{formatDate(incident.createdAt)}</span>
                    {incident.location?.address && (
                      <>
                        <span>&bull;</span>
                        <span className="truncate max-w-xs">{incident.location.address}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SeverityBadge severity={incident.severity} />
                  <StatusBadge status={incident.status} />
                  <Link
                    to={`/citizen/incidents/${incident.incidentId}`}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                    title="View details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SOS Click Confirmation Modal */}
      <Modal
        isOpen={sosActive}
        onClose={() => setSosActive(false)}
        title="Confirm Emergency SOS"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p>
              Are you in an immediate crisis? This will dispatch a critical SOS alert with your GPS coordinates directly to emergency responders.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSosActive(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setSosActive(false);
                triggerSos();
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Yes, Send SOS
            </button>
          </div>
        </div>
      </Modal>

      {/* SOS Follow-Up Questions Modal */}
      <Modal
        isOpen={showFollowUp}
        onClose={handleSkipFollowUp}
        title="SOS Received - Additional Details (Optional)"
      >
        <form onSubmit={handleSaveFollowUp} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
            <p className="font-semibold">Your SOS is already transmitted to dispatchers.</p>
            <p className="mt-0.5 text-emerald-800">
              You can optionally provide more context below, or skip this step entirely.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Emergency Category
            </label>
            <select
              value={followUpCategory}
              onChange={(e) => setFollowUpCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Fire Emergency">Fire Emergency</option>
              <option value="Road Accident">Road Accident</option>
              <option value="Flood">Flood</option>
              <option value="Building Collapse">Building Collapse</option>
              <option value="Other Emergencies">Other Emergencies</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Estimated People Affected
            </label>
            <input
              type="number"
              min="0"
              value={followUpPeople}
              onChange={(e) => setFollowUpPeople(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Brief Situation Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="e.g. Trapped on 2nd floor, smoke filling hallway..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSkipFollowUp}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
            >
              Skip & Close
            </button>
            <button
              type="submit"
              disabled={followUpSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              {followUpSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Details'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
