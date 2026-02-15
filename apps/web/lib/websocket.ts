import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket?.connected) return socket;

  console.log('[WebSocket Client] Initializing connection:', {
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    tokenLength: token.length,
    tokenPreview: token.substring(0, 20) + '...',
    authObject: { token: '[REDACTED]' },
  });

  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[WebSocket Client] Connected successfully', {
      socketId: socket?.id,
      connected: socket?.connected,
    });
  });

  socket.on('disconnect', () => {
    console.log('[WebSocket Client] Disconnected', {
      socketId: socket?.id,
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('[WebSocket Client] Reconnected', {
      attemptNumber,
      socketId: socket?.id,
    });
  });

  socket.on('connect_error', (err) => {
    console.error('[WebSocket Client] Connection error:', {
      message: err.message,
      description: err.message,
      stack: err.stack,
    });
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
