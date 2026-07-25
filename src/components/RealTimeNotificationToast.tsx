import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  Bell,
  X,
  Radio,
  Users,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { RealTimeNotification } from '../hooks/useSocket';

interface RealTimeNotificationToastProps {
  isConnected: boolean;
  onlineCount: number;
  notifications: RealTimeNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export const RealTimeNotificationToast: React.FC<RealTimeNotificationToastProps> = ({
  isConnected,
  onlineCount,
  notifications,
  onDismiss,
  onClearAll
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Take the 3 most recent notifications for floating toasts
  const activeToasts = notifications.slice(0, 3);

  return (
    <>
      {/* Floating Connection & Presence Badge Bar */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white border border-slate-800 px-3.5 py-2 rounded-full shadow-2xl text-xs">
        <div className="flex items-center gap-2 font-semibold">
          <span className="relative flex h-2.5 w-2.5">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            )}
          </span>

          <span className="text-slate-200">
            {isConnected ? 'WebSocket Active' : 'Connecting...'}
          </span>
        </div>

        <div className="h-3 w-[1px] bg-slate-700"></div>

        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{onlineCount} Online</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-700"></div>

        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="relative flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer pl-1 font-semibold"
        >
          <Bell className="w-3.5 h-3.5 text-cyan-400" />
          <span>Activity</span>
          {notifications.length > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Floating Live Toast Overlay Stack (Top-Right) */}
      <div className="fixed top-20 right-4 z-50 space-y-2.5 max-w-sm w-full pointer-events-none">
        {activeToasts.map((notif) => (
          <div
            key={notif.id}
            className="pointer-events-auto bg-slate-900 text-white border border-slate-700/90 rounded-2xl p-4 shadow-2xl transition-all duration-300 animate-slide-in-down relative flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0 mt-0.5">
              {notif.type === 'APPLICATION_SUBMITTED' && <Sparkles className="w-4 h-4 text-cyan-400" />}
              {notif.type === 'STATUS_UPDATED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {notif.type === 'NEW_COMMENT' && <MessageSquare className="w-4 h-4 text-purple-400" />}
              {notif.type === 'PRESENCE_UPDATED' && <Radio className="w-4 h-4 text-amber-400" />}
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-xs text-white truncate">{notif.title}</p>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-snug line-clamp-2">{notif.message}</p>
            </div>

            <button
              onClick={() => onDismiss(notif.id)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Expandable Activity Log Drawer */}
      {isDrawerOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[480px]">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Real-Time Event Stream</h3>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1 rounded-md"
                  title="Clear All"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{notif.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-normal">{notif.message}</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No real-time events logged yet.</p>
                <p className="text-[11px] text-slate-400">Events will stream automatically as candidates apply or status changes occur.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
