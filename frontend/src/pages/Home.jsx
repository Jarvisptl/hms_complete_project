import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const dashboardByRole = {
  patient: '/patient',
  doctor: '/doctor',
  admin: '/admin'
};

export default function Home() {
  const { user } = useAuth();
  const workspacePath = user ? dashboardByRole[user.role] || '/' : '/login';

  return (
    <div className="home-page stack-lg">
      <section className="card home-hero home-hero-compact">
        <div className="home-hero-copy">
          <span className="eyebrow">MediCore HMS</span>
          <h2>Modern hospital management, kept simple.</h2>
          <p className="muted">
            Appointments, records, and billing in one clean workspace.
          </p>

          {!user ? (
            <div className="actions-row">
              <Link className="btn" to="/login">Sign In</Link>
              <Link className="btn btn-outline" to="/register">Create Account</Link>
            </div>
          ) : (
            <div className="actions-row">
              <Link className="btn" to={workspacePath}>Open {user.role} workspace</Link>
            </div>
          )}
        </div>

        <div className="home-hero-panel home-quick-points">
          <div className="home-panel-card">
            <span className="pill">Platform Focus</span>
            <div className="list-stack home-mini-list">
              <div className="list-item"><strong>Book</strong><span className="muted">Appointments</span></div>
              <div className="list-item"><strong>Track</strong><span className="muted">Medical records</span></div>
              <div className="list-item"><strong>Manage</strong><span className="muted">Bills and users</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-3 home-role-grid">
        <div className="card role-card compact-role-card">
          <div className="role-icon">PT</div>
          <h3>Patients</h3>
          <p className="muted">Book and track care.</p>
        </div>
        <div className="card role-card compact-role-card">
          <div className="role-icon">DR</div>
          <h3>Doctors</h3>
          <p className="muted">Handle visits quickly.</p>
        </div>
        <div className="card role-card compact-role-card">
          <div className="role-icon">AD</div>
          <h3>Admin</h3>
          <p className="muted">Control operations centrally.</p>
        </div>
      </section>

      {!user && (
        <section className="card credentials-card home-access-card">
          <h3>Portal Access</h3>
          <p><strong>Admin:</strong> <code>admin@hms.com</code> / <code>Admin@123</code></p>
          <p><strong>Doctors:</strong> <code>doctor1@hms.com</code> or <code>doctor2@hms.com</code> / <code>Doctor@123</code></p>
          <p className="muted">Patients can register their own account from the sign-up page.</p>
        </section>
      )}
    </div>
  );
}
