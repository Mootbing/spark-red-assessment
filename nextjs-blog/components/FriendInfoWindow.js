import { InfoWindow } from '@react-google-maps/api';
import { formatTimeAgo } from '../utils/time';
import styles from '../styles/FriendInfoWindow.module.css';

export default function FriendInfoWindow({ friend, onClose }) {
  return (
    <InfoWindow
      position={friend.position}
      onCloseClick={onClose}
    >
      <div className={styles.infoWindow}>
        <h3>{friend.phoneNumber}</h3>
        <p>Updated: {formatTimeAgo(friend.timestamp)}</p>
        <p>
          Location: {friend.position.lat.toFixed(6)}°N,{' '}
          {friend.position.lng.toFixed(6)}°W
        </p>
      </div>
    </InfoWindow>
  );
} 