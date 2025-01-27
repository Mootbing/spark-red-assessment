import styles from '../styles/Header.module.css';

export default function Header({ onSignOut }) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Poke App Online</h1>
      <button 
        className={`${styles.button} ${styles.signOutButton}`}
        onClick={onSignOut}
      >
        Sign Out
      </button>
    </div>
  );
} 