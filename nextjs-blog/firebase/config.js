import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAsPfXeYaCl4pY_jafVihLi2CAJ9gpIC5I",
    authDomain: "lets-meet-d3add.firebaseapp.com",
    projectId: "lets-meet-d3add",
    storageBucket: "lets-meet-d3add.firebasestorage.app",
    messagingSenderId: "857490185011",
    appId: "1:857490185011:web:fca7400030054cf3b3bc46",
    measurementId: "G-9GBRVLT3BP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 