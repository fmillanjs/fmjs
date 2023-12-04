import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';


const firebaseConfig = {
    // Initialize Firebase configurations
    apiKey: "AIzaSyDOIEZ9RwIp8LumZ4__aHtMOjpg7sdf-EI",
    authDomain: "fmjs-2ef79.firebaseapp.com",
    databaseURL: "https://fmjs-2ef79.firebaseio.com",
    storageBucket: "fmjs-2ef79.appspot.com",
    messagingSenderId: "341785476869"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const storage = getStorage(app);

// Connect to Firebase emulators in development environment
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { auth, storage };
