import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let socketInstance = null;

export function initSocket() {
  if (socketInstance) {
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  socketInstance = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    transports: ['websocket', 'polling'],
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] Connected, ID:', socketInstance.id);
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socketInstance;
}

export function getSocket() {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
