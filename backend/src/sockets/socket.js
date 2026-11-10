import { Server } from 'socket.io';
import { sessionMiddleware } from '../app.js';
import User from '../models/User.js';
import ResponseTeam from '../models/ResponseTeam.js';
import { isAllowedOrigin } from '../utils/origin.js';

export function configureSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      },
      credentials: true,
    },
  });

  io.use((socket, next) => sessionMiddleware(socket.request, {}, next));
  io.use(async (socket, next) => {
    const id = socket.request.session?.userId;
    if (!id) return next(new Error('Authentication required'));
    const user = await User.findById(id);
    if (!user) return next(new Error('Authentication required'));
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    if (socket.user.role === 'admin') socket.join('admin:dashboard');
    if (socket.user.role === 'team') socket.join(`team:${socket.user.id}`);
    if (socket.user.role === 'team') { const team=await ResponseTeam.findOne({userId:socket.user._id}).select('_id'); if(team) socket.join(`team:${team._id}`); }
    socket.join(`user:${socket.user.id}`);
    socket.on('join:admin', () => {
      if (socket.user.role === 'admin') socket.join('admin:dashboard');
    });
    socket.on('join:user', (id) => {
      if (String(id) === socket.user.id) socket.join(`user:${id}`);
    });
  });

  return io;
}
