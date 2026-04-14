import { useEffect, useState } from 'react';
import api from '../../api/client';
import Table from '../../components/Table';

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = () => api.get('/appointments').then((res) => setAppointments(res.data));

  useEffect(() => {
    loadAppointments().catch(console.error);
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/appointments/${id}/status`, { status });
    loadAppointments().catch(console.error);
  };

  const columns = [
    { key: 'patient', header: 'Patient', render: (row) => row.patientId?.name || 'N/A' },
    { key: 'doctor', header: 'Doctor', render: (row) => row.doctorId?.name || 'N/A' },
    { key: 'appointmentDate', header: 'Date' },
    { key: 'timeSlot', header: 'Time' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: 'Update Status',
      render: (row) => (
        <select
          className="action-select"
          value={row.status || 'Pending'}
          onChange={(e) => updateStatus(row._id, e.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      )
    }
  ];

  return <Table columns={columns} rows={appointments} emptyText="No appointments found." />;
}
