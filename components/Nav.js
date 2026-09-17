import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggle from './ThemeToggle';

export default function Nav({ user, onLogout }) {
  const router = useRouter();

  return (
    <div className="nav">
      <div className="nav-inner">
        <div className="nav-tabs">
          <Link href="/" className={`nav-tab ${router.pathname === '/' ? 'active' : ''}`}>
            Visualizza
          </Link>
          <Link href="/insert" className={`nav-tab ${router.pathname === '/insert' ? 'active' : ''}`}>
            Inserisci
          </Link>
        </div>
        <div className="nav-user">
          <ThemeToggle />
          {user && (
            <>
              <span>{user.name}</span>
              <button onClick={onLogout}>Esci</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
