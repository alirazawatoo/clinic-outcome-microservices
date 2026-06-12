import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import OutcomeForm from './OutcomeForm';
import OutcomeList from './OutcomeList';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <h2>Patient Outcome Tracker</h2>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <span className="clinic-name">{user.clinicName}</span>
          </div>
          <button className="btn btn-outline" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <OutcomeForm onCreated={handleCreated} />
        <OutcomeList refreshKey={refreshKey} />
      </main>
    </div>
  );
}
