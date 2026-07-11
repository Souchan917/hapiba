import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  setUserProperties,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhBJtjCTMy_onq0bDO_OrsXwS7QDjNcPQ",
  authDomain: "webnazokanri.firebaseapp.com",
  projectId: "webnazokanri",
  storageBucket: "webnazokanri.firebasestorage.app",
  messagingSenderId: "175593773883",
  appId: "1:175593773883:web:9be1347ff9532ba5e0751e",
  measurementId: "G-8YDV70EC6F",
};

const DEVICE_ID_STORAGE_KEY = "hapiba_device_id";

const app = initializeApp(firebaseConfig);

isSupported()
  .then((supported) => {
    if (!supported) {
      return;
    }

    const analytics = getAnalytics(app);
    const deviceId = getOrCreateDeviceId();
    const deviceInfo = getDeviceInfo();

    setUserId(analytics, deviceId);
    setUserProperties(analytics, {
      hapiba_device_id: deviceId,
      hapiba_device_category: deviceInfo.deviceCategory,
    });
    logEvent(analytics, "site_visit", {
      hapiba_device_id: deviceId,
      device_category: deviceInfo.deviceCategory,
      screen_size: deviceInfo.screenSize,
      viewport_size: deviceInfo.viewportSize,
      language: deviceInfo.language,
      timezone: deviceInfo.timezone,
    });
  })
  .catch(() => {
    // Analytics should never block the puzzle if a browser rejects storage/cookies.
  });

function getOrCreateDeviceId() {
  const nextId = createDeviceId();

  try {
    const existingId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

    if (existingId) {
      return existingId;
    }

    localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  } catch (_) {
    return nextId;
  }

  return nextId;
}

function createDeviceId() {
  if (globalThis.crypto?.randomUUID) {
    return `device_${globalThis.crypto.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2);
  return `device_${Date.now().toString(36)}_${randomPart}`;
}

function getDeviceInfo() {
  return {
    deviceCategory: getDeviceCategory(),
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || "unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
  };
}

function getDeviceCategory() {
  const touchCapable = navigator.maxTouchPoints > 0;
  const shortestScreenSide = Math.min(window.screen.width, window.screen.height);

  if (touchCapable && shortestScreenSide < 768) {
    return "mobile";
  }

  if (touchCapable && shortestScreenSide < 1024) {
    return "tablet";
  }

  return "desktop";
}
