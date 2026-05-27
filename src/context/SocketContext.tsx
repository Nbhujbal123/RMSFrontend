import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  joinSite: (siteCode: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  joinSite: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('connect', () => {
      setConnected(true);
      setSocket(s); // expose socket to consumers only after it's connected
      // Auto-join site room
      const siteCode = localStorage.getItem('siteCode');
      if (siteCode) s.emit('join-site', siteCode);
    });

    s.on('disconnect', () => setConnected(false));

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Stable reference — always uses the live socket from the ref
  const joinSite = useCallback((siteCode: string) => {
    if (socketRef.current?.connected && siteCode) {
      socketRef.current.emit('join-site', siteCode);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, joinSite }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
