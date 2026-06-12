import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const OUTCOME_COLORS = {
  improved: '#10b981',
  stable: '#f59e0b',
  declined: '#ef4444',
};

export default function OutcomeList({ refreshKey }) {
  const [outcomes, setOutcomes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter) params.outcome = filter;

      const [outcomeRes, statsRes] = await Promise.all([
        api.getOutcomes(params),
        api.getStats(),
      ]);
      setOutcomes(outcomeRes.data.outcomes);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load outcomes');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  return (
    <div>
      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item stat-improved">
            <span className="stat-number">{stats.improved}</span>
            <span className="stat-label">Improved</span>
          </div>
          <div className="stat-item stat-stable">
            <span className="stat-number">{stats.stable}</span>
            <span className="stat-label">Stable</span>
          </div>
          <div className="stat-item stat-declined">
            <span className="stat-number">{stats.declined}</span>
            <span className="stat-label">Declined</span>
          </div>
        </div>
      )}

      <div className="list-header">
        <h3>Patient Outcomes</h3>
        <div className="filter-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Outcomes</option>
            <option value="improved">Improved</option>
            <option value="stable">Stable</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading outcomes...</div>
      ) : outcomes.length === 0 ? (
        <div className="empty-state">
          <p>No outcomes recorded yet.</p>
          <p className="empty-hint">Click "New Patient Outcome" to add the first one.</p>
        </div>
      ) : (
        <div className="outcome-grid">
          {outcomes.map((o) => (
            <div key={o._id} className="outcome-card">
              <div className="outcome-card-header">
                <div className="patient-info">
                  <h4>{o.patientName}</h4>
                  {o.age != null && <span className="age-badge">{o.age} yrs</span>}
                </div>
                <span
                  className="outcome-badge"
                  style={{ backgroundColor: OUTCOME_COLORS[o.outcome] }}
                >
                  {o.outcome}
                </span>
              </div>
              <div className="outcome-card-body">
                <div className="outcome-field">
                  <span className="field-label">Diagnosis</span>
                  <span className="field-value">{o.diagnosis}</span>
                </div>
                <div className="outcome-field">
                  <span className="field-label">Treatment</span>
                  <span className="field-value">{o.treatment}</span>
                </div>
                {o.notes && (
                  <div className="outcome-field">
                    <span className="field-label">Notes</span>
                    <span className="field-value notes">{o.notes}</span>
                  </div>
                )}
              </div>
              <div className="outcome-card-footer">
                <span>By {o.createdBy}</span>
                <span>{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
