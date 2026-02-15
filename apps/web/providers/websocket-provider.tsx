'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/websocket';

export interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  socket: null,
  isConnected: false,
});

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Fetch session and initialize socket
    async function initSocket() {
      try {
        const session = await fetch('/api/auth/session').then((r) => r.json());
        const token = session?.accessToken;

        if (!token) {
          console.warn('No access token - WebSocket not initialized');
          return;
        }

        if (!mounted) return;

        const ws = getSocket(token);
        setSocket(ws);

        // Listen for connection status changes
        const handleConnect = () => {
          if (mounted) setIsConnected(true);
        };

        const handleDisconnect = () => {
          if (mounted) setIsConnected(false);
        };

        ws.on('connect', handleConnect);
        ws.on('disconnect', handleDisconnect);

        // Set initial connection state
        if (ws.connected) {
          setIsConnected(true);
        }

        return () => {
          ws.off('connect', handleConnect);
          ws.off('disconnect', handleDisconnect);
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    }

    const cleanup = initSocket();

    return () => {
      mounted = false;
      cleanup?.then((cleanupFn) => cleanupFn?.());
      disconnectSocket();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}
