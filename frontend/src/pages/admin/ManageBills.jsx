import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { downloadBillPdf } from '../../utils/downloadBillPdf';

function getBillTone(status) {
  return status === 'Paid' ? 'success' : 'warning';
}

export default function ManageBills() {
  const [bills, setBills] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [formData, setFormData] = useState({ appointmentId: '', amount: '', description: '', notes: '', status: 'Unpaid' });

  const loadData = async () => {
    const [billsRes, appointmentsRes] = await Promise.all([api.get('/bills'), api.get('/appointments')]);
    setBills(billsRes.data);
    setAppointments(appointmentsRes.data.filter((appointment) => appointment.status === 'Completed'));
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const closeBillModal = () => {
    setShowBillModal(false);
    setFormData({ appointmentId: '', amount: '', description: '', notes: '', status: 'Unpaid' });
  };

  const availableAppointments = useMemo(() => {
    const billedAppointmentIds = new Set(bills.map((bill) => bill.appointmentId?._id || bill.appointmentId));
    return appointments.filter((appointment) => !billedAppointmentIds.has(appointment._id));
  }, [appointments, bills]);

  const billingSummary = useMemo(() => ({
    total: bills.length,
    paid: bills.filter((bill) => bill.status === 'Paid').length,
    unpaid: bills.filter((bill) => bill.status !== 'Paid').length,
    revenue: bills.filter((bill) => bill.status === 'Paid').reduce((sum, bill) => sum + Number(bill.amount || 0), 0)
  }), [bills]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      await api.post('/bills', { ...formData, amount: Number(formData.amount) });
      closeBillModal();
      setMessage('Bill created successfully.');
      loadData().catch(console.error);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to create bill.');
    }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/bills/${id}/status`, { status });
    loadData().catch(console.error);
  };

  return (
    <div className="bills-admin-page stack-lg">
      <div className="card bills-hero">
        <div>
          <span className="eyebrow">Billing Management</span>
          <h2>Manage Bills</h2>
          <p className="muted">Generate invoices for completed visits and keep payment tracking organized.</p>
        </div>

        <div className="users-overview-grid bills-stats-grid">
          <div className="metric-card users-stat-card">
            <h3>{billingSummary.total}</h3>
            <p>Total bills</p>
          </div>
          <div className="metric-card users-stat-card">
            <h3>{billingSummary.paid}</h3>
            <p>Paid</p>
          </div>
          <div className="metric-card users-stat-card">
            <h3>{billingSummary.unpaid}</h3>
            <p>Unpaid</p>
          </div>
          <div className="metric-card users-stat-card">
            <h3>${billingSummary.revenue}</h3>
            <p>Collected</p>
          </div>
        </div>
      </div>

      <div className="card users-toolbar bills-toolbar">
        <div>
          <h3>Billing Records</h3>
          <p className="muted">Create and manage hospital invoices from the table below.</p>
        </div>
        <button type="button" className="btn" onClick={() => setShowBillModal(true)}>
          Create Bill
        </button>
      </div>

      {message && <div className="info-banner">{message}</div>}

      <div className="card table-card bills-directory-card">
        <div className="section-head section-pad">
          <div>
            <h3>All Bills</h3>
            <p className="muted">Generated invoices and payment controls.</p>
          </div>
          <span className="pill">{bills.length} record{bills.length === 1 ? '' : 's'}</span>
        </div>

        {!bills.length ? (
          <div className="empty-state">
            <h3>No bills yet</h3>
            <p className="muted">Create a bill from a completed appointment to see it here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((row) => (
                  <tr key={row._id}>
                    <td data-label="Bill No"><strong>{row.billNo}</strong></td>
                    <td data-label="Patient">{row.patientId?.name || row.appointmentId?.patientId?.name || 'N/A'}</td>
                    <td data-label="Doctor">{row.appointmentId?.doctorId?.name || 'N/A'}</td>
                    <td data-label="Amount">${row.amount}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${getBillTone(row.status)}`}>{row.status}</span>
                    </td>
                    <td data-label="Description">{row.description}</td>
                    <td data-label="Actions">
                      <div className="actions-row bills-actions-row">
                        <select
                          className="action-select"
                          value={row.status || 'Unpaid'}
                          onChange={(e) => updateStatus(row._id, e.target.value)}
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                        </select>
                        {row.status === 'Paid' && (
                          <button className="btn btn-outline btn-small" onClick={() => downloadBillPdf(row)}>Download PDF</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showBillModal && (
        <div className="modal-backdrop" onClick={closeBillModal}>
          <div className="modal-card users-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-clean">
              <div>
                <span className="eyebrow modal-eyebrow">Billing</span>
                <h3>Create Bill</h3>
                <p className="muted">Generate a new invoice from a completed appointment.</p>
              </div>
              <button type="button" className="btn btn-outline btn-small modal-close-btn" onClick={closeBillModal}>
                Close
              </button>
            </div>

            <div className="consultation-modal-body">
              {!availableAppointments.length && (
                <div className="info-banner">No completed appointments are currently available for billing.</div>
              )}

              <form onSubmit={handleSubmit} className="form-grid form-grid-two">
                <div className="field-group field-span-2">
                  <label htmlFor="appointmentId">Completed Appointment</label>
                  <select id="appointmentId" name="appointmentId" value={formData.appointmentId} onChange={handleChange} required>
                    <option value="">Select completed appointment</option>
                    {availableAppointments.map((appointment) => (
                      <option key={appointment._id} value={appointment._id}>
                        {appointment.patientId?.name} - {appointment.doctorId?.name} - {appointment.appointmentDate} {appointment.timeSlot}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="amount">Amount</label>
                  <input id="amount" name="amount" type="number" min="1" placeholder="Consultation fee" value={formData.amount} onChange={handleChange} required />
                </div>

                <div className="field-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" value={formData.status} onChange={handleChange}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="field-group field-span-2">
                  <label htmlFor="description">Description</label>
                  <input id="description" name="description" placeholder="Bill description" value={formData.description} onChange={handleChange} required />
                </div>

                <div className="field-group field-span-2">
                  <label htmlFor="notes">Notes</label>
                  <textarea id="notes" name="notes" rows="3" placeholder="Medicine or treatment note" value={formData.notes} onChange={handleChange} />
                </div>

                <div className="field-span-2 users-form-actions users-modal-actions">
                  <button type="button" className="btn btn-outline" onClick={closeBillModal}>Cancel</button>
                  <button className="btn" disabled={!availableAppointments.length}>Generate Bill</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
