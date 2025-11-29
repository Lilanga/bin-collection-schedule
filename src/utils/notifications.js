export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notifications are blocked. Please enable them in your browser settings.');
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const scheduleNotifications = (schedule) => {
  if (!schedule || Notification.permission !== 'granted') {
    return;
  }

  clearExistingNotifications();

  const allDates = [
    ...schedule.green.dates.map(date => ({ date, type: 'green', name: 'Green Bin (Organics)' })),
    ...schedule.recycle.dates.map(date => ({ date, type: 'recycle', name: 'Yellow Bin (Recycling)' })),
    ...schedule.rubbish.dates.map(date => ({ date, type: 'rubbish', name: 'Red Bin (Rubbish)' }))
  ];

  allDates.forEach(({ date, type, name }) => {
    const notificationDate = new Date(date);
    notificationDate.setDate(notificationDate.getDate() - 1);
    notificationDate.setHours(18, 0, 0, 0);

    const now = new Date();
    const timeUntilNotification = notificationDate.getTime() - now.getTime();

    if (timeUntilNotification > 0) {
      const timeoutId = setTimeout(() => {
        showNotification(name, date);
      }, timeUntilNotification);

      const notifications = getStoredNotifications();
      notifications.push({
        id: timeoutId,
        type,
        date: date.toISOString(),
        notificationTime: notificationDate.toISOString()
      });
      localStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
    }
  });
};

export const showNotification = (binType, collectionDate) => {
  const options = {
    body: `Your ${binType} will be collected tomorrow (${collectionDate.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric' })}). Don't forget to put it out tonight!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: `bin-reminder-${binType}`,
    requireInteraction: true,
    data: {
      binType,
      collectionDate: collectionDate.toISOString()
    }
  };

  if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('Bin Collection Reminder', options);
    });
  } else {
    new Notification('Bin Collection Reminder', options);
  }
};

export const clearExistingNotifications = () => {
  const notifications = getStoredNotifications();
  notifications.forEach(notification => {
    clearTimeout(notification.id);
  });
  localStorage.removeItem('scheduledNotifications');
};

export const getStoredNotifications = () => {
  const stored = localStorage.getItem('scheduledNotifications');
  return stored ? JSON.parse(stored) : [];
};

export const isNotificationEnabled = () => {
  return localStorage.getItem('notificationsEnabled') === 'true';
};

export const setNotificationEnabled = (enabled) => {
  localStorage.setItem('notificationsEnabled', enabled.toString());
  if (!enabled) {
    clearExistingNotifications();
  }
};