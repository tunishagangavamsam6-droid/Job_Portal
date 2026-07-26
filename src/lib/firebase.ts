import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Utility to check if Firebase is configured with real keys
export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(firebaseConfig?.apiKey) &&
    !firebaseConfig.apiKey.includes('remixed') &&
    !firebaseConfig.apiKey.includes('MY_') &&
    firebaseConfig.apiKey.length > 10
  );
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

try {
  if (isFirebaseConfigured()) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
  }
} catch (err) {
  console.warn('Firebase initialization warning:', err);
}

export const auth = authInstance;

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

// Workspace Scopes for Drive and Chat
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleAuthProvider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User | any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        try {
          const token = await user.getIdToken();
          cachedAccessToken = token;
          if (onAuthSuccess) onAuthSuccess(user, token);
        } catch (err) {
          console.warn('Error fetching ID token:', err);
          if (onAuthSuccess) onAuthSuccess(user, 'fallback-token');
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  if (!auth || !isFirebaseConfigured()) {
    throw new Error(
      'Firebase Auth API Key is unconfigured or using placeholder values in firebase-applet-config.json. Please update Firebase credentials in settings or use Demo Mode.'
    );
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || (await result.user.getIdToken());
    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    let msg = error.message || 'Google Sign-In failed';
    if (error.code === 'auth/invalid-api-key' || error.message?.includes('api-key')) {
      msg = 'Firebase API Key in firebase-applet-config.json is unconfigured or invalid. Please configure real Firebase credentials or use Instant Demo Mode.';
    } else if (error.code === 'auth/popup-blocked' || error.message?.includes('popup-blocked')) {
      msg = 'Sign-in popup was blocked by browser pop-up settings. Please allow popups or click Instant Demo Mode.';
    } else if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed') || error.message?.includes('verification')) {
      msg = 'Access Blocked: intrepid-coast-g1ttq.firebaseapp.com has not completed the Google verification process or is in testing mode. Please add your account (tunishagangavamsam6@gmail.com) as a Test User in Google Cloud Console, or click Instant Demo Mode Login above.';
    } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
      msg = 'Access Blocked: Current domain is not in Firebase Authorized Domains. Add this domain in Firebase Console -> Authentication -> Settings -> Authorized domains.';
    } else if (error.code === 'auth/operation-not-allowed') {
      msg = 'Google Provider is disabled in Firebase Authentication console. Please enable Google Sign-In in Firebase Console.';
    }
    throw new Error(msg);
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCustomAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  if (auth) {
    try {
      await auth.signOut();
    } catch (e) {
      console.warn('SignOut error:', e);
    }
  }
  cachedAccessToken = null;
};

