import FriendCard from './FriendCard';
import styles from '../styles/FriendList.module.css';

export default function FriendList({ friends, onFriendSelect }) {
  return (
    <div className={styles.friendList}>
      {friends.map((friend) => (
        <FriendCard 
          key={friend.id}
          friend={friend}
          onClick={() => onFriendSelect(friend)}
        />
      ))}
    </div>
  );
} 