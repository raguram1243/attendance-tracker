importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAeC1NlUpgHkFhI0ngJ1q_TMOsaR6TjwHU",
  projectId: "attendance-tracker",
  messagingSenderId: "62326412643",
  appId: "1:62326412643:web:f09da485dfb4e391a5af56"
});

const messaging = firebase.messaging();


const CACHE_NAME = "attendance-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/setup.html",
  "/tracker.html",
  "/styles.css",
  "/setup.js",
  "/tracker.js",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached || fetch(event.request)
    )
  );
});

messaging.onBackgroundMessage((payload) => {
    self.registration.showNotification("Attendance Reminder", {
      body: "Don’t forget to update attendance today 📋",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png"
    });
  });
  