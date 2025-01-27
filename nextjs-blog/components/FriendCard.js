import { formatTimeAgo } from '../utils/time';
import styles from '../styles/FriendCard.module.css';

export default function FriendCard({ friend, onClick }) {
  return (
    <div 
      className={styles.friendCard}
      onClick={onClick}
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
  );
} 