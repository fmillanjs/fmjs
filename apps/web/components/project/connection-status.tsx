'use client';

import { useWebSocket } from '@/hooks/use-websocket';

export function ConnectionStatus() {
  const { isConnected } = useWebSocket();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-muted-foreground'}`}
        title={isConnected ? 'Connected' : 'Disconnected'}
      />
      <span className="text-xs text-muted-foreground">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}
