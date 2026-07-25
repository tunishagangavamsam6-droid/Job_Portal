import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RealTimeNotification {
  id: string;
  type: 'APPLICATION_SUBMITTED' | 'STATUS_UPDATED' | 'NEW_COMMENT' | 'PRESENCE_UPDATED';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to same origin host
    const socket = io(window.location.origin, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket connected [id=' + socket.id + ']');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
      setIsConnected(false);
    });

    socket.on('PRESENCE_UPDATED', (payload: { onlineCount: number }) => {
      setOnlineCount(payload.onlineCount);
    });

    socket.on('APPLICATION_SUBMITTED', (payload: any) => {
      const notif: RealTimeNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'APPLICATION_SUBMITTED',
        title: '🎉 New Candidate Application!',
        message: `${payload.application.applicantName} applied for ${payload.jobTitle || 'a job'} (${payload.application.matchScore}% Match)`,
        timestamp: payload.timestamp || new Date().toISOString(),
        data: payload
      };
      setNotifications((prev) => [notif, ...prev.slice(0, 24)]);
    });

    socket.on('STATUS_UPDATED', (payload: any) => {
      const notif: RealTimeNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'STATUS_UPDATED',
        title: '⚡ Application Status Updated',
        message: `${payload.application.applicantName}'s status changed from ${payload.previousStatus} to "${payload.newStatus}"`,
        timestamp: payload.timestamp || new Date().toISOString(),
        data: payload
      };
      setNotifications((prev) => [notif, ...prev.slice(0, 24)]);
    });

    socket.on('NEW_COMMENT', (payload: any) => {
      const notif: RealTimeNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'NEW_COMMENT',
        title: '💬 Live Note Added',
        message: `${payload.comment.author} (${payload.comment.role}): "${payload.comment.text}"`,
        timestamp: payload.timestamp || new Date().toISOString(),
        data: payload
      };
      setNotifications((prev) => [notif, ...prev.slice(0, 24)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendComment = useCallback((applicationId: string, author: string, role: string, text: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('SEND_COMMENT', { applicationId, author, role, text });
    } else {
      // Fallback HTTP POST
      fetch(`/api/applications/${applicationId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, role, text })
      }).catch((err) => console.error('Error posting comment:', err));
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    onlineCount,
    notifications,
    sendComment,
    dismissNotification,
    clearAllNotifications
  };
};
