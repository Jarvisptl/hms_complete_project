import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleTitles = {
  patient: 'Patient Dashboard',
  doctor: 'Doctor Workspace',
  admin: 'Hospital Command Center'
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const navByRole = {
    patient: [
      { to: '/patient', label: 'Dashboard' },
      { to: '/patient/book-appointment', label: 'Book Appointment' },
      { to: '/patient/appointments', label: 'My Appointments' },
      { to: '/patient/records', label: 'Medical Records' },
      { to: '/patient/bills', label: 'My Bills' },
      { to: '/patient/profile', label: 'Profile' }
    ],
    doctor: [
      { to: '/doctor', label: 'Dashboard' },
      { to: '/doctor/appointments', label: 'Appointments' },
      { to: '/doctor/patients', label: 'Patients' },
      { to: '/doctor/change-password', label: 'Change Password' }
    ],
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/appointments', label: 'Appointments' },
      { to: '/admin/bills', label: 'Bills' }
    ]
  };

  const links = user ? navByRole[user.role] ?? [] : [];
  const headerTitle = user ? roleTitles[user.role] || 'Hospital Management System' : 'Hospital Management System';
  const headerNote = user ? `Operational view for ${user.role}` : 'Enterprise dashboard for hospital operations';
  const initials = user ? user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() : 'HM';

  const handleCloseNav = () => setMobileNavOpen(false);

  const handleLogout = () => {
    setMobileNavOpen(false);
    logout();
  };

  return (
    <div className="shell">
      <button
        type="button"
        className={`sidebar-overlay ${mobileNavOpen ? 'active' : ''}`}
        aria-label="Close navigation menu"
        onClick={handleCloseNav}
      />

      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <Link to="/" className="brand" onClick={handleCloseNav}>
            <span className="brand-mark">✚</span>
            <div>
              <span className="brand-title">MediCore HMS</span>
              <span className="brand-subtitle">Healthcare Operations Suite</span>
            </div>
          </Link>

          <button
            type="button"
            className="icon-btn mobile-close-btn"
            aria-label="Close navigation menu"
            onClick={handleCloseNav}
          >
            ✕
          </button>
        </div>

        <div className="nav-header">{user ? `${user.role} navigation` : 'public navigation'}</div>

        <nav>
          <NavLink to="/" end onClick={handleCloseNav}>Home</NavLink>
          {!user && <NavLink to="/login" onClick={handleCloseNav}>Login</NavLink>}
          {!user && <NavLink to="/register" onClick={handleCloseNav}>Register</NavLink>}
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/patient' || item.to === '/doctor' || item.to === '/admin'}
              onClick={handleCloseNav}
            >
              {item.label}
            </NavLink>
          ))}
          {user && (
            <button type="button" className="btn btn-outline full-width" onClick={handleLogout}>Logout</button>
          )}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-primary">
            <button
              type="button"
              className="icon-btn menu-toggle"
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              ☰
            </button>

            <div className="topbar-copy">
              <p>{headerNote}</p>
              <h1>{headerTitle}</h1>
            </div>
          </div>

          <div className="topbar-tools simple-tools">
            <div className="profile-chip">
              <div className="profile-avatar">{initials}</div>
              <div>
                <strong>{user ? user.name : 'System User'}</strong>
                <span>{user ? user.role : 'Guest mode'}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="page">{children}</section>
      </main>
    </div>
  );
}
