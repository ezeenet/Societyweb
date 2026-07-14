// lib/hooks/usePushNotification.ts

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function getAuthToken(): Promise<string | null> {
  try {
    const store = JSON.parse(localStorage.getItem('societyms-auth') || '{}');
    return store?.state?.accessToken || null;
  } catch { return null; }
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return false;
    }

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const keyRes = await fetch(API + '/push/vapid-public-key');
    const { publicKey } = await keyRes.json();

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const subJson = subscription.toJSON();
    const token   = await getAuthToken();

    await fetch(API + '/push/subscribe', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        p256dh:   subJson.keys?.p256dh,
        auth:     subJson.keys?.auth,
      }),
    });

    console.log('Push subscription saved!');
    return true;
  } catch (err) {
    console.error('Push subscribe failed:', err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const token = await getAuthToken();
    await fetch(API + '/push/unsubscribe', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    await sub.unsubscribe();
    console.log('Push unsubscribed!');
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch { return false; }
}