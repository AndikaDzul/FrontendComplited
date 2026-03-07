// public/sw.js

let reminderInterval = null;
let userData = {
    status: 'Belum Absen',
    enabled: true,
    name: 'Siswa'
};

// Pastikan Service Worker langsung aktif tanpa menunggu refresh
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    console.log('ZieSen Background System Active');
});

// Menerima data terbaru dari aplikasi Vue
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_STATUS') {
        userData.status = event.data.status;
        userData.enabled = event.data.enabled;
        userData.name = event.data.name;
        
        console.log('Status Terupdate di Background:', userData.status);
        manageReminder();
    }
});

function manageReminder() {
    // Bersihkan interval lama jika ada
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }

    // Jika belum absen dan fitur aktif, jalankan pengingat
    if (userData.status === 'Belum Absen' && userData.enabled) {
        // Kirim notifikasi pertama segera setelah aplikasi ditutup
        sendNotification();

        // Ulangi setiap 1 menit (Batas aman browser agar tidak dianggap spam)
        reminderInterval = setInterval(() => {
            if (userData.status === 'Belum Absen' && userData.enabled) {
                sendNotification();
            } else {
                clearInterval(reminderInterval);
                reminderInterval = null;
            }
        }, 60000);
    }
}

function sendNotification() {
    const options = {
        body: `Halo ${userData.name}, Anda belum absen hari ini! Segera lakukan absensi di ZieSen.`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [500, 110, 500, 110, 450], // Pola getar mirip WhatsApp/Telepon
        tag: 'absen-reminder', // Tag sama agar notifikasi menumpuk (tidak memenuhi bar)
        renotify: true, // Bergetar lagi meskipun notifikasi lama belum dihapus
        requireInteraction: true, // Notifikasi tidak akan hilang sampai diklik/diswipe
        silent: false, // Pastikan bersuara (mengikuti volume sistem HP)
        data: {
            url: '/'
        }
    };

    self.registration.showNotification('ZieSen: Peringatan Absensi', options);
}

// Logika ketika notifikasi diklik: buka kembali aplikasi
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});