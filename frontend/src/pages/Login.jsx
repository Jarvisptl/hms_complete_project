import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const user = await login(formData);
      if (user.role === 'patient') navigate('/patient');
      else if (user.role === 'doctor') navigate('/doctor');
      else navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card auth-card form-shell">
      <div className="form-header">
        <h2>Welcome back</h2>
        <p className="muted auth-subtitle">Sign in as an admin, doctor, or patient to continue.</p>
      </div>
      {/* <div className="info-banner">Demo access is ready for the admin and doctor accounts after backend startup.</div> */}
      <form onSubmit={handleSubmit} className="form-grid mt-12">
        <div className="field-group">
          <label htmlFor="login-email">Email Address</label>
          <input id="login-email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="field-group">
          <label htmlFor="login-password">Password</label>
          <PasswordInput
            id="login-password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="form-feedback-slot">
          {error && <p className="error-text">{error}</p>}
        </div>
        <button className="btn full-width" disabled={submitting}>{submitting ? 'Signing in...' : 'Login'}</button>
      </form>
    </div>
  );
}
