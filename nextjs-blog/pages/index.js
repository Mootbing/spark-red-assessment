import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { auth, db } from '../firebase/config';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot,
  query,
  where,
  GeoPoint,
  Timestamp
} from 'firebase/firestore';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  marginTop: '2rem',
  borderRadius: '12px',
};

const center = {
  lat: 39.9529, // Default center (Philadelphia)
  lng: -75.1910,
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [friends, setFriends] = useState([]);
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        loadFriendsLocations(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {},
      });
    }
  };

  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add the + prefix if not present
    if (!cleaned.startsWith('+')) {
      // Assume US number if no country code
      if (cleaned.length === 10) {
        return `+1${cleaned}`;
      }
      return `+${cleaned}`;
    }
    return phone;
  };

  const validatePhoneNumber = (phone) => {
    // Basic validation for E.164 format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const signInWithPhone = async () => {
    try {
      setError('');
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      if (!validatePhoneNumber(formattedPhone)) {
        setError('Please enter a valid phone number (e.g., +1234567890)');
        return;
      }

      // Reset the reCAPTCHA widget
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
      setVerificationId(confirmation.verificationId);
      setError('Verification code sent! Please check your phone.');
    } catch (error) {
      console.error('Error:', error);
      if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Error sending verification code. Please try again.');
      }
    }
  };

  const verifyCode = async () => {
    try {
      setError('');
      
      // Validate verification code format
      if (!/^\d{6}$/.test(verificationCode)) {
        setError('Please enter a valid 6-digit verification code');
        return;
      }

      // Create the credential
      const phoneCredential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );

      // Sign in with the credential
      try {
        const result = await signInWithCredential(auth, phoneCredential);
        setUser(result.user);
      } catch (error) {
        console.error('Error:', error);
        setError('Error verifying code. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new one.');
        setVerificationId(''); // Reset to show phone input
      } else {
        setError('Error verifying code. Please try again.');
      }
    }
  };

  const startLocationUpdates = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const updateLocation = async (position) => {
      if (!user) return;

      try {
        const locationRef = doc(db, 'locations', user.uid);
        await setDoc(locationRef, {
          coordinates: new GeoPoint(
            position.coords.latitude,
            position.coords.longitude
          ),
          timestamp: Timestamp.now().toMillis(),
          phoneNumber: user.phoneNumber
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    navigator.geolocation.watchPosition(updateLocation, 
      (error) => setError('Error getting location: ' + error.message),
      { enableHighAccuracy: true }
    );
  };

  const addFriend = async () => {
    if (!user || !newFriendPhone) return;

    try {
      setError('');
      const formattedPhone = formatPhoneNumber(newFriendPhone);
      
      if (!validatePhoneNumber(formattedPhone)) {
        setError('Please enter a valid phone number (e.g., +1234567890)');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentFriends = userDoc.exists() ? userDoc.data().friends || [] : [];
      
      if (!currentFriends.includes(formattedPhone)) {
        await setDoc(userRef, {
          friends: [...currentFriends, formattedPhone],
          phoneNumber: user.phoneNumber
        }, { merge: true });
      }

      setNewFriendPhone('');
    } catch (error) {
      setError('Error adding friend. Please try again.');
      console.error('Error:', error);
    }
  };

  const loadFriendsLocations = async (userId) => {
    try {
      // Get user's friends list
      const userRef = doc(db, 'users', userId);
      
      onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const friendPhones = doc.data().friends || [];
          
          // Subscribe to each friend's location
          friendPhones.forEach(phone => {
            const locationsQuery = query(
              collection(db, 'locations'),
              where('phoneNumber', '==', phone)
            );
            
            onSnapshot(locationsQuery, (snapshot) => {
              snapshot.forEach(doc => {
                const data = doc.data();
                setFriends(prev => {
                  const newFriends = prev.filter(f => f.phoneNumber !== phone);
                  return [...newFriends, {
                    id: doc.id,
                    phoneNumber: phone,
                    position: {
                      lat: data.coordinates.latitude,
                      lng: data.coordinates.longitude,
                    },
                    timestamp: data.timestamp,
                  }];
                });
              });
            });
          });
        }
      });
    } catch (error) {
      console.error('Error loading friends:', error);
      setError('Error loading friends locations');
    }
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFriends([]);
    } catch (error) {
      setError('Error signing out. Please try again.');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Friend Locator</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <div className={styles.authContainer}>
            <h1 className={styles.title}>Friend Locator</h1>
            <p className={styles.message}>Please sign in to use this app.</p>
            <button 
              className={styles.button}
              onClick={() => window.location.href = '/auth'}
            >
              Go to Sign In
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Friend Locator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Friend Locations</h1>
          <button 
            className={`${styles.button} ${styles.signOutButton}`}
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
        <div className={styles.addFriendForm}>
          <input
            type="tel"
            className={styles.phoneInput}
            value={newFriendPhone}
            onChange={(e) => setNewFriendPhone(e.target.value)}
            placeholder="Friend's phone number (e.g., +1234567890)"
          />
          <button className={styles.button} onClick={addFriend}>
            Add Friend
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <LoadScript googleMapsApiKey="AIzaSyAsPfXeYaCl4pY_jafVihLi2CAJ9gpIC5I">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
          >
            {friends.map((friend) => (
              <Marker
                key={friend.id}
                position={friend.position}
                onClick={() => setSelectedFriend(friend)}
              />
            ))}

            {selectedFriend && (
              <InfoWindow
                position={selectedFriend.position}
                onCloseClick={() => setSelectedFriend(null)}
              >
                <div className={styles.infoWindow}>
                  <h3>{selectedFriend.phoneNumber}</h3>
                  <p>Updated: {formatTimeAgo(selectedFriend.timestamp)}</p>
                  <p>
                    Location: {selectedFriend.position.lat.toFixed(6)}°N,{' '}
                    {selectedFriend.position.lng.toFixed(6)}°W
                  </p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
        <div className={styles.friendList}>
          {friends.map((friend) => (
            <div 
              key={friend.id} 
              className={styles.friendCard}
              onClick={() => setSelectedFriend(friend)}
            >
              <h3>{friend.phoneNumber}</h3>
              <div className={styles.locationInfo}>
                <p>
                  Location: {friend.position.lat.toFixed(6)}°N,{' '}
                  {friend.position.lng.toFixed(6)}°W
                </p>
                <p>Updated: {formatTimeAgo(friend.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
