import { useState } from 'react';
import api from '../../api/client';
import PasswordInput from '../../components/PasswordInput';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function DoctorChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMessage('');
    setError('');
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordRegex.test(formData.newPassword)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const { data } = await api.put('/users/me/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setMessage(data.message || 'Password changed successfully.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page stack-lg">
      <div className="card profile-hero">
        <div>
          <span className="eyebrow">Doctor Security</span>
          <h2>Change Password</h2>
        </div>
      </div>

      <div className="card form-shell profile-form-card doctor-password-card">
        <div className="form-header">
          <h2>Password Settings</h2>
          <p className="muted auth-subtitle">Enter your current password and choose a stronger new one.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field-group">
            <label htmlFor="currentPassword">Current Password</label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="field-group">
            <label htmlFor="newPassword">New Password</label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <p className="muted">Use at least 8 characters with uppercase, lowercase, number, and special character.</p>
          </div>

          <div className="field-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-feedback-slot">
            {error && <p className="error-text">{error}</p>}
            {!error && message && <p className="muted">{message}</p>}
          </div>

          <div className="profile-save-row">
            <button className="btn" disabled={saving}>{saving ? 'Updating...' : 'Change Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
