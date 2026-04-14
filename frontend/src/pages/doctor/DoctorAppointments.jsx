import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

const INITIAL_FILTERS = { name: '', email: '', phone: '', date: '', status: '' };

function getStatusTone(status) {
  if (status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'danger';
  return 'warning';
}

function getInitials(name = 'Patient') {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [recordsByAppointment, setRecordsByAppointment] = useState({});
  const [forms, setForms] = useState({});
  const [message, setMessage] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const loadData = async () => {
    const { data: appointmentData } = await api.get('/appointments/doctor');
    setAppointments(appointmentData);

    const patientIds = [...new Set(appointmentData.map((item) => item.patientId?._id).filter(Boolean))];
    const recordResponses = await Promise.all(
      patientIds.map((patientId) => api.get(`/medical-records/patient/${patientId}`).catch(() => ({ data: [] })))
    );

    const nextRecords = {};
    recordResponses.flatMap((response) => response.data).forEach((record) => {
      nextRecords[record.appointmentId?._id || record.appointmentId] = record;
    });

    setRecordsByAppointment(nextRecords);
    setForms((current) => {
      const next = { ...current };
      appointmentData.forEach((appointment) => {
        const record = nextRecords[appointment._id];
        next[appointment._id] = {
          diagnosis: record?.diagnosis || current[appointment._id]?.diagnosis || '',
          prescription: record?.prescription || current[appointment._id]?.prescription || '',
          notes: record?.notes || current[appointment._id]?.notes || ''
        };
      });
      return next;
    });
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const patientName = appointment.patientId?.name?.toLowerCase() || '';
      const patientEmail = appointment.patientId?.email?.toLowerCase() || '';
      const patientPhone = appointment.patientId?.phone?.toLowerCase() || '';
      const appointmentDate = appointment.appointmentDate || '';
      const status = appointment.status || '';

      return (
        patientName.includes(filters.name.toLowerCase()) &&
        patientEmail.includes(filters.email.toLowerCase()) &&
        patientPhone.includes(filters.phone.toLowerCase()) &&
        appointmentDate.includes(filters.date) &&
        (!filters.status || status === filters.status)
      );
    });
  }, [appointments, filters]);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment._id === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId]
  );

  const hasActiveFilters = Object.values(filters).some((value) => String(value).trim() !== '');

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const selectedRecord = selectedAppointment ? recordsByAppointment[selectedAppointment._id] : null;
  const selectedForm = selectedAppointment ? forms[selectedAppointment._id] || { diagnosis: '', prescription: '', notes: '' } : null;

  const handleChange = (appointmentId, field, value) => {
    setForms((current) => ({
      ...current,
      [appointmentId]: {
        ...current[appointmentId],
        [field]: value
      }
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const saveRecord = async (appointmentId) => {
    const form = forms[appointmentId] || {};
    await api.post('/medical-records', {
      appointmentId,
      diagnosis: form.diagnosis,
      prescription: form.prescription,
      notes: form.notes,
      status: 'Completed'
    });
    setMessage('Medical record saved and appointment marked as completed.');
    setSelectedAppointmentId(null);
    loadData().catch(console.error);
  };

  const updateStatus = async (appointmentId, status) => {
    await api.patch(`/appointments/${appointmentId}/status`, { status });
    setMessage(`Appointment marked as ${status}.`);
    if (status === 'Cancelled') {
      setSelectedAppointmentId(null);
    }
    loadData().catch(console.error);
  };

  if (!appointments.length) {
    return <div className="card">No appointments assigned.</div>;
  }

  return (
    <div className="stack-lg doctor-appointments-page">
      {message && <div className="info-banner">{message}</div>}

      <div className="card table-card appointments-card">
        <div className="section-head section-pad">
          <div>
            <h3>Assigned Appointments</h3>
            <p className="muted">Review patient details and open a consultation record when needed.</p>
          </div>
        </div>

        <div className="filter-bar">
          <input
            placeholder="Filter by name"
            value={filters.name}
            onChange={(e) => handleFilterChange('name', e.target.value)}
          />
          <input
            placeholder="Filter by email"
            value={filters.email}
            onChange={(e) => handleFilterChange('email', e.target.value)}
          />
          <input
            placeholder="Filter by number"
            value={filters.phone}
            onChange={(e) => handleFilterChange('phone', e.target.value)}
          />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          />
          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

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
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td data-label="Patient">
                    <strong>{appointment.patientId?.name || 'Patient'}</strong>
                    <div className="muted">{appointment.patientId?.email || 'N/A'}</div>
                  </td>
                  <td data-label="Date">{appointment.appointmentDate || 'N/A'}</td>
                  <td data-label="Time">{appointment.timeSlot || 'N/A'}</td>
                  <td data-label="Reason">{appointment.reason || 'Not provided'}</td>
                  <td data-label="Status">
                    <span className={`status-badge ${getStatusTone(appointment.status)}`}>{appointment.status}</span>
                  </td>
                  <td data-label="Details">
                    <button className="btn btn-outline btn-small" onClick={() => setSelectedAppointmentId(appointment._id)}>
                      View More
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAppointment && (
        <div className="modal-backdrop" onClick={() => setSelectedAppointmentId(null)}>
          <div className="modal-card consultation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-clean">
              <div className="consultation-identity">
                <div className="consultation-avatar">{getInitials(selectedAppointment.patientId?.name || 'Patient')}</div>
                <div>
                  {/* <p className="eyebrow modal-eyebrow">Patient Consultation</p> */}
                  <h3>{selectedAppointment.patientId?.name || 'Patient'}</h3>
                  <p className="muted">
                    {selectedAppointment.appointmentDate || 'N/A'} • {selectedAppointment.timeSlot || 'N/A'}
                  </p>
                </div>
              </div>
              <button className="icon-btn modal-close-btn" type="button" onClick={() => setSelectedAppointmentId(null)} aria-label="Close modal">✕</button>
            </div>

            <div className="consultation-modal-body">
              <div className="consultation-meta-grid">
                <div className="meta-tile">
                  <span>Status</span>
                  <strong>{selectedAppointment.status}</strong>
                </div>
                <div className="meta-tile">
                  <span>Reason</span>
                  <strong>{selectedAppointment.reason || 'Not provided'}</strong>
                </div>
                <div className="meta-tile">
                  <span>Email</span>
                  <strong>{selectedAppointment.patientId?.email || 'N/A'}</strong>
                </div>
                <div className="meta-tile">
                  <span>Phone</span>
                  <strong>{selectedAppointment.patientId?.phone || 'N/A'}</strong>
                </div>
              </div>

              <div className="consultation-summary consultation-summary-clean">
                <div className="summary-box">
                  <span>Current Diagnosis</span>
                  <p>{selectedRecord?.diagnosis || 'No diagnosis recorded yet.'}</p>
                </div>
                <div className="summary-box">
                  <span>Current Prescription</span>
                  <p>{selectedRecord?.prescription || 'No prescription recorded yet.'}</p>
                </div>
                <div className="summary-box summary-box-wide">
                  <span>Current Notes</span>
                  <p>{selectedRecord?.notes || 'Consultation notes will appear here after the record is updated.'}</p>
                </div>
              </div>

              <div className="form-header modal-section-header">
                <h3>Consultation Record</h3>
                <p className="muted">Document the diagnosis, prescription, and visit notes for this appointment.</p>
              </div>

              <div className="form-grid form-grid-two">
                <div className="field-group">
                  <label htmlFor={`diagnosis-${selectedAppointment._id}`}>Diagnosis</label>
                  <input
                    id={`diagnosis-${selectedAppointment._id}`}
                    placeholder="Enter diagnosis"
                    value={selectedForm?.diagnosis || ''}
                    onChange={(e) => handleChange(selectedAppointment._id, 'diagnosis', e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor={`prescription-${selectedAppointment._id}`}>Prescription</label>
                  <input
                    id={`prescription-${selectedAppointment._id}`}
                    placeholder="Enter prescription details"
                    value={selectedForm?.prescription || ''}
                    onChange={(e) => handleChange(selectedAppointment._id, 'prescription', e.target.value)}
                  />
                </div>

                <div className="field-group field-span-2">
                  <label htmlFor={`notes-${selectedAppointment._id}`}>Visit Notes</label>
                  <textarea
                    id={`notes-${selectedAppointment._id}`}
                    rows="4"
                    placeholder="Add consultation notes"
                    value={selectedForm?.notes || ''}
                    onChange={(e) => handleChange(selectedAppointment._id, 'notes', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => saveRecord(selectedAppointment._id)}>Save Record & Complete</button>
              <select
                className="action-select"
                value={selectedAppointment.status || 'Pending'}
                onChange={(e) => updateStatus(selectedAppointment._id, e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
