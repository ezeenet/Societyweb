self.addEventListener('push', function(event) {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'SocietyMS', body: event.data.text() }; }
  const options = {
    body: data.body || '',
    icon: '/favicon.ico',
    tag: data.tag || 'societyms',
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(data.title || 'SocietyMS', options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/dashboard/visitors');
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));