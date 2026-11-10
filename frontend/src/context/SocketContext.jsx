import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [latestEvent, setLatestEvent] = useState(null);

  const addAlert = useCallback((alert) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newAlert = { id, timestamp: new Date(), ...alert };
    setAlerts((prev) => [newAlert, ...prev].slice(0, 10)); // keep last 10
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    // Handle new incident (Admins)
    const handleNewIncident = (data) => {
      setLatestEvent({ type: 'incident:new', data });
      addAlert({
        type: 'incident',
        level: data.severity === 'Critical' ? 'critical' : 'warning',
        title: 'New Incident Reported',
        message: `${data.title} (${data.category}) - Ref: ${data.incidentId}`,
        incidentId: data.incidentId,
      });
    };

    // Handle SOS (Admins)
    const handleNewSos = (data) => {
      setLatestEvent({ type: 'sos:new', data });
      addAlert({
        type: 'sos',
        level: 'critical',
        title: 'CRITICAL: New SOS Emergency!',
        message: `Immediate response required! Ref: ${data.incidentId}`,
        incidentId: data.incidentId,
      });
    };

    // Handle incident updated (Admins)
    const handleIncidentUpdated = (data) => {
      setLatestEvent({ type: 'incident:updated', data });
    };

    // Handle citizen incident status updated (Citizen)
    const handleCitizenStatusUpdated = (data) => {
      setLatestEvent({ type: 'incident:status-updated', data });
      addAlert({
        type: 'status',
        level: 'info',
        title: 'Incident Status Updated',
        message: `Incident ${data.incidentId} is now "${data.status}"`,
        incidentId: data.incidentId,
      });
    };

    // Handle AI assessment completed
    const handleAiCompleted = (data) => {
      setLatestEvent({ type: 'ai:assessment-completed', data });
    };

    // Handle duplicate suggestions updated
    const handleDuplicatesUpdated = (data) => {
      setLatestEvent({ type: 'duplicate:suggestions-updated', data });
    };

    socket.on('incident:new', handleNewIncident);
    socket.on('sos:new', handleNewSos);
    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('incident:status-updated', handleCitizenStatusUpdated);
    socket.on('ai:assessment-completed', handleAiCompleted);
    socket.on('duplicate:suggestions-updated', handleDuplicatesUpdated);
    socket.on('incident:team-assigned', (data) => { setLatestEvent({ type: 'incident:team-assigned', data }); addAlert({type:'assignment',level:'info',title:'Response Team Assigned',message:`Teams have been assigned to incident ${data.incidentId}`,incidentId:data.incidentId}); });
    socket.on('team:assignment-received', (data) => { setLatestEvent({ type: 'team:assignment-received', data }); addAlert({type:'assignment',level:'warning',title:'New Emergency Assignment',message:`Incident ${data.incidentId} requires your team.`,incidentId:data.incidentId}); });
    socket.on('team:location-updated', (data) => setLatestEvent({ type: 'team:location-updated', data }));
    socket.on('team:availability-updated', (data) => setLatestEvent({ type: 'team:availability-updated', data }));

    return () => {
      socket.off('incident:new', handleNewIncident);
      socket.off('sos:new', handleNewSos);
      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('incident:status-updated', handleCitizenStatusUpdated);
      socket.off('ai:assessment-completed', handleAiCompleted);
      socket.off('duplicate:suggestions-updated', handleDuplicatesUpdated);
    socket.off('incident:team-assigned'); socket.off('team:assignment-received'); socket.off('team:location-updated'); socket.off('team:availability-updated');
    };
  }, [user, addAlert]);

  return (
    <SocketContext.Provider value={{ alerts, addAlert, dismissAlert, latestEvent }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
