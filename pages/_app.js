import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';

const PUBLIC_PATHS = ['/login'];

export default function App({ Component, pageProps }) {
  const { user, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(router.pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace('/login');
    }
    if (user && isPublic) {
      router.replace('/');
    }
  }, [loading, user, isPublic, router]);

  if (loading) {
    return <div className="loading-screen">Caricamento...</div>;
  }

  if (isPublic) {
    return <Component {...pageProps} onAuthed={refresh} />;
  }

  if (!user) {
    return <div className="loading-screen">Caricamento...</div>;
  }

  return (
    <>
      <Nav user={user} onLogout={async () => { await logout(); router.replace('/login'); }} />
      <div className="page">
        <Component {...pageProps} user={user} />
      </div>
    </>
  );
}
