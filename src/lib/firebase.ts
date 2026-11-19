import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithCredential,
  UserCredential,
  Auth,
  AuthError
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

/**
 * Cấu hình Firebase Authentication
 * Các biến môi trường được định nghĩa với tiền tố VITE_ để Vite bundle ra client.
 */
function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
}

/**
 * Kiểm tra xem các biến môi trường Firebase tối thiểu đã được cung cấp chưa
 */
export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.appId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (!auth) {
    try {
      const config = getFirebaseConfig();
      app = getApps().length === 0 ? initializeApp(config) : getApp();
      auth = getAuth(app);
    } catch (err) {
      console.warn('Lỗi khởi tạo Firebase:', err);
      return null;
    }
  }
  return auth;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export interface SocialAuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  providerId: 'google.com' | 'facebook.com';
}

/**
 * Đăng nhập/Đăng ký bằng Google
 * Tự động nhận diện Native App (Android/iOS) để bật Google Play Services Native Sheet 1-chạm,
 * hoặc bật Web Popup khi chạy trên trình duyệt web.
 */
export async function signInWithGoogle(): Promise<SocialAuthUser> {
  // 1. Trường hợp chạy trên NATIVE APP (Android / iOS): Dùng Native GoogleAuth không mở trình duyệt
  if (Capacitor.isNativePlatform()) {
    try {
      GoogleAuth.initialize({
        clientId: '1012760872089-ed3a19tlm8k2dhd3jr40mi0vpcekvb6d.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      });
    } catch {
      // Bỏ qua nếu đã được khởi tạo
    }

    try {
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser?.authentication?.idToken;

      // Nếu có Firebase Auth và idToken, đồng bộ vào phiên Firebase
      const firebaseAuth = getFirebaseAuth();
      if (firebaseAuth && idToken) {
        try {
          const credential = GoogleAuthProvider.credential(idToken);
          const userCred = await signInWithCredential(firebaseAuth, credential);
          const u = userCred.user;
          return {
            uid: u.uid,
            email: u.email || googleUser.email,
            displayName: u.displayName || googleUser.name || 'Người dùng Google',
            photoURL: u.photoURL || googleUser.imageUrl,
            providerId: 'google.com'
          };
        } catch (fbErr) {
          console.warn('Firebase signInWithCredential cảnh báo:', fbErr);
        }
      }

      // Trả về trực tiếp thông tin từ Google Play Services
      return {
        uid: googleUser.id,
        email: googleUser.email,
        displayName: googleUser.name || googleUser.email?.split('@')[0] || 'Người dùng Google',
        photoURL: googleUser.imageUrl,
        providerId: 'google.com'
      };
    } catch (nativeErr: any) {
      console.error('Lỗi Google Native Sign-In:', nativeErr);
      const msg = String(nativeErr?.message || nativeErr || '');
      if (msg.includes('12501') || msg.toLowerCase().includes('cancel')) {
        throw new Error('Đã hủy đăng nhập Google.');
      }
      if (msg.includes('10') || msg.toLowerCase().includes('something went wrong')) {
        throw new Error(
          'Lỗi xác thực Google (Mã 10: Developer Error). Vui lòng kiểm tra SHA-1 và Package Name (Tich.San_2953) trên Firebase Console.'
        );
      }
      throw new Error(nativeErr?.message || 'Không thể đăng nhập bằng tài khoản Google trên thiết bị.');
    }
  }

  // 2. Trường hợp chạy trên TRÌNH DUYỆT WEB: Dùng Firebase Popup chuẩn
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    throw new Error(
      'Firebase chưa được cấu hình! Vui lòng cấu hình VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID vào file .env.'
    );
  }

  try {
    const credential: UserCredential = await signInWithPopup(firebaseAuth, googleProvider);
    const user = credential.user;

    if (!user.email) {
      throw new Error('Tài khoản Google của bạn không cung cấp địa chỉ email hợp lệ.');
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL,
      providerId: 'google.com'
    };
  } catch (err: any) {
    handleFirebaseError(err, 'Google');
    throw err;
  }
}

/**
 * Đăng nhập/Đăng ký bằng Facebook Popup
 */
export async function signInWithFacebook(): Promise<SocialAuthUser> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    throw new Error(
      'Firebase chưa được cấu hình! Vui lòng cấu hình VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID vào file .env.'
    );
  }

  try {
    const credential: UserCredential = await signInWithPopup(firebaseAuth, facebookProvider);
    const user = credential.user;

    const email = user.email || `${user.uid}@facebook.user`;

    return {
      uid: user.uid,
      email,
      displayName: user.displayName || 'Facebook User',
      photoURL: user.photoURL,
      providerId: 'facebook.com'
    };
  } catch (err: any) {
    handleFirebaseError(err, 'Facebook');
    throw err;
  }
}

function handleFirebaseError(err: AuthError | any, providerName: string) {
  if (err?.code === 'auth/popup-closed-by-user') {
    throw new Error(`Đã đóng cửa sổ đăng nhập ${providerName}.`);
  }
  if (err?.code === 'auth/cancelled-popup-request') {
    throw new Error(`Yêu cầu đăng nhập ${providerName} đã bị hủy.`);
  }
  if (err?.code === 'auth/account-exists-with-different-credential') {
    throw new Error(`Email này đã được liên kết với một phương thức đăng nhập khác.`);
  }
  if (err?.code === 'auth/network-request-failed') {
    throw new Error(`Không thể kết nối đến máy chủ xác thực của ${providerName}. Vui lòng kiểm tra lại mạng.`);
  }
  if (err?.code === 'auth/configuration-not-found' || err?.code === 'auth/invalid-api-key') {
    throw new Error(`Cấu hình Firebase API Key không hợp lệ. Vui lòng kiểm tra file .env.`);
  }
}

export { auth };
