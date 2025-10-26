import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useHashConnect } from '../hooks/useHashConnect';
import './Layout.css';

const navItems = [
  { label: 'Ads', to: '/ads' },
  { label: 'Orders', to: '/orders' },
  { label: 'Register as Agent', to: '/agents/register' }
];

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { connect, disconnect, isConnected, accountId, walletState, hashpackAvailable } =
    useHashConnect();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">ζ</div>
          <div>
            <h1>Zeta Logistics</h1>
            <p>Peer-to-peer, onchain fulfilment</p>
          </div>
        </div>
        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="wallet-controls">
          <span className={`status-chip state-${walletState.toLowerCase()}`}>
            {walletState}
          </span>
          {isConnected ? (
            <button className="ghost" onClick={disconnect}>
              {accountId}
            </button>
          ) : (
            <button onClick={connect}>Connect HashPack</button>
          )}
          {!hashpackAvailable && <span className="hint">Open HashPack to pair</span>}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};
