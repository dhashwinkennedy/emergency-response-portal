import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import api from '../services/api.js';
import { Loader2, MapPin, RefreshCw } from 'lucide-react';

const colors = { Low: '#64748b', Medium: '#d97706', High: '#ea580c', Critical: '#dc2626' };
export default function AdminMap() {
  const element = useRef(null), map = useRef(null), layer = useRef(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [incidents, setIncidents] = useState([]), [hotspots, setHotspots] = useState([]), [teams,setTeams]=useState([]),[staleAfterMs,setStaleAfterMs]=useState(300000);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const b = map.current?.getBounds();
      const bbox = b ? { minLon: b.getWest(), minLat: b.getSouth(), maxLon: b.getEast(), maxLat: b.getNorth() } : { minLon: -180, minLat: -85, maxLon: 180, maxLat: 85 };
      const [result, hotspotResult, teamResult] = await Promise.all([api.getMapIncidents(bbox), api.getHotspots(),api.getTeamLocations()]);
      setIncidents(result?.data?.incidents || []); setHotspots(hotspotResult?.data?.hotspots || []);setTeams(teamResult?.data?.teams||[]);setStaleAfterMs(teamResult?.data?.staleAfterMs||300000);
    } catch (e) { setError(e.message || 'Unable to load incidents on the map.'); } finally { setLoading(false); }
  };
  useEffect(() => { const instance = L.map(element.current).setView([20.5937, 78.9629], 5); map.current = instance;
    L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY || ''}`, { attribution: '&copy; Geoapify, OpenStreetMap', maxZoom: 19 }).addTo(instance);
    load(); return () => instance.remove(); }, []);
  useEffect(() => { if (!map.current) return; if (layer.current) layer.current.clearLayers(); const group = L.layerGroup();
    incidents.forEach((i) => { const c = i.location?.coordinates; if (!c) return; const icon = L.divIcon({ className: '', html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${colors[i.severity] || colors.Low};border:2px solid white;box-shadow:0 1px 3px #334155"></span>`, iconSize:[16,16], iconAnchor:[8,8] });
      L.marker([c[1], c[0]], { icon }).bindPopup(`<strong>${i.incidentId}</strong><br/>${i.title}<br/>${i.severity} · ${i.status}`).addTo(group); });
    hotspots.forEach((h) => { const c = h.center?.coordinates; if (!c) return; L.circle([c[1], c[0]], { radius: h.radiusMeters || 1000, color:'#7c3aed', fillColor:'#a78bfa', fillOpacity:.16, weight:2 }).bindPopup(`<strong>${h.label}</strong><br/>${h.totalIncidents} incidents · ${h.dominantCategory}`).addTo(group); });
    const teamColors={'Medical Team':'#059669','Police Team':'#2563eb','Fire & Rescue Team':'#dc2626'};teams.forEach(t=>{const c=t.currentLocation?.coordinates;if(!c)return;const stale=Date.now()-new Date(t.locationUpdatedAt||0)>staleAfterMs;const color=teamColors[t.category]||'#475569';const icon=L.divIcon({className:'',html:`<span style="display:block;width:18px;height:18px;border-radius:4px;background:${color};opacity:${stale?.35:1};border:2px solid white"></span>`,iconSize:[18,18],iconAnchor:[9,9]});L.marker([c[1],c[0]],{icon}).bindPopup(`<strong>${t.teamName}</strong><br/>${t.teamId} · ${t.category}<br/>${t.availabilityStatus}${stale?'<br/><em>Location stale</em>':''}`).addTo(group);});
    group.addTo(map.current); layer.current = group;
  }, [incidents, hotspots]);
  return <div className="space-y-5"><div className="flex items-start justify-between gap-4"><div><h1 className="text-xl font-bold">Incident Map</h1><p className="text-xs text-slate-500 mt-1">Live incidents with a recorded location.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold"><RefreshCw className="w-3.5 h-3.5" />Refresh</button></div>
    {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    <div className="rounded-xl border bg-white p-3 shadow-sm"><div ref={element} className="h-[62vh] min-h-[400px] overflow-hidden rounded-lg" />{loading && <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Loading recorded locations…</div>}</div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(colors).map(([name,color]) => <div key={name} className="flex items-center gap-2 rounded border bg-white px-3 py-2 text-xs"><span className="h-3 w-3 rounded-full" style={{background:color}} />{name}</div>)}</div>
    {!loading && !incidents.length && <div className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500"><MapPin className="mx-auto mb-2 w-6" />No mapped incidents are available for this view.</div>}
  </div>;
}
