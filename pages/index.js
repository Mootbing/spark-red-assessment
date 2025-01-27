import { useState, useEffect } from 'react';
import Head from 'next/head';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Map from '../components/Map';
import FriendList from '../components/FriendList';
import Header from '../components/Header';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
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

  const loadFriendsLocations = async (userId) => {
    try {
      // Get user's friends list 
      const userRef = doc(db, 'users', userId);
      
      onSnapshot(userRef, (friendsListDoc) => {
        if (friendsListDoc.exists()) {
          const friendDocData = friendsListDoc.data();

          console.log(friendDocData)

          const friendIDs = friendDocData.friends || [];
          
          // Subscribe to each friend's location
          friendIDs.forEach(id => {
            console.log(id)

            const locationRef = doc(db, 'locations', id);

            onSnapshot(locationRef, (locationDoc) => {
              if (locationDoc.exists()) {
                const data = locationDoc.data();
                setFriends(prev => {
                  const newFriends = prev.filter(f => f.id !== id);
                  return [...newFriends, {
                    id: doc.id,
                    position: {
                      lat: data.coordinates.latitude,
                      lng: data.coordinates.longitude,
                    },
                    timestamp: data.timestamp,
                  }];
                });
              }
            });
          });
        }
      });
    } catch (error) {
      console.error('Error loading friends:', error);
      setError('Error loading friends locations');
    }
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
          <title>Poke App Online</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <div className={styles.authContainer}>
            <h1 className={styles.title}>Poke App Online</h1>
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
        <title>Poke App Online</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Header onSignOut={handleSignOut} />
        {error && <p className={styles.error}>{error}</p>}
        <Map 
          friends={friends}
          selectedFriend={selectedFriend}
          setSelectedFriend={setSelectedFriend}
        />
        <FriendList 
          friends={friends}
          onFriendSelect={setSelectedFriend}
        />
      </main>
    </div>
  );
}
