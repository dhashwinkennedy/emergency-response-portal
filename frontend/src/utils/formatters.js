export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(dateStr) {
  if (!dateStr) return '—';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatCoordinates(coords) {
  if (!coords || !Array.isArray(coords) || coords.length !== 2) return 'Unavailable';
  const [lon, lat] = coords;
  return `${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`;
}
