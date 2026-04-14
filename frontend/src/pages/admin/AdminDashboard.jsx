import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0
});

function getStatusTone(status) {
  if (status === 'Completed' || status === 'Paid' || status === 'Available') return 'success';
  if (status === 'Pending' || status === 'Limited') return 'warning';
  if (status === 'Cancelled' || status === 'Busy' || status === 'Unpaid') return 'danger';
  return 'info';
}

function MiniBarChart({ data, colorClass = 'blue' }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="chart-bars">
      {data.map((item) => {
        const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 4);
        return (
          <div key={item.label} className="bar-column">
            <div className="bar-track">
              <div className={`bar-fill ${colorClass}`} style={{ height: `${height}%` }} />
            </div>
            <span className="bar-value">{item.value}</span>
            <span className="bar-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    async function load() {
      const [usersRes, appointmentsRes, billsRes] = await Promise.all([
        api.get('/users'),
        api.get('/appointments'),
        api.get('/bills')
      ]);

      setUsers(usersRes.data);
      setAppointments(appointmentsRes.data);
      setBills(billsRes.data);
    }

    load().catch(console.error);
  }, []);

  const doctors = useMemo(() => users.filter((user) => user.role === 'doctor'), [users]);
  const patients = useMemo(() => users.filter((user) => user.role === 'patient'), [users]);
  const completedAppointments = useMemo(() => appointments.filter((item) => item.status === 'Completed'), [appointments]);
  const pendingAppointments = useMemo(() => appointments.filter((item) => item.status === 'Pending'), [appointments]);
  const cancelledAppointments = useMemo(() => appointments.filter((item) => item.status === 'Cancelled'), [appointments]);
  const paidBills = useMemo(() => bills.filter((bill) => bill.status === 'Paid'), [bills]);
  const unpaidBills = useMemo(() => bills.filter((bill) => bill.status !== 'Paid'), [bills]);

  const totalRevenue = paidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const outstandingAmount = unpaidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);

  const recentPatients = [...patients]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const departmentAvailability = doctors.slice(0, 5).map((doctor) => {
    const activeCases = appointments.filter(
      (appointment) => appointment.doctorId?._id === doctor._id && appointment.status === 'Pending'
    ).length;

    let availability = 'Available';
    if (activeCases >= 3) availability = 'Busy';
    else if (activeCases > 0) availability = 'Limited';

    return {
      ...doctor,
      activeCases,
      availability
    };
  });

  const appointmentChartData = [
    { label: 'Pending', value: pendingAppointments.length },
    { label: 'Completed', value: completedAppointments.length },
    { label: 'Cancelled', value: cancelledAppointments.length },
    { label: 'Doctors', value: doctors.length }
  ];

  const revenueChartData = [
    { label: 'Paid', value: paidBills.length },
    { label: 'Unpaid', value: unpaidBills.length },
    { label: 'Visits', value: appointments.length },
    { label: 'Patients', value: patients.length }
  ];

  const systemActivity = [
    ...appointments.slice(0, 4).map((appointment) => ({
      id: `appointment-${appointment._id}`,
      createdAt: appointment.createdAt,
      text: `${appointment.patientId?.name || 'Patient'} • ${appointment.doctorId?.name || 'Doctor'}`,
      meta: `${appointment.appointmentDate} • ${appointment.status}`
    })),
    ...bills.slice(0, 4).map((bill) => ({
      id: `bill-${bill._id}`,
      createdAt: bill.createdAt,
      text: `${bill.billNo} • ${bill.patientId?.name || 'Patient'}`,
      meta: `${currencyFormatter.format(Number(bill.amount || 0))} • ${bill.status}`
    }))
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="dashboard-stack compact-admin-dashboard">
      <div className="kpi-grid">
        <StatCard title="Total Patients" value={patients.length} note="Registered" icon="PT" tone="blue" />
        <StatCard title="Doctors" value={doctors.length} note="Active staff" icon="DR" tone="teal" />
        <StatCard title="Appointments" value={appointments.length} note="Scheduled" icon="AP" tone="blue" />
        <StatCard title="Revenue" value={currencyFormatter.format(totalRevenue)} note="Collected" icon="RV" tone="green" />
        <StatCard title="Pending Bills" value={unpaidBills.length} note="Outstanding" icon="BL" tone="amber" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main stack-lg">
          <div className="grid grid-2">
            <div className="card chart-card">
              <div className="section-head">
                <div>
                  <h3>Appointment Analytics</h3>
                  <p className="muted">Live operational mix across the hospital workflow</p>
                </div>
              </div>
              <MiniBarChart data={appointmentChartData} colorClass="blue" />
            </div>

            <div className="card chart-card">
              <div className="section-head">
                <div>
                  <h3>Revenue Snapshot</h3>
                  <p className="muted">Billing and financial activity overview</p>
                </div>
              </div>
              <MiniBarChart data={revenueChartData} colorClass="green" />
            </div>
          </div>

          <div className="card table-card appointments-card">
            <div className="section-head section-pad">
              <div>
                <h3>Upcoming and Recent Appointments</h3>
                <p className="muted">Operational schedule with status visibility</p>
              </div>
              <span className="pill">{appointments.length} total</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 6).map((appointment) => (
                    <tr key={appointment._id}>
                      <td>{appointment.patientId?.name || 'N/A'}</td>
                      <td>{appointment.doctorId?.name || 'N/A'}</td>
                      <td>{appointment.appointmentDate || 'N/A'}</td>
                      <td>{appointment.timeSlot || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${getStatusTone(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-side stack-lg">
          <div className="card">
            <div className="section-head">
              <div>
                <h3>Recent Patients</h3>
                <p className="muted">Most recently registered profiles</p>
              </div>
            </div>
            <div className="list-stack">
              {recentPatients.map((patient) => (
                <div key={patient._id} className="list-item">
                  <div>
                    <strong>{patient.name}</strong>
                    <p className="muted">{patient.email}</p>
                  </div>
                  <span className="status-badge info">Patient</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <div>
                <h3>Medical Records Overview</h3>
                <p className="muted">Consultation readiness across the platform</p>
              </div>
            </div>
            <div className="summary-list">
              <div className="summary-row"><span>Completed consultations</span><strong>{completedAppointments.length}</strong></div>
              <div className="summary-row"><span>Pending consultations</span><strong>{pendingAppointments.length}</strong></div>
              <div className="summary-row"><span>Completion rate</span><strong>{appointments.length ? `${Math.round((completedAppointments.length / appointments.length) * 100)}%` : '0%'}</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <div>
                <h3>Billing Summary</h3>
                <p className="muted">Financial health and pending action items</p>
              </div>
            </div>
            <div className="summary-list">
              <div className="summary-row"><span>Paid bills</span><strong>{paidBills.length}</strong></div>
              <div className="summary-row"><span>Unpaid bills</span><strong>{unpaidBills.length}</strong></div>
              <div className="summary-row"><span>Collected revenue</span><strong>{currencyFormatter.format(totalRevenue)}</strong></div>
              <div className="summary-row"><span>Outstanding amount</span><strong>{currencyFormatter.format(outstandingAmount)}</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <div>
                <h3>Doctor Availability</h3>
                <p className="muted">Department and doctor load indicators</p>
              </div>
            </div>
            <div className="list-stack">
              {departmentAvailability.map((doctor) => (
                <div key={doctor._id} className="list-item">
                  <div>
                    <strong>{doctor.name}</strong>
                    <p className="muted">{doctor.specialization || 'General Medicine'} • {doctor.activeCases} active cases</p>
                  </div>
                  <span className={`status-badge ${getStatusTone(doctor.availability)}`}>
                    {doctor.availability}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <div>
                <h3>Recent System Activity</h3>
                <p className="muted">Latest platform events and updates</p>
              </div>
            </div>
            <div className="activity-list">
              {systemActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <span className="activity-dot" />
                  <div className="activity-copy">
                    <strong>{item.text}</strong>
                    <p className="muted">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
