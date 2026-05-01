const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';

export function buildApiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`);
  }

  if (!rawApiBase) {
    return path;
  }

  return `${rawApiBase.replace(/\/$/, '')}${path}`;
}
