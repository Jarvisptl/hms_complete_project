import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import Table from '../../components/Table';

const INITIAL_FILTERS = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  age: ''
};

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  useEffect(() => {
    api.get('/users/patients').then((res) => setPatients(res.data)).catch(console.error);
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesName = patient.name?.toLowerCase().includes(filters.name.toLowerCase());
      const matchesEmail = patient.email?.toLowerCase().includes(filters.email.toLowerCase());
      const matchesPhone = (patient.phone || '').toLowerCase().includes(filters.phone.toLowerCase());
      const matchesGender = !filters.gender || (patient.gender || '').toLowerCase() === filters.gender.toLowerCase();
      const matchesAge = !filters.age || String(patient.age || '').includes(filters.age.trim());

      return matchesName && matchesEmail && matchesPhone && matchesGender && matchesAge;
    });
  }, [patients, filters]);

  const hasActiveFilters = Object.values(filters).some((value) => String(value).trim() !== '');

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'age', header: 'Age' },
    { key: 'gender', header: 'Gender' }
  ];

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="stack-lg">
      <div className="card table-card">
        <div className="section-pad section-head">
          <div>
            <h3>Patient directory</h3>
            <p className="muted">Filter your assigned patients quickly.</p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="field-group">
            <label>Name</label>
            <input
              type="text"
              placeholder="Search by name"
              value={filters.name}
              onChange={(e) => updateFilter('name', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Email</label>
            <input
              type="text"
              placeholder="Search by email"
              value={filters.email}
              onChange={(e) => updateFilter('email', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Phone</label>
            <input
              type="text"
              placeholder="Search by phone"
              value={filters.phone}
              onChange={(e) => updateFilter('phone', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Gender</label>
            <select value={filters.gender} onChange={(e) => updateFilter('gender', e.target.value)}>
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="field-group">
            <label>Age</label>
            <input
              type="text"
              placeholder="e.g. 25"
              value={filters.age}
              onChange={(e) => updateFilter('age', e.target.value)}
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

      <Table columns={columns} rows={filteredPatients} emptyText="No patients match the current filters." />
    </div>
  );
}
