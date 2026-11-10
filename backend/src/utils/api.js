export class ApiError extends Error { constructor(status, code, message, details) { super(message); this.status=status; this.code=code; this.details=details; } }
export const ok = (res, data={}, message, status=200, meta) => res.status(status).json({ success:true, ...(message ? {message}:{}), data, ...(meta ? {meta}: {}) });
export const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
export const pagination = query => { const page=Math.max(1,Number(query.page)||1), limit=Math.min(100,Math.max(1,Number(query.limit)||20)); return {page,limit,skip:(page-1)*limit}; };
