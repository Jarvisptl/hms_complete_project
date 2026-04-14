import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import PasswordInput from '../../components/PasswordInput';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const INITIAL_FILTERS = {
  name: '',
  email: '',
  role: '',
  phone: '',
  specialization: ''
};
const PAGE_SIZE = 5;

function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function getRoleTone(role) {
  if (role === 'admin') return 'danger';
  if (role === 'doctor') return 'info';
  return 'success';
}

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [doctorModalMessage, setDoctorModalMessage] = useState('');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    age: '',
    gender: ''
  });

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers().catch(console.error);
  }, []);

  const stats = useMemo(() => ({
    total: users.length,
    doctors: users.filter((user) => user.role === 'doctor').length,
    patients: users.filter((user) => user.role === 'patient').length,
    admins: users.filter((user) => user.role === 'admin').length
  }), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesName = (user.name || '').toLowerCase().includes(filters.name.toLowerCase());
      const matchesEmail = (user.email || '').toLowerCase().includes(filters.email.toLowerCase());
      const matchesRole = !filters.role || user.role === filters.role;
      const matchesPhone = (user.phone || '').toLowerCase().includes(filters.phone.toLowerCase());
      const matchesSpecialization = (user.specialization || '').toLowerCase().includes(filters.specialization.toLowerCase());

      return matchesName && matchesEmail && matchesRole && matchesPhone && matchesSpecialization;
    });
  }, [users, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const hasActiveFilters = Object.values(filters).some((value) => String(value).trim() !== '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDoctorModalMessage('');
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'phone' ? normalizePhoneDigits(value) : value
    }));
  };

  const updateFilter = (key, value) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setFilters(INITIAL_FILTERS);
  };

  const closeDoctorModal = () => {
    setShowDoctorModal(false);
    setDoctorModalMessage('');
    setFormData({ name: '', email: '', password: '', phone: '', specialization: '', age: '', gender: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = normalizePhoneDigits(formData.phone);
    const trimmedSpecialization = formData.specialization.trim();
    const ageNumber = Number(formData.age);

    if (trimmedName.length < 2) {
      setDoctorModalMessage('Please enter a valid doctor name.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setDoctorModalMessage('Please enter a valid email address.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length !== 10) {
      setDoctorModalMessage('Phone number must be exactly 10 digits. +1 is added automatically.');
      return;
    }

    if (!trimmedSpecialization) {
      setDoctorModalMessage('Please enter a specialization.');
      return;
    }

    if (!Number.isInteger(ageNumber) || ageNumber < 21 || ageNumber > 100) {
      setDoctorModalMessage('Doctor age must be between 21 and 100.');
      return;
    }

    if (!formData.gender) {
      setDoctorModalMessage('Please select a gender.');
      return;
    }

    if (!passwordRegex.test(formData.password)) {
      setDoctorModalMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }

    try {
      setMessage('');
      setDoctorModalMessage('');
      await api.post('/users/doctors', {
        ...formData,
        name: trimmedName,
        email: trimmedEmail,
        phone: `+1${trimmedPhone}`,
        specialization: trimmedSpecialization,
        age: ageNumber
      });
      setMessage('Doctor added successfully.');
      closeDoctorModal();
      loadUsers().catch(console.error);
    } catch (err) {
      setDoctorModalMessage(err.response?.data?.message || 'Unable to add doctor.');
    }
  };

  const handleDeleteUser = (targetUser) => {
    if (targetUser.role === 'admin' || targetUser._id === currentUser?._id) {
      setMessage('This account is protected and cannot be deleted here.');
      return;
    }

    setPendingDeleteUser(targetUser);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUser) return;

    try {
      setMessage('');
      const { data } = await api.delete(`/users/${pendingDeleteUser._id}`);
      setMessage(data.message || 'User deleted successfully.');
      setPendingDeleteUser(null);
      loadUsers().catch(console.error);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to delete user.');
    }
  };

  return (
    <div className="users-admin-page stack-lg">
      <div className="card users-hero">
        <div>
          <span className="eyebrow">User Management</span>
          <h2>Manage Hospital Access</h2>
          <p className="muted">Add doctor accounts and control hospital users from one clean admin view.</p>
        </div>

        <div className="users-overview-grid">
          <div className="metric-card users-stat-card">
            <h3>{stats.total}</h3>
            <p>Total users</p>
          </div>
          <div className="metric-card users-stat-card">
            <h3>{stats.doctors}</h3>
            <p>Doctors</p>
          </div>
          <div className="metric-card users-stat-card">
            <h3>{stats.patients}</h3>
            <p>Patients</p>
          </div>
          <div className="metric-card users-stat-card">
            <h3>{stats.admins}</h3>
            <p>Admins</p>
          </div>
        </div>
      </div>

      <div className="card users-toolbar">
        <div>
          <h3>User Directory</h3>
          <p className="muted">Manage doctor and patient accounts from the table below.</p>
        </div>
        <button type="button" className="btn" onClick={() => setShowDoctorModal(true)}>
          Add Doctor
        </button>
      </div>

      {message && <div className="info-banner">{message}</div>}

      <div className="card table-card users-directory-card">
        <div className="section-head section-pad">
          <div>
            <h3>Active Accounts</h3>
            {/* <p className="muted">Registered users and available controls.</p> */}
          </div>
          <span className="pill">{loadingUsers ? 'Loading...' : `${filteredUsers.length} match${filteredUsers.length === 1 ? '' : 'es'}`}</span>
        </div>

        <div className="filter-bar users-filter-bar">
          <div className="field-group">
            <label>Name</label>
            <input type="text" placeholder="Search name" value={filters.name} onChange={(e) => updateFilter('name', e.target.value)} />
          </div>

          <div className="field-group">
            <label>Email</label>
            <input type="text" placeholder="Search email" value={filters.email} onChange={(e) => updateFilter('email', e.target.value)} />
          </div>

          <div className="field-group">
            <label>Role</label>
            <select value={filters.role} onChange={(e) => updateFilter('role', e.target.value)}>
              <option value="">All</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
          </div>

          <div className="field-group">
            <label>Phone</label>
            <input type="text" placeholder="Search phone" value={filters.phone} onChange={(e) => updateFilter('phone', e.target.value)} />
          </div>

          <div className="field-group">
            <label>Specialization</label>
            <input type="text" placeholder="Search specialization" value={filters.specialization} onChange={(e) => updateFilter('specialization', e.target.value)} />
          </div>

          <div className="field-group filter-action-group">
            <label>&nbsp;</label>
            <button type="button" className="btn btn-small" onClick={clearFilters} disabled={!hasActiveFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Specialization</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan="6">
                    <div className="users-loading-state">Loading users...</div>
                  </td>
                </tr>
              ) : paginatedUsers.length ? (
                paginatedUsers.map((user) => (
                  <tr key={user._id}>
                    <td data-label="Name">
                      <div className="users-directory-name">
                        <strong>{user.name}</strong>
                        <span className="muted">{user.role === 'doctor' ? 'Medical staff' : user.role === 'admin' ? 'Administration' : 'Patient account'}</span>
                      </div>
                    </td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Role">
                      <span className={`status-badge ${getRoleTone(user.role)} users-role-badge`}>{user.role}</span>
                    </td>
                    <td data-label="Phone">{user.phone || '—'}</td>
                    <td data-label="Specialization">{user.specialization || '—'}</td>
                    <td data-label="Actions">
                      <div className="users-table-actions">
                        {user._id === currentUser?._id ? (
                          <span className="status-badge info">Current account</span>
                        ) : user.role === 'admin' ? (
                          <span className="status-badge info">Protected account</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline btn-small btn-danger-lite"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state users-empty-state">
                      <h3>No users found</h3>
                      <p className="muted">Try changing or clearing the current filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="users-pagination users-pagination-stable">
          <span className="muted">
            {loadingUsers ? 'Loading pages...' : filteredUsers.length ? `Page ${currentPage} of ${pageCount}` : 'No pages to show'}
          </span>
          <div className="users-pagination-actions">
            <button type="button" className="btn btn-outline btn-small" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={loadingUsers || currentPage === 1 || !filteredUsers.length}>
              Previous
            </button>
            <button type="button" className="btn btn-outline btn-small" onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))} disabled={loadingUsers || currentPage === pageCount || !filteredUsers.length}>
              Next
            </button>
          </div>
        </div>
      </div>

      {showDoctorModal && (
        <div className="modal-backdrop" onClick={closeDoctorModal}>
          <div className="modal-card users-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-clean">
              <div>
                <span className="eyebrow modal-eyebrow">Doctor Access</span>
                <h3>Add Doctor</h3>
                <p className="muted">Create a doctor profile with login details and specialization.</p>
              </div>
              <button type="button" className="btn btn-outline btn-small modal-close-btn" onClick={closeDoctorModal}>
                Close
              </button>
            </div>

            <div className="consultation-modal-body">
              {doctorModalMessage && <div className="info-banner users-message-banner error-banner">{doctorModalMessage}</div>}

              <form onSubmit={handleSubmit} className="form-grid form-grid-two">
                <div className="field-group field-span-2">
                  <label htmlFor="doctor-name">Doctor Name</label>
                  <input id="doctor-name" name="name" placeholder="Enter doctor name" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label htmlFor="doctor-email">Email</label>
                  <input id="doctor-email" name="email" type="email" placeholder="Enter doctor email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label htmlFor="doctor-phone">Phone</label>
                  <div className="phone-input-row">
                    <span className="phone-prefix">+1</span>
                    <input
                      id="doctor-phone"
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
                  <label htmlFor="doctor-specialization">Specialization</label>
                  <input id="doctor-specialization" name="specialization" placeholder="e.g. Cardiology" value={formData.specialization} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label htmlFor="doctor-age">Age</label>
                  <input id="doctor-age" name="age" type="number" min="21" max="100" placeholder="Enter age" value={formData.age} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label htmlFor="doctor-gender">Gender</label>
                  <select id="doctor-gender" name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="field-group field-span-2">
                  <label htmlFor="doctor-password">Temporary Password</label>
                  <PasswordInput
                    id="doctor-password"
                    name="password"
                    placeholder="Create temporary password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="field-span-2 users-form-actions users-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={closeDoctorModal}>Cancel</button>
                  <button className="btn">Create Doctor Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteUser && (
        <div className="modal-backdrop" onClick={() => setPendingDeleteUser(null)}>
          <div className="modal-card users-modal-card users-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-clean">
              <div>
                <span className="eyebrow modal-eyebrow">Confirm Delete</span>
                <h3>Delete User</h3>
                <p className="muted">This will remove the account and related appointments, bills, and records.</p>
              </div>
              <button type="button" className="btn btn-outline btn-small modal-close-btn" onClick={() => setPendingDeleteUser(null)}>
                Close
              </button>
            </div>

            <div className="consultation-modal-body">
              <div className="info-banner">
                Are you sure you want to delete <strong>{pendingDeleteUser.name}</strong>?
              </div>

              <div className="users-form-actions users-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setPendingDeleteUser(null)}>Cancel</button>
                <button type="button" className="btn btn-danger-lite" onClick={confirmDeleteUser}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
