/* StudyFlow service worker: เปิดออฟไลน์ได้ + รับแจ้งเตือนจากระบบ (push)
   เลขเวอร์ชันด้านล่างเปลี่ยนตามเวอร์ชันแอปทุกครั้ง เพื่อให้เครื่องผู้ใช้โหลดไฟล์ใหม่ */
const VERSION = 'studyflow-1.0.1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  'Sarabun-Regular.ttf', 'Sarabun-Medium.ttf', 'Sarabun-SemiBold.ttf', 'Sarabun-Bold.ttf'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; /* ไม่ยุ่งกับคำขอไปเว็บอื่น (เช่น Worker แจ้งเตือน) */
  e.respondWith(caches.match(e.request).then(cached => {
    const net = fetch(e.request).then(res => {
      if (res && res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
/* แจ้งเตือนจากเซิร์ฟเวอร์ (ทำงานแม้ปิดแอป) */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { t: 'StudyFlow', b: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.t || 'StudyFlow', {
    body: d.b || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.k || 'studyflow',
    silent: !!d.s, vibrate: [200, 100, 200], data: { k: d.k }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : clients.openWindow('./')));
});
