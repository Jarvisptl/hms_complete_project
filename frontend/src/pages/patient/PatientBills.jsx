import { useEffect, useState } from 'react';
import api from '../../api/client';
import Table from '../../components/Table';
import { downloadBillPdf } from '../../utils/downloadBillPdf';

export default function PatientBills() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    api.get('/bills/my').then((res) => setBills(res.data)).catch(console.error);
  }, []);

  const columns = [
    { key: 'billNo', header: 'Bill No' },
    { key: 'doctor', header: 'Doctor', render: (row) => row.appointmentId?.doctorId?.name || 'N/A' },
    { key: 'appointment', header: 'Appointment Date', render: (row) => row.appointmentId?.appointmentDate || 'N/A' },
    { key: 'description', header: 'Description' },
    { key: 'amount', header: 'Amount', render: (row) => `$${row.amount}` },
    { key: 'status', header: 'Status' },
    { key: 'notes', header: 'Notes', render: (row) => row.notes || '—' },
    { key: 'createdAt', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      key: 'download',
      header: 'PDF',
      render: (row) => row.status === 'Paid' ? (
        <button className="btn btn-outline btn-small" onClick={() => downloadBillPdf(row)}>
          Download PDF
        </button>
      ) : (
        <span className="muted">Available after payment</span>
      )
    }
  ];

  return <Table columns={columns} rows={bills} emptyText="No billing records found." />;
}
