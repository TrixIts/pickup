import { createClient } from "@/lib/supabase/client";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !PUBLIC_KEY) return;

    try {
        const register = await navigator.serviceWorker.register('/sw.js');

        // Check if already subscribed
        let subscription = await register.pushManager.getSubscription();

        if (!subscription) {
            subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
            });
        }

        // Save to DB
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const subObj = subscription.toJSON();

        await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                subscription: subObj
            })
        });

        return true;
    } catch (error) {
        console.error("Push subscription failed:", error);
        return false;
    }
}
