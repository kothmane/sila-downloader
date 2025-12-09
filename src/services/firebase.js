import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAH-OkOnxGJi-JoafkDUzcuxvaADUM424I",
  authDomain: "sila-marketing.firebaseapp.com",
  projectId: "sila-marketing",
  storageBucket: "sila-marketing.appspot.com",
  messagingSenderId: "852569785183",
  appId: "1:852569785183:web:943ba91aac8d5c83b22cea",
  measurementId: "G-J83F0DG4SZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence);
}

let messagingPromise;
const initializeMessaging = () => {
  if (messagingPromise) {
    return messagingPromise;
  }
  messagingPromise = new Promise(async (resolve) => {
    if (typeof window !== 'undefined' && await isSupported()) {
      const messaging = getMessaging(app);
      resolve(messaging);
    } else {
      resolve(null);
    }
  });
  return messagingPromise;
}


export default auth;
export { initializeMessaging };