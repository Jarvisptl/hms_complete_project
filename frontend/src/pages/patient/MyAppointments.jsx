import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import Table from '../../components/Table';

const INITIAL_FILTERS = {
  doctor: '',
  specialization: '',
  date: '',
  status: ''
};

function getStatusTone(status) {
  if (status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'danger';
  return 'warning';
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  useEffect(() => {
    async function load() {
      const [appointmentsRes, recordsRes] = await Promise.all([
        api.get('/appointments/my'),
        api.get('/medical-records/my').catch(() => ({ data: [] }))
      ]);

      const recordMap = Object.fromEntries(
        recordsRes.data.map((record) => [record.appointmentId?._id || record.appointmentId, record])
      );

      setAppointments(
        appointmentsRes.data.map((appointment) => ({
          ...appointment,
          record: recordMap[appointment._id]
        }))
      );
    }

    load().catch(console.error);
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const doctorName = appointment.doctorId?.name || '';
      const specialization = appointment.doctorId?.specialization || '';
      const date = appointment.appointmentDate || '';
      const status = appointment.status || '';

      return (
        doctorName.toLowerCase().includes(filters.doctor.toLowerCase()) &&
        specialization.toLowerCase().includes(filters.specialization.toLowerCase()) &&
        date.toLowerCase().includes(filters.date.toLowerCase()) &&
        (!filters.status || status === filters.status)
      );
    });
  }, [appointments, filters]);

  const hasActiveFilters = Object.values(filters).some((value) => String(value).trim() !== '');

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const columns = [
    { key: 'doctor', header: 'Doctor', render: (row) => row.doctorId?.name || 'N/A' },
    { key: 'specialization', header: 'Specialization', render: (row) => row.doctorId?.specialization || 'N/A' },
    { key: 'appointmentDate', header: 'Date' },
    { key: 'timeSlot', header: 'Time Slot' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <span className={`status-badge ${getStatusTone(row.status)}`}>{row.status}</span>
    },
    {
      key: 'details',
      header: 'View More',
      render: (row) => (
        <button type="button" className="btn btn-outline btn-small" onClick={() => setSelectedAppointment(row)}>
          View More
        </button>
      )
    }
  ];

  return (
    <>
      <div className="card table-card patient-filter-card">
        <div className="section-pad section-head">
          <div>
            <h3>Appointment Filters</h3>
          </div>
        </div>

        <div className="filter-bar">
          <div className="field-group">
            <label>Doctor</label>
            <input
              type="text"
              placeholder="Search doctor"
              value={filters.doctor}
              onChange={(e) => setFilters((prev) => ({ ...prev, doctor: e.target.value }))}
            />
          </div>
          <div className="field-group">
            <label>Specialization</label>
            <input
              type="text"
              placeholder="Search specialization"
              value={filters.specialization}
              onChange={(e) => setFilters((prev) => ({ ...prev, specialization: e.target.value }))}
            />
          </div>
          <div className="field-group">
            <label>Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="field-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="field-group filter-action-group">
            <label>&nbsp;</label>
            <button type="button" className="btn btn-small" onClick={clearFilters} disabled={!hasActiveFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <Table columns={columns} rows={filteredAppointments} emptyText="No appointments match the selected filters." />

      {selectedAppointment && (
        <div className="modal-backdrop" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-card consultation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-clean">
              <div>
                <span className="eyebrow modal-eyebrow">Appointment Details</span>
                <h3>{selectedAppointment.doctorId?.name || 'Appointment'}</h3>
                <p className="muted">
                  {selectedAppointment.appointmentDate} • {selectedAppointment.timeSlot}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-small modal-close-btn"
                onClick={() => setSelectedAppointment(null)}
              >
                Close
              </button>
            </div>

            <div className="consultation-modal-body">
              <div className="consultation-summary consultation-summary-clean">
                <div className="summary-box">
                  <span>Status</span>
                  <p>{selectedAppointment.status}</p>
                </div>
                <div className="summary-box">
                  <span>Specialization</span>
                  <p>{selectedAppointment.doctorId?.specialization || 'N/A'}</p>
                </div>
                <div className="summary-box">
                  <span>Doctor Email</span>
                  <p>{selectedAppointment.doctorId?.email || 'N/A'}</p>
                </div>
                <div className="summary-box summary-box-wide">
                  <span>Reason</span>
                  <p>{selectedAppointment.reason || 'Not provided'}</p>
                </div>
                <div className="summary-box summary-box-wide">
                  <span>Diagnosis</span>
                  <p>{selectedAppointment.record?.diagnosis || 'Pending consultation'}</p>
                </div>
                <div className="summary-box summary-box-wide">
                  <span>Prescription</span>
                  <p>{selectedAppointment.record?.prescription || 'Not available yet'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
