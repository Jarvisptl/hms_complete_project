import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

const INITIAL_FILTERS = {
  doctor: '',
  specialization: '',
  date: '',
  diagnosis: ''
};

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  useEffect(() => {
    api.get('/medical-records/my').then((res) => setRecords(res.data)).catch(console.error);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const doctor = record.doctorId?.name || '';
      const specialization = record.doctorId?.specialization || '';
      const date = record.appointmentId?.appointmentDate || '';
      const diagnosis = record.diagnosis || '';

      return (
        doctor.toLowerCase().includes(filters.doctor.toLowerCase()) &&
        specialization.toLowerCase().includes(filters.specialization.toLowerCase()) &&
        date.toLowerCase().includes(filters.date.toLowerCase()) &&
        diagnosis.toLowerCase().includes(filters.diagnosis.toLowerCase())
      );
    });
  }, [records, filters]);

  const hasActiveFilters = Object.values(filters).some((value) => String(value).trim() !== '');

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  if (!records.length) {
    return (
      <div className="records-page stack-lg">
        <div className="card records-hero">
          <div>
            <span className="eyebrow">Medical History</span>
            <h2>Medical Records</h2>
            <p className="muted">Your consultation notes, diagnoses, and prescriptions will appear here after completed visits.</p>
          </div>
        </div>

        <div className="card empty-state">
          <h3>No medical records yet</h3>
          <p className="muted">Records will show up here once a doctor completes your consultation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="records-page stack-lg">
      <div className="card table-card patient-filter-card">
        <div className="section-pad section-head">
          <div>
            <h3>Medical Record Filters</h3>
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
            <label>Diagnosis</label>
            <input
              type="text"
              placeholder="Search diagnosis"
              value={filters.diagnosis}
              onChange={(e) => setFilters((prev) => ({ ...prev, diagnosis: e.target.value }))}
            />
          </div>

          <div className="field-group filter-action-group">
            <label>&nbsp;</label>
            <button type="button" className="btn btn-small" onClick={clearFilters} disabled={!hasActiveFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="records-list">
        {filteredRecords.map((record) => (
          <article key={record._id} className="card record-entry-card">
            <div className="record-entry-header">
              <div className="record-doctor-row">
                <div className="record-avatar">MR</div>
                <div>
                  <h3>
                    {record.doctorId?.name || 'Doctor'}
                    {record.doctorId?.specialization ? ` • ${record.doctorId.specialization}` : ''}
                  </h3>
                  <p className="muted">
                    Appointment on {record.appointmentId?.appointmentDate || 'N/A'} at {record.appointmentId?.timeSlot || 'N/A'}
                  </p>
                </div>
              </div>

              <span className="status-badge info">Consultation Record</span>
            </div>

            <div className="record-detail-grid">
              <div className="summary-box">
                <span>Diagnosis</span>
                <p>{record.diagnosis || 'Not added yet'}</p>
              </div>
              <div className="summary-box">
                <span>Prescription</span>
                <p>{record.prescription || 'Not added yet'}</p>
              </div>
              <div className="summary-box summary-box-wide">
                <span>Visit Notes</span>
                <p>{record.notes || 'Not added yet'}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
