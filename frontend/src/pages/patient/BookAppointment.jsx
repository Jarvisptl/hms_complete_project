import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

const WORKING_HOURS = [
  '09:00 AM - 09:30 AM',
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM',
  '01:00 PM - 01:30 PM',
  '01:30 PM - 02:00 PM',
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM',
  '03:30 PM - 04:00 PM',
  '04:00 PM - 04:30 PM',
  '04:30 PM - 05:00 PM'
];

export default function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: ''
  });

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    api.get('/users/doctors').then((res) => setDoctors(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!formData.doctorId || !formData.appointmentDate) {
        setSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        const { data } = await api.get('/appointments/availability', {
          params: {
            doctorId: formData.doctorId,
            appointmentDate: formData.appointmentDate
          }
        });

        setSlots(data.slots || []);
      } catch (err) {
        setSlots(
          WORKING_HOURS.map((slot) => ({
            label: slot,
            available: true,
            reason: 'Availability will be verified on booking'
          }))
        );
        setFormData((prev) => ({ ...prev, timeSlot: '' }));
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailability();
  }, [formData.doctorId, formData.appointmentDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMessage('');
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'doctorId' || name === 'appointmentDate' ? { timeSlot: '' } : {})
    }));
  };

  const displaySlots = slots.length
    ? slots
    : WORKING_HOURS.map((slot) => ({
        label: slot,
        available: Boolean(formData.doctorId && formData.appointmentDate),
        reason: 'Select doctor and date first'
      }));

  const canSubmit = Boolean(formData.doctorId && formData.appointmentDate && formData.timeSlot && formData.reason.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', formData);
      setMessage('Appointment booked successfully.');
      setFormData({ doctorId: '', appointmentDate: '', timeSlot: '', reason: '' });
      setSlots([]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not book appointment.');
    }
  };

  return (
    <div className="card form-shell booking-card">
      <div className="form-header">
        <h2>Book Appointment</h2>
        <p className="muted auth-subtitle">Choose a doctor, pick a working day, and select from available clinic hours.</p>
      </div>
      <form onSubmit={handleSubmit} className="form-grid form-grid-two booking-form-grid">
        <div className="field-group field-span-2">
          <label htmlFor="doctorId">Doctor</label>
          <select id="doctorId" name="doctorId" value={formData.doctorId} onChange={handleChange} required>
            <option value="">Select Doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>{doctor.name} - {doctor.specialization}</option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="appointmentDate">Appointment Date</label>
          <input
            id="appointmentDate"
            type="date"
            name="appointmentDate"
            min={today}
            value={formData.appointmentDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="timeSlot">Time Slot</label>
          <select
            id="timeSlot"
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleChange}
            disabled={loadingSlots}
            required
          >
            <option value="">
              {loadingSlots
                ? 'Loading available slots...'
                : !formData.doctorId || !formData.appointmentDate
                  ? 'Select doctor and date first'
                  : 'Select time slot'}
            </option>
            {displaySlots.map((slot) => (
              <option key={slot.label} value={slot.label} disabled={!slot.available}>
                {slot.label}{!slot.available ? ` — ${slot.reason}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group field-span-2">
          <label htmlFor="reason">Reason for Visit</label>
          <textarea id="reason" name="reason" placeholder="Describe the reason for this appointment" value={formData.reason} onChange={handleChange} rows="4" required />
        </div>
        <div className="field-span-2 booking-actions">
          <button className="btn" disabled={!canSubmit || loadingSlots}>Book Appointment</button>
        </div>
      </form>
      {message && <p className="muted mt-12">{message}</p>}
    </div>
  );
}
