import React, { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle } from 'lucide-react';
import {
  requestNotificationPermission,
  isNotificationEnabled,
  setNotificationEnabled,
  scheduleNotifications,
  clearExistingNotifications
} from '../utils/notifications';

export default function NotificationSettings({ schedule }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setNotificationsEnabled(isNotificationEnabled());
    setNotificationPermission(Notification.permission);
  }, []);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      setLoading(true);
      setError(null);

      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          setNotificationEnabled(true);
          setNotificationsEnabled(true);
          setNotificationPermission('granted');

          if (schedule) {
            scheduleNotifications(schedule);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setNotificationEnabled(false);
      setNotificationsEnabled(false);
      clearExistingNotifications();
    }
  };

  const getStatusMessage = () => {
    if (notificationPermission === 'denied') {
      return {
        text: 'Notifications are blocked. Please enable them in your browser settings.',
        type: 'error'
      };
    }

    if (notificationsEnabled) {
      return {
        text: 'You\'ll receive reminders at 6pm the day before each collection.',
        type: 'success'
      };
    }

    return {
      text: 'Enable notifications to get reminded before bin collection days.',
      type: 'info'
    };
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Notification Settings</h2>
        </div>
        <button
          onClick={handleToggleNotifications}
          disabled={loading || notificationPermission === 'denied'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            notificationsEnabled
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : notificationsEnabled ? (
            <BellOff className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {loading ? 'Setting up...' : notificationsEnabled ? 'Disable' : 'Enable'} Reminders
        </button>
      </div>

      <div className={`p-4 rounded-lg border ${
        statusMessage.type === 'error' ? 'bg-red-50 border-red-200' :
        statusMessage.type === 'success' ? 'bg-green-50 border-green-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-2">
          <AlertCircle className={`w-5 h-5 mt-0.5 ${
            statusMessage.type === 'error' ? 'text-red-600' :
            statusMessage.type === 'success' ? 'text-green-600' :
            'text-blue-600'
          }`} />
          <p className={`text-sm ${
            statusMessage.type === 'error' ? 'text-red-700' :
            statusMessage.type === 'success' ? 'text-green-700' :
            'text-blue-700'
          }`}>
            {statusMessage.text}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {notificationsEnabled && schedule && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Upcoming Reminders</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {[...schedule.green.dates, ...schedule.recycle.dates, ...schedule.rubbish.dates]
              .sort((a, b) => a - b)
              .slice(0, 3)
              .map((date, idx) => {
                const reminderDate = new Date(date);
                reminderDate.setDate(reminderDate.getDate() - 1);
                reminderDate.setHours(18, 0, 0, 0);

                if (reminderDate > new Date()) {
                  return (
                    <div key={idx}>
                      📱 {reminderDate.toLocaleDateString('en-AU', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })} at 6:00 PM
                    </div>
                  );
                }
                return null;
              })
              .filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}