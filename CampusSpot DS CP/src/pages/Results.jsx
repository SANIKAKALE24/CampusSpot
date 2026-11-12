import { Link, Navigate } from 'react-router-dom';
import { CheckCircle, Info, Star, Activity } from 'lucide-react';

export default function Results({ query, results }) {
  if (!query || !results) {
    return <Navigate to="/find" />;
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="serif mb-1" style={{ fontSize: '2rem', color: '#0F3460' }}>Available Spaces</h2>
          <p className="text-muted">
            {query.day}, {query.startTime} - {query.endTime} | {query.students} students | {query.purpose}
          </p>
        </div>
        <Link to="/find" className="btn btn-outline shadow-sm">Modify Search</Link>
      </div>

      {results.ranked.length === 0 ? (
        <div className="card text-center mt-4 shadow-sm" style={{ padding: '3rem' }}>
          <Info size={48} className="text-muted mb-3" style={{ margin: '0 auto' }} />
          <h3 className="serif text-muted">No spaces available</h3>
          <p className="text-muted max-w-md" style={{ margin: '0 auto' }}>All rooms are either occupied, have insufficient capacity, or lack the required facilities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {results.ranked.map((res, index) => (
            <div key={res.room.room_id} className="card shadow-sm" style={{ position: 'relative', borderTop: index === 0 ? '4px solid #F59E0B' : '1px solid #e9ecef' }}>
              {index === 0 && (
                <div className="badge badge-warning shadow-sm" style={{ position: 'absolute', top: '-14px', right: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', padding: '6px 14px' }}>
                  <Star size={14} /> Best Match
                </div>
              )}
              <div className="flex justify-between items-start mb-3">
                <h3 className="serif" style={{ color: '#0F3460', fontSize: '1.4rem' }}>Room {res.room.room_number}</h3>
                <div className="badge badge-success shadow-sm" style={{ fontSize: '1rem' }}>Score: {res.score.total}/100</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4" style={{ fontSize: '0.95rem' }}>
                <div>
                  <div className="text-muted text-sm">Capacity</div>
                  <strong>{res.room.capacity} students</strong>
                </div>
                <div>
                  <div className="text-muted text-sm">Availability</div>
                  <strong className="text-success flex items-center gap-1"><CheckCircle size={14}/> {query.startTime}–{query.endTime}</strong>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-muted text-sm mb-1">Facilities Match</div>
                <div className="flex gap-2">
                  <span className="badge" style={{ backgroundColor: query.facilities?.wifi ? '#dcfce7' : '#f1f5f9', color: query.facilities?.wifi ? '#166534' : '#64748b' }}>WiFi {query.facilities?.wifi ? '✓' : '-'}</span>
                  <span className="badge" style={{ backgroundColor: query.facilities?.projector ? '#dcfce7' : '#f1f5f9', color: query.facilities?.projector ? '#166534' : '#64748b' }}>Projector {query.facilities?.projector ? '✓' : '-'}</span>
                  <span className="badge" style={{ backgroundColor: query.facilities?.power ? '#dcfce7' : '#f1f5f9', color: query.facilities?.power ? '#166534' : '#64748b' }}>Power {query.facilities?.power ? '✓' : '-'}</span>
                </div>
              </div>
              
              <div className="mb-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', borderLeft: '3px solid #0F3460', fontSize: '0.9rem' }}>
                <strong className="text-muted d-block mb-1">Algorithm Reasoning:</strong>
                <span style={{ color: '#334155' }}>Available for the requested duration and satisfies the required capacity and purpose. Score derived from capacity match ({res.score.capacity} pts) and purpose suitability ({res.score.purpose} pts).</span>
              </div>
              
              <Link to={`/rooms/${res.room.room_id}`} className="btn btn-outline" style={{ width: '100%' }}>View Room Details</Link>
            </div>
          ))}
        </div>
      )}

      {results.stats && (
        <div className="card mt-5 shadow-sm" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e2e8f0' }}>
          <h3 className="serif mb-4 flex items-center gap-2" style={{ color: '#0F3460' }}><Activity size={20} /> C Engine Execution Stats</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-white" style={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div className="text-muted text-sm mb-1">Rooms Checked</div>
              <strong style={{ fontSize: '1.2rem', color: '#0F3460' }}>{results.stats.rooms_checked}</strong>
            </div>
            <div className="p-3 bg-white" style={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div className="text-muted text-sm mb-1">Capacity Filtered</div>
              <strong style={{ fontSize: '1.2rem', color: '#F59E0B' }}>{results.stats.cap_filtered}</strong>
            </div>
            <div className="p-3 bg-white" style={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div className="text-muted text-sm mb-1">Timetable Conflicts</div>
              <strong style={{ fontSize: '1.2rem', color: '#EF4444' }}>{results.stats.conflicts}</strong>
            </div>
            <div className="p-3 bg-white" style={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div className="text-muted text-sm mb-1">Available Rooms</div>
              <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>{results.ranked.length}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
