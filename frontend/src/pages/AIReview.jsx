import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { Cpu, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge.jsx';

export default function AIReview() {
  const [items,setItems]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState('');
  const load=async()=>{setLoading(true);setError('');try{const r=await api.getAiReviewQueue();setItems(r?.data?.incidents || r?.data?.queue || []);}catch(e){setError(e.message||'Could not load the AI review queue.');}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  return <div className="space-y-5"><div className="flex items-start justify-between"><div><h1 className="flex items-center gap-2 text-xl font-bold"><Cpu className="w-5 text-blue-600"/>AI Review</h1><p className="mt-1 text-xs text-slate-500">AI is advisory only. Administrators make every final incident decision.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold"><RefreshCw className="w-3.5 h-3.5"/>Refresh</button></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">{loading ? <div className="flex items-center justify-center gap-2 p-12 text-xs text-slate-500"><Loader2 className="w-4 animate-spin"/>Loading review queue…</div> : items.length ? items.map(i=><div key={i._id||i.incidentId} className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-xs font-bold text-slate-700">{i.incidentId}</p><p className="mt-1 text-sm font-semibold">{i.title}</p><p className="mt-1 text-xs text-slate-500">{i.category} · AI: {i.aiAssessmentStatus || 'Pending'}</p></div><div className="flex items-center gap-3"><SeverityBadge severity={i.severity}/><Link className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600" to={`/admin/incidents/${i.incidentId}`}>Review <ArrowRight className="w-3.5"/></Link></div></div>) : <div className="p-12 text-center text-sm text-slate-500">No incidents currently await AI review.</div>}</div>
  </div>;
}
