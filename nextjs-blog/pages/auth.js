import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { auth } from '../firebase/config';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

export default function Auth() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    // Clean up reCAPTCHA when component unmounts
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        return `+1${cleaned}`;
      }
      return `+${cleaned}`;
    }
    return phone;
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // Automatically trigger sign in when reCAPTCHA is solved
          handleSignInWithPhone();
        },
        'expired-callback': () => {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
          setError('reCAPTCHA expired. Please try again.');
        }
      });

      window.recaptchaVerifier.render();
    } catch (error) {
      console.error('reCAPTCHA Error:', error);
      setError('Error setting up verification. Please try again.');
    }
  };

  const handleSignInWithPhone = async () => {
    try {
      setError('');
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      if (!validatePhoneNumber(formattedPhone)) {
        setError('Please enter a valid phone number (e.g., +1234567890)');
        return;
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
      setConfirmationResult(confirmation);
      setVerificationId(confirmation.verificationId);
      setError('Verification code sent! Please check your phone.');
    } catch (error) {
      console.error('Sign In Error:', error);
      if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Error sending verification code. Please try again.');
      }
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  const verifyCode = async () => {
    try {
      setError('');
      
      if (!/^\d{6}$/.test(verificationCode)) {
        setError('Please enter a valid 6-digit verification code');
        return;
      }

      if (!confirmationResult) {
        setError('Session expired. Please request a new code.');
        setVerificationId('');
        return;
      }

      const result = await confirmationResult.confirm(verificationCode);
      
      if (result.user) {
        router.push('/');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new one.');
        setVerificationId('');
        setConfirmationResult(null);
      } else {
        setError('Error verifying code. Please try again.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign In - Friend Locator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.authContainer}>
          <h1 className={styles.title}>Sign In</h1>
          {!verificationId ? (
            <>
              <input
                type="tel"
                className={styles.phoneInput}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone number (e.g., +1234567890)"
              />
              <p className={styles.hint}>
                Format: +[country code][number] (e.g., +12125551234)
              </p>
              <button 
                className={styles.button} 
                onClick={setupRecaptcha}
                disabled={!phoneNumber.trim()}
              >
                Send Code
              </button>
              <div id="recaptcha-container" className={styles.recaptchaContainer}></div>
            </>
          ) : (
            <>
              <p className={styles.hint}>
                Enter the 6-digit code sent to {phoneNumber}
              </p>
              <input
                type="text"
                className={styles.phoneInput}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit verification code"
                maxLength={6}
                pattern="\d*"
              />
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.button} 
                  onClick={verifyCode}
                  disabled={verificationCode.length !== 6}
                >
                  Verify Code
                </button>
                <button 
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={() => {
                    setVerificationId('');
                    setVerificationCode('');
                    setError('');
                  }}
                >
                  Try Different Number
                </button>
              </div>
            </>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </main>
    </div>
  );
} 