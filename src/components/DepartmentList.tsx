import { useEffect, useState } from 'react';
import { fetchDepartments } from '@/api/departments';

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments()
      .then(setDepartments)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Departments</h2>
      <ul className="space-y-2">
        {departments.map((dept) => (
          <li key={dept.id} className="bg-gray-100 p-2 rounded shadow">
            <strong>{dept.name}</strong> ({dept.code})
          </li>
        ))}
      </ul>
    </div>
  );
}
