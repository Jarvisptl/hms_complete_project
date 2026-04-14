import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    age: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'phone' ? normalizePhoneDigits(value) : value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = normalizePhoneDigits(formData.phone);
    const ageNumber = Number(formData.age);

    if (trimmedName.length < 2) return 'Please enter a valid full name.';
    if (!emailRegex.test(trimmedEmail)) return 'Please enter a valid email address.';
    if (!phoneRegex.test(trimmedPhone)) return 'Phone number must be exactly 10 digits. +1 is added automatically.';
    if (!Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 120) return 'Age must be between 1 and 120.';
    if (!formData.gender) return 'Please select your gender.';
    if (!passwordRegex.test(formData.password)) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
    }
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError('');
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: `+1${normalizePhoneDigits(formData.phone)}`,
        gender: formData.gender,
        age: Number(formData.age)
      });
      navigate('/patient');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="card auth-card form-shell">
      <div className="form-header">
        <h2>Create patient account</h2>
        <p className="muted auth-subtitle">Register once to start booking appointments and tracking your visits online.</p>
      </div>
      <form onSubmit={handleSubmit} className="form-grid form-grid-two">
        <div className="field-group field-span-2">
          <label htmlFor="register-name">Full Name</label>
          <input
            id="register-name"
            name="name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="register-email">Email Address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="register-phone">Phone Number</label>
          <div className="phone-input-row">
            <span className="phone-prefix">+1</span>
            <input
              id="register-phone"
              name="phone"
              placeholder="5551234567"
              value={formData.phone}
              onChange={handleChange}
              inputMode="numeric"
              maxLength="10"
              required
            />
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="register-age">Age</label>
          <input
            id="register-age"
            name="age"
            type="number"
            min="1"
            max="120"
            placeholder="Enter age"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="register-gender">Gender</label>
          <select id="register-gender" name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="field-group field-span-2">
          <label htmlFor="register-password">Password</label>
          <PasswordInput
            id="register-password"
            name="password"
            placeholder="Create strong password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
          <p className="muted">Use at least 8 characters with uppercase, lowercase, a number, and a special character.</p>
        </div>
        <div className="field-group field-span-2">
          <label htmlFor="register-confirm-password">Confirm Password</label>
          <PasswordInput
            id="register-confirm-password"
            name="confirmPassword"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="form-feedback-slot field-span-2">
          {error && <p className="error-text">{error}</p>}
        </div>
        <div className="field-span-2">
          <button className="btn full-width">Create Account</button>
        </div>
      </form>
    </div>
  );
}
