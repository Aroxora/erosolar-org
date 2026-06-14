import { Injectable, signal, computed } from '@angular/core';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseApp } from '../firebase.config';

const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'daburu.dragon@gmail.com';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAdmin = computed(() => {
    const u = this._user();
    return !!u?.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  });
  readonly isLoggedIn = computed(() => !!this._user());

  constructor() {
    onAuthStateChanged(auth, (u) => this._user.set(u));
  }

  async signInGoogle() {
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error('Google sign-in failed', e);
      alert('Sign-in failed: ' + (e?.message || e));
    }
  }

  async signOut() {
    await signOut(auth);
  }

  get currentUser() { return this._user(); }
}
