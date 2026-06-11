import { useState } from 'react';
import { api } from '../api/client';

const INITIAL_FORM = {
  patientName: '',
  age: '',
  diagnosis: '',
  treatment: '',
  outcome: 'improved',
  notes: '',
};

export default function OutcomeForm({ onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.age) payload.age = parseInt(payload.age);
      else delete payload.age;

      await api.createOutcome(payload);
      setForm(INITIAL_FORM);
      setExpanded(false);
      onCreated?.();
    } catch (err) {
      setError(err.data?.errors?.map((e) => e.message).join(', ') || err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <button className="btn btn-primary" onClick={() => setExpanded(true)} style={{ marginBottom: '1.5rem' }}>
        + New Patient Outcome
      </button>
    );
  }

  return (
    <div className="outcome-form-card">
      <div className="form-card-header">
        <h3>Record New Patient Outcome</h3>
        <button className="btn-close" onClick={() => setExpanded(false)}>&times;</button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="patientName">Patient Name *</label>
            <input
              id="patientName"
              name="patientName"
              value={form.patientName}
              onChange={handleChange}
              placeholder="Full name"
              required
            />
          </div>
          <div className="form-group form-group-small">
            <label htmlFor="age">Age</label>
            <input
              id="age"
              name="age"
              type="number"
              min="0"
              max="150"
              value={form.age}
              onChange={handleChange}
              placeholder="Age"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="diagnosis">Diagnosis *</label>
          <input
            id="diagnosis"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            placeholder="Primary diagnosis"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="treatment">Treatment *</label>
          <input
            id="treatment"
            name="treatment"
            value={form.treatment}
            onChange={handleChange}
            placeholder="Treatment administered"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="outcome">Outcome *</label>
          <select id="outcome" name="outcome" value={form.outcome} onChange={handleChange}>
            <option value="improved">Improved</option>
            <option value="stable">Stable</option>
            <option value="declined">Declined</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setExpanded(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Outcome'}
          </button>
        </div>
      </form>
    </div>
  );
}
