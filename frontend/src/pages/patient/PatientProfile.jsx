import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

function normalizePhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits.slice(0, 10);
}

function formatPhoneForSubmit(value) {
  const digits = normalizePhoneDigits(value);
  return digits ? `+1${digits}` : '';
}

export default function PatientProfile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', age: '', gender: '' });
  const [phoneInput, setPhoneInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/me')
      .then((res) => {
        setProfile(res.data);
        setFormData({
          name: res.data.name || '',
          email: res.data.email || '',
          age: res.data.age || '',
          gender: res.data.gender || ''
        });
        setPhoneInput(normalizePhoneDigits(res.data.phone));
      })
      .catch(console.error);
  }, []);

  const initials = useMemo(() => {
    if (!profile?.name) return 'PT';
    return profile.name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [profile?.name]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setMessage('');
    setError('');

    if (name === 'phone') {
      setPhoneInput(normalizePhoneDigits(value));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');
      const payload = {
        name: formData.name,
        phone: formatPhoneForSubmit(phoneInput),
        age: Number(formData.age || 0),
        gender: formData.gender
      };
      const { data } = await api.put('/users/me', payload);
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        age: data.age || '',
        gender: data.gender || ''
      });
      setPhoneInput(normalizePhoneDigits(data.phone));
      setMessage('Profile updated successfully.');
      localStorage.setItem('hms_user', JSON.stringify(data));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="card">Loading profile...</div>;

  return (
    <div className="profile-page stack-lg">
      <div className="card profile-hero">
        <div className="profile-hero-main">
          <div className="profile-avatar-large">{initials}</div>
          <div>
            <h2>{profile.name || 'My Profile'}</h2>
            <p className="muted">Keep your account details updated for smoother appointments, records, and billing communication.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2 profile-layout">
        <div className="card profile-summary-card">
          <div className="section-head">
            <div>
              <h3>Profile Summary</h3>
              <p className="muted profile-summary-note">A quick view of your registered details.</p>
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="summary-box">
              <span>Email</span>
              <p>{profile.email || 'Not available'}</p>
            </div>
            <div className="summary-box">
              <span>Phone</span>
              <p>{formatPhoneForSubmit(profile.phone) || 'Not provided'}</p>
            </div>
            <div className="summary-box">
              <span>Age</span>
              <p>{profile.age || 'Not set'}</p>
            </div>
            <div className="summary-box">
              <span>Gender</span>
              <p>{profile.gender || 'Not selected'}</p>
            </div>
          </div>
        </div>

        <div className="card form-shell profile-form-card">
          <div className="form-header">
            <h2>Edit Profile</h2>
            <p className="muted auth-subtitle">Update your contact and personal information below.</p>
          </div>

          <form onSubmit={handleSubmit} className="form-grid form-grid-two">
            <div className="field-group field-span-2">
              <label htmlFor="profile-name">Full Name</label>
              <input id="profile-name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="field-group field-span-2">
              <label htmlFor="profile-email">Email Address</label>
              <input id="profile-email" name="email" value={formData.email} readOnly />
            </div>

            <div className="field-group">
              <label htmlFor="profile-phone">Phone Number</label>
              <div className="phone-input-row">
                <span className="phone-prefix">+1</span>
                <input
                  id="profile-phone"
                  name="phone"
                  placeholder="5551234567"
                  value={phoneInput}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength="10"
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="profile-age">Age</label>
              <input id="profile-age" name="age" type="number" min="1" max="120" value={formData.age} onChange={handleChange} />
            </div>

            <div className="field-group field-span-2">
              <label htmlFor="profile-gender">Gender</label>
              <select id="profile-gender" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {error && <p className="error-text field-span-2">{error}</p>}
            {message && <p className="muted field-span-2">{message}</p>}

            <div className="field-span-2 profile-save-row">
              <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
