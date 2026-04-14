import { useEffect, useState } from 'react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    api.get('/appointments/doctor').then((res) => setAppointments(res.data)).catch(console.error);
  }, []);

  const pending = appointments.filter((item) => item.status === 'Pending').length;
  const completed = appointments.filter((item) => item.status === 'Completed').length;

  return (
    <div className="grid grid-3">
      <StatCard title="Assigned Appointments" value={appointments.length} note="All consultations assigned to you" icon="AP" tone="blue" />
      <StatCard title="Pending" value={pending} note="Waiting for consultation" icon="PN" tone="amber" />
      <StatCard title="Completed" value={completed} note="Notes and prescription added" icon="OK" tone="green" />
    </div>
  );
}
