import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, CheckCircle, Upload } from 'lucide-react';

export default function AdminDashboard({ data }) {
  // Extract data stats
  const totalRooms = data.rooms.length; // 26
  const totalDivisions = data.manifest.divisions.length; // 6
  const loadedDivisions = Object.keys(data.manifest.verified_timetable_sources).length; // 4
  const verifiedList = Object.keys(data.manifest.verified_timetable_sources);
  const unverifiedList = data.manifest.unverified_sources;

  // Data Quality Indicator stats
  const dataQuality = {};
  data.manifest.divisions.forEach(div => {
    const records = data.timetables.filter(t => t.division === div);
    const verified = records.filter(t => 
      t.day !== 'Not available in current dataset' && 
      t.startTime !== 'Not available in current dataset' && 
      t.room !== 'Not available in current dataset'
    ).length;
    const needsVerification = records.length - verified;
    
    dataQuality[div] = {
      imported: records.length,
      verified,
      needsVerification
    };
  });

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="serif" style={{ fontSize: '2rem', color: '#0F3460' }}>Admin Dashboard</h2>
          <p className="text-muted">Manage CampusSpot Timetable Data</p>
        </div>
        <Link to="/admin/import" className="btn btn-primary shadow-sm flex items-center gap-2">
          <Upload size={18} /> Import Excel
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card shadow-sm text-center" style={{ borderTop: '4px solid #0F3460' }}>
          <h3 className="text-muted mb-1" style={{ fontSize: '1rem' }}>Total Rooms</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0F3460' }}>{totalRooms}</div>
        </div>
        <div className="card shadow-sm text-center" style={{ borderTop: '4px solid #28A745' }}>
          <h3 className="text-muted mb-1" style={{ fontSize: '1rem' }}>Total IT Divisions</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28A745' }}>{totalDivisions}</div>
        </div>
        <div className="card shadow-sm text-center" style={{ borderTop: '4px solid #17A2B8' }}>
          <h3 className="text-muted mb-1" style={{ fontSize: '1rem' }}>Timetables Loaded</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#17A2B8' }}>{loadedDivisions} / {totalDivisions}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card shadow-sm">
          <h3 className="mb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Loaded Divisions</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {verifiedList.map(div => (
              <li key={div} className="flex items-center gap-2 mb-2 text-success" style={{ fontSize: '1.1rem' }}>
                <CheckCircle size={18} /> {div} (Imported)
              </li>
            ))}
          </ul>
        </div>
        
        <div className="card shadow-sm">
          <h3 className="mb-3" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Not Loaded</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {unverifiedList.map(div => (
              <li key={div} className="flex items-center gap-2 mb-2 text-muted" style={{ fontSize: '1.1rem' }}>
                <AlertCircle size={18} /> {div} (Not Imported)
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="serif mb-3" style={{ color: '#0F3460' }}>Division Management</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {verifiedList.map(div => (
          <div key={div} className="card shadow-sm flex flex-col justify-between" style={{ borderLeft: '4px solid #28A745' }}>
            <div>
              <h4 className="mb-1" style={{ fontSize: '1.25rem' }}>{div}</h4>
              <p className="text-success text-sm flex items-center gap-1 mb-4"><CheckCircle size={14} /> Timetable Loaded</p>
            </div>
            <Link to="/timetable" className="btn btn-outline text-center w-100">View Timetable</Link>
          </div>
        ))}
        
        {unverifiedList.map(div => (
          <div key={div} className="card shadow-sm flex flex-col justify-between" style={{ borderLeft: '4px solid #6c757d', opacity: 0.7 }}>
            <div>
              <h4 className="mb-1" style={{ fontSize: '1.25rem' }}>{div}</h4>
              <p className="text-muted text-sm flex items-center gap-1 mb-4"><AlertCircle size={14} /> Timetable Not Loaded</p>
            </div>
            <button className="btn btn-secondary text-center w-100" disabled>Coming Soon</button>
          </div>
        ))}
      </div>
      
      <h3 className="serif mb-3 mt-4" style={{ color: '#0F3460' }}>Data Quality Indicator</h3>
      <div className="grid grid-cols-2 gap-4">
        {data.manifest.divisions.map(div => {
          if (dataQuality[div].imported === 0) return null;
          return (
            <div key={div} className="card shadow-sm">
              <h4 className="mb-2" style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>{div}</h4>
              <p className="mb-1 text-success flex items-center gap-2">
                <CheckCircle size={16} /> {dataQuality[div].verified} records verified
              </p>
              {dataQuality[div].needsVerification > 0 ? (
                <p className="text-warning flex items-center gap-2">
                  <AlertCircle size={16} /> {dataQuality[div].needsVerification} records need verification
                </p>
              ) : (
                <p className="text-muted flex items-center gap-2">
                  <CheckCircle size={16} /> 0 records need verification
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
