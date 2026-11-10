import Incident from '../models/Incident.js';
export async function generateIncidentId() { const day=new Date().toISOString().slice(0,10).replaceAll('-',''); const last=await Incident.findOne({incidentId:new RegExp(`^INC-${day}-`)}).sort({incidentId:-1}).select('incidentId').lean(); const n=last?Number(last.incidentId.slice(-4))+1:1; return `INC-${day}-${String(n).padStart(4,'0')}`; }
