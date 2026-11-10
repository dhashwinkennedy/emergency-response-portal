import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import LocationPicker from '../components/LocationPicker.jsx';
import { ShieldAlert, AlertCircle, Loader2, ArrowLeft, CheckCircle2, Paperclip, X } from 'lucide-react';

export default function ReportEmergency() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([
    'Fire Emergency',
    'Road Accident',
    'Medical Emergency',
    'Flood',
    'Building Collapse',
    'Other Emergencies',
  ]);
  const [subcategories, setSubcategories] = useState([
    'Chemical & Gas',
    'Natural Disasters',
    'Custom Category',
  ]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fire Emergency');
  const [subcategory, setSubcategory] = useState('Chemical & Gas');
  const [customCategory, setCustomCategory] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(0);
  const [severity, setSeverity] = useState('High');
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState({
    coordinates: null,
    address: '',
    source: 'GPS',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successIncident, setSuccessIncident] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const addFiles = (files) => { const incoming = Array.from(files); const next = [...attachments, ...incoming]; if (incoming.some(f => !allowedTypes.includes(f.type))) return setError('Only JPG, PNG, WEBP, and PDF files can be attached.'); if (next.length > 5) return setError('You can attach a maximum of five files.'); if (next.some(f => f.size > 10 * 1024 * 1024)) return setError('Each attachment must be 10 MB or smaller.'); if (next.reduce((sum, f) => sum + f.size, 0) > 25 * 1024 * 1024) return setError('Attachments must not exceed 25 MB in total.'); setError(''); setAttachments(next); };

  // Fetch metadata from backend if available
  useEffect(() => {
    api.getCategories()
      .then((res) => {
        if (res?.data?.categories) {
          const catNames = res.data.categories.map((c) => c.name);
          setCategories(catNames);
        }
      })
      .catch((err) => console.warn('Categories meta fallback:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || title.trim().length < 3) {
      setError('Incident title must be at least 3 characters');
      return;
    }

    if (!description.trim() || description.trim().length < 3) {
      setError('Description must be at least 3 characters');
      return;
    }

    if (!location.coordinates || location.coordinates.length !== 2) {
      setError('Please select an incident location on the map or use your GPS location');
      return;
    }

    if (category === 'Other Emergencies' && !subcategory) {
      setError('Please select a subcategory for Other Emergencies');
      return;
    }

    if (category === 'Other Emergencies' && subcategory === 'Custom Category' && !customCategory.trim()) {
      setError('Please specify the custom category name');
      return;
    }

    // Build payload according to backend schema
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      peopleAffected: Number(peopleAffected) || 0,
      severity,
      location: {
        coordinates: location.coordinates,
        address: location.address || undefined,
        accuracyMeters: location.accuracyMeters,
        source: location.source || 'MAP_PIN',
      },
    };

    if (category === 'Other Emergencies') {
      payload.subcategory = subcategory;
      if (subcategory === 'Custom Category') {
        payload.customCategory = customCategory.trim();
      }
    }

    if (contactName.trim() || contactPhone.trim()) {
      payload.contactInfo = {
        name: contactName.trim() || undefined,
        phone: contactPhone.trim() || undefined,
      };
    }

    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    attachments.forEach(file => formData.append('attachments', file));
    setLoading(true);

    try {
      const res = await api.createIncident(formData);
      const inc = res?.data?.incident;
      setSuccessIncident(inc);
    } catch (err) {
      setError(err.message || 'Failed to submit emergency report.');
      setLoading(false);
    }
  };

  if (successIncident) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-xl border border-emerald-200 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Emergency Report Submitted</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your report has been received and prioritized for dispatcher review.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left text-xs space-y-2">
            <div>
              <span className="font-semibold text-slate-600">Incident Reference: </span>
              <span className="font-mono font-bold text-slate-900">{successIncident.incidentId}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Title: </span>
              <span className="text-slate-900">{successIncident.title}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Initial Status: </span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{successIncident.status}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to={`/citizen/incidents/${successIncident.incidentId}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              View Incident Details
            </Link>
            <Link
              to="/citizen"
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <Link
          to="/citizen"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="pb-5 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Report an Emergency Incident</h1>
          <p className="text-xs text-slate-500 mt-1">
            Provide key details to help responders assess and coordinate assistance.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Incident Title *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Major collision at 5th Ave and Pine St"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Incident Description *
            </label>
            <textarea
              required
              rows={4}
              minLength={3}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the nature of the emergency, current dangers, visible hazards, or trapped individuals..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Emergency Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {category === 'Other Emergencies' && (
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Subcategory *
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subcategories.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Custom Category Input if Custom Category selected */}
          {category === 'Other Emergencies' && subcategory === 'Custom Category' && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Custom Category Name *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Industrial Pipeline Leak"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Severity & People Affected */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Assessed Severity *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low - Minimal immediate threat</option>
                <option value="Medium">Medium - Potentially escalating</option>
                <option value="High">High - Life or property in danger</option>
                <option value="Critical">Critical - Catastrophic / immediate rescue needed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Estimated People Affected *
              </label>
              <input
                type="number"
                min="0"
                required
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Incident Location *
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Use GPS, search for an address, or click directly on the map.
            </p>
            <LocationPicker
              value={location}
              onChange={(newLoc) => setLocation(newLoc)}
            />
          </div>

          {/* Optional Contact Info */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-800 mb-3">
              Contact Information for Responders (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-800">Attach Photos or Documents (Optional)</h3>
            <p className="mt-1 text-[11px] text-slate-500">JPG, JPEG, PNG, WEBP, or PDF. Up to 5 files, 10 MB each, 25 MB total.</p>
            <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }} className="mt-3 flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-xs text-slate-600 hover:border-blue-400">
              <Paperclip className="mb-1 w-5 text-blue-600"/>Drop files here or <span className="font-semibold text-blue-700">browse</span><input className="hidden" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            </label>
            {attachments.length > 0 && <div className="mt-3 space-y-2">{attachments.map((file,index) => <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded border border-slate-200 p-2 text-xs"><div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">{file.type.startsWith('image/') && <img className="h-full w-full object-cover" src={URL.createObjectURL(file)} alt="" />}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{file.name}</p><p className="text-slate-500">{file.type || 'Unknown'} · {(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={() => setAttachments(attachments.filter((_,i) => i !== index))} className="text-red-600"><X className="w-4"/></button></div>)}</div>}
          </div>

          {/* Submit button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/citizen"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <span>Submit Emergency Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
