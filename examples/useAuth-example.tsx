import PocketBase from 'pocketbase';
import { type FormEvent, useState } from 'react';
import { PocketBaseProvider, useAuth } from '../src';

// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

function App() {
  return (
    <PocketBaseProvider pocketBase={pb}>
      <AuthExample />
    </PocketBaseProvider>
  );
}

// Authentication hook usage example
function AuthExample() {
  const { user, isAuthenticated, signIn, signUp, signOut, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (isAuthenticated) {
    return (
      <div>
        <h2>Welcome, {user?.email}!</h2>
        <p>You are successfully logged in.</p>
        <button type="button" onClick={signOut}>
          Sign Out
        </button>
      </div>
    );
  }

  const handleSignInWithEmail = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signIn.email(email, password);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      await signIn.social('google');
    } catch (err) {
      console.error('Google sign in failed:', err);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signUp.email(email, password);
    } catch (err) {
      console.error('Sign up failed:', err);
    }
  };

  return (
    <div>
      <h2>Authentication</h2>

      <form onSubmit={handleSignInWithEmail}>
        <h3>Sign In with Email</h3>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In with Email'}
        </button>
      </form>

      <div>
        <h3>Social Authentication</h3>
        <button type="button" onClick={handleSignInWithGoogle} disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In with Google'}
        </button>
      </div>

      <form onSubmit={handleSignUp}>
        <h3>Sign Up</h3>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Confirm Password" required />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default App;
