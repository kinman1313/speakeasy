import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    const socketInstance = io(process.env.REACT_APP_SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      upgrade: false,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error', error => {
      console.error('Socket error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user, token]);

  return { socket, isConnected };
}
