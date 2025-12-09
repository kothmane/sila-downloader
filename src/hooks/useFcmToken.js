import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { initializeMessaging } from '@/services/firebase';


export const useFcmToken = () => {
  const [token, setToken] = useState('');
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('');

  useEffect(() => {
    const retrieveToken = async () => {
      try {
        const messaging = await initializeMessaging();
        if (!messaging || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
          return;
        }

        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { type: 'module' });

        let currentPermission = Notification.permission;
        setNotificationPermissionStatus(currentPermission);

        if (currentPermission === 'default') {
          currentPermission = await Notification.requestPermission();
          setNotificationPermissionStatus(currentPermission);
        }

        if (currentPermission === 'denied') {
          console.log('Notification permission has been denied.');
          return;
        }

        if (currentPermission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: 'BDWmyuw0Ldk7n-Oy3qiQuHAE0XZbV-oseMODjPbLW_HlMutmvASTQ62nSb2WmZojiqTnGBK7I5t8oJGHT5d3ZdM',
            serviceWorkerRegistration: swRegistration
          });
          if (currentToken) {
            setToken(currentToken);
          } else {
            console.log('No registration token available.');
          }
        }
      } catch (error) {
        console.log('An error occurred while retrieving token. ', error);
      }
    };

    retrieveToken();
  }, []);

  return { fcmToken: token, notificationPermissionStatus };
}; 