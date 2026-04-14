import { useEffect, useState } from 'react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';

export default function PatientDashboard() {
  const [summary, setSummary] = useState({ appointments: 0, upcoming: 0, bills: 0 });

  useEffect(() => {
    async function load() {
      const [appointmentsRes, billsRes] = await Promise.all([
        api.get('/appointments/my'),
        api.get('/bills/my')
      ]);

      const appointments = appointmentsRes.data;
      const today = new Date().toISOString().split('T')[0];

      setSummary({
        appointments: appointments.length,
        upcoming: appointments.filter((item) => item.status !== 'Cancelled' && item.appointmentDate >= today).length,
        bills: billsRes.data.length
      });
    }

    load().catch(console.error);
  }, []);

  return (
    <div className="stack-lg">
      <div className="grid grid-3">
        <StatCard title="Total Booked" value={summary.appointments} note="All your appointments" icon="BK" tone="blue" />
        <StatCard title="Upcoming Visits" value={summary.upcoming} note="Scheduled and active" icon="UP" tone="teal" />
        <StatCard title="Bills" value={summary.bills} note="Billing records available" icon="BL" tone="amber" />
      </div>

      <div className="card">
        <h3>Patient Portal</h3>
        <p className="muted">Use the sidebar to book appointments, check consultation notes, and review your bills after a completed visit.</p>
      </div>
    </div>
  );
}
