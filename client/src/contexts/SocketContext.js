import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  const value = {
    socket,
    isConnected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
