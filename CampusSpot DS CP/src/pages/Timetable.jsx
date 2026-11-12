import { useState, useMemo } from 'react';
import { Filter, Calendar, BookOpen, Clock, Users, Building, Activity } from 'lucide-react';

export default function Timetable({ data }) {
  const [filterDivision, setFilterDivision] = useState('IT-A');
  const [filterDay, setFilterDay] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterRoom, setFilterRoom] = useState('All');

  const filtered = data.timetables.filter(t => {
    if (filterDivision !== 'All' && t.division !== filterDivision) return false;
    if (filterDay !== 'All' && t.day !== filterDay) return false;
    if (filterType !== 'All' && t.type !== filterType && t.type !== 'Not available in current dataset') {
      if (filterType === 'Theory' && !t.type.toLowerCase().includes('theory')) return false;
      if (filterType === 'Lab' && !t.type.toLowerCase().includes('lab')) return false;
      if (filterType === 'Tutorial' && !t.type.toLowerCase().includes('tutorial')) return false;
    }
    if (filterRoom !== 'All' && t.room !== filterRoom) return false;
    return true;
  });

  // Unique rooms for dropdown
  const uniqueRooms = useMemo(() => {
    const rooms = new Set();
    data.timetables.forEach(t => {
      if (t.room && t.room !== 'Not available in current dataset') rooms.add(t.room);
    });
    return Array.from(rooms).sort();
  }, [data.timetables]);

  // Division Summary
  const summary = useMemo(() => {
    let theory = 0;
    let lab = 0;
    let tutorial = 0;
    
    filtered.forEach(t => {
      const type = (t.type || '').toLowerCase();
      if (type.includes('theory')) theory++;
      else if (type.includes('lab')) lab++;
      else if (type.includes('tutorial')) tutorial++;
    });
    
    return { theory, lab, tutorial, total: filtered.length };
  }, [filtered]);

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="text-center mb-5">
        <h1 className="serif mb-1" style={{ fontSize: '2.5rem', color: '#0F3460' }}>CampusSpot</h1>
        <h2 className="text-muted" style={{ fontWeight: 400 }}>Smart Classroom & Study Space Finder</h2>
        <h3 className="serif mt-4" style={{ fontSize: '1.8rem', color: '#0F3460' }}>IT Department Timetable</h3>
      </div>
      
      <div className="card shadow-sm mb-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
        <div className="flex items-center gap-2 mb-3 text-muted" style={{ fontWeight: 600 }}>
          <Filter size={18} /> Filters
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '0.9rem' }}>Division</label>
            <select className="form-control" value={filterDivision} onChange={e => setFilterDivision(e.target.value)}>
              <option>All</option>
              {data.manifest.divisions.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '0.9rem' }}>Day</label>
            <select className="form-control" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
              <option>All</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '0.9rem' }}>Class Type</label>
            <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option>All</option>
              <option>Theory</option>
              <option>Lab</option>
              <option>Tutorial</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '0.9rem' }}>Room</label>
            <select className="form-control" value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
              <option>All</option>
              {uniqueRooms.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <h4 className="mb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', color: '#0F3460' }}>
          Data Summary {filterDivision !== 'All' ? `(${filterDivision})` : ''}
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div style={{ padding: '12px', backgroundColor: '#eef2ff', borderRadius: '8px', color: '#4f46e5' }}><BookOpen size={24} /></div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>Theory Classes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.theory}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#16a34a' }}><Activity size={24} /></div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>Lab Classes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.lab}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px', color: '#d97706' }}><Users size={24} /></div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>Tutorials</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.tutorial}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', color: '#4b5563' }}><Calendar size={24} /></div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>Total Entries</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.total}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ margin: 0, maxHeight: '600px', overflowY: 'auto' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead style={{ backgroundColor: '#0F3460', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ color: 'white' }}>Day</th>
                <th style={{ color: 'white' }}>Time</th>
                <th style={{ color: 'white' }}>Division</th>
                <th style={{ color: 'white' }}>Subject</th>
                <th style={{ color: 'white' }}>Subject Code</th>
                <th style={{ color: 'white' }}>Type</th>
                <th style={{ color: 'white' }}>Batch</th>
                <th style={{ color: 'white' }}>Room</th>
                <th style={{ color: 'white' }}>Faculty</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => {
                const isUnavailable = (val) => !val || val === 'Not available in current dataset';
                const batchDisplay = isUnavailable(entry.batch) ? <span className="text-muted" style={{fontSize: '0.85rem'}}>Batch information unavailable</span> : <strong>{entry.batch}</strong>;
                
                let typeColor = 'badge-secondary';
                const lowerType = (entry.type || '').toLowerCase();
                if (lowerType.includes('theory')) typeColor = 'badge-primary';
                else if (lowerType.includes('lab')) typeColor = 'badge-success';
                else if (lowerType.includes('tutorial')) typeColor = 'badge-warning';

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ fontWeight: 500 }}>{entry.day}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {isUnavailable(entry.startTime) ? 'N/A' : entry.startTime} - {isUnavailable(entry.endTime) ? 'N/A' : entry.endTime}
                    </td>
                    <td><span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>{entry.division}</span></td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={entry.subject}>{entry.subject}</td>
                    <td className="text-muted">{entry.subjectCode}</td>
                    <td>
                      {!isUnavailable(entry.type) ? <span className={`badge ${typeColor}`}>{entry.type}</span> : <span className="text-muted">N/A</span>}
                    </td>
                    <td>{batchDisplay}</td>
                    <td>{!isUnavailable(entry.room) ? <span style={{ fontWeight: 600, color: '#0F3460' }}>{entry.room}</span> : <span className="text-muted">N/A</span>}</td>
                    <td>{!isUnavailable(entry.faculty) ? entry.faculty : <span className="text-muted">N/A</span>}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="9" className="text-center text-muted" style={{ padding: '3rem' }}>No timetable entries found for these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
