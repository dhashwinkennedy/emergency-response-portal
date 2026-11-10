import { ApiError } from '../utils/api.js';
import { isAllowedOrigin } from '../utils/origin.js';

export const authenticate = (req, _res, next) =>
  req.session?.userId ? next() : next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));

export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'FORBIDDEN', 'Insufficient permissions'));

export const loadUser = async (req, _res, next) => {
  if (!req.session?.userId) return next();
  const User = (await import('../models/User.js')).default;
  req.user = await User.findById(req.session.userId);
  if (!req.user) {
    req.session.destroy(() => {});
  }
  next();
};

export const csrf = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  let origin = req.get('origin');
  if (!origin && req.get('referer')) {
    try {
      origin = new URL(req.get('referer')).origin;
    } catch {}
  }
  if (origin && !isAllowedOrigin(origin)) {
    return next(new ApiError(403, 'CSRF_REJECTED', 'Untrusted request origin'));
  }
  next();
};

export const notFound = (req, _res, next) =>
  next(new ApiError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.path}`));

export const errors = (err, req, res, _next) => {
  const status = err.status || (err.name === 'ValidationError' || err.name === 'ZodError' ? 422 : 500);
  const details = err.details || err.issues?.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
  if (status >= 500) req.log?.error(err);
  res.status(status).json({
    success: false,
    error: {
      code: err.code || (status === 422 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'),
      message: status >= 500 ? 'An unexpected error occurred' : err.message,
      ...(details ? { details } : {}),
      requestId: req.id,
    },
  });
};
