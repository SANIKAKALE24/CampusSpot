import { Link } from 'react-router-dom';
import { Search, Calendar, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="container">
      <div className="card text-center" style={{ padding: '80px 20px', marginTop: '40px', border: '1px solid #e9ecef', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h1 className="serif mb-2" style={{ fontSize: '3.5rem', color: '#0F3460' }}>CampusSpot</h1>
        <h2 className="text-muted mb-4" style={{ fontWeight: 400, fontSize: '1.5rem' }}>Smart Classroom & Study Space Finder</h2>
        <p className="mb-4 text-muted" style={{ maxWidth: '600px', margin: '0 auto 40px auto', fontSize: '1.1rem' }}>
          Find the right campus space for your free time. Quickly check timetable-based availability and locate rooms with the capacity and facilities you need.
        </p>
        
        <div className="flex justify-center gap-4 mb-4">
          <Link to="/find" className="btn btn-primary shadow-sm" style={{ padding: '12px 28px', fontSize: '1.1rem' }}>
            <Search size={20} className="mr-2" /> Find a Space
          </Link>
          <Link to="/timetable" className="btn btn-outline shadow-sm" style={{ padding: '12px 28px', fontSize: '1.1rem' }}>
            <Calendar size={20} className="mr-2" /> View Timetable
          </Link>
        </div>

        <div className="flex justify-center mt-4">
          <div className="badge" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} /> IT Department: 4 / 6 Divisions Loaded
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6 mt-4" style={{ marginTop: '40px' }}>
        <div className="card text-center shadow-sm" style={{ borderTop: '4px solid #0F3460' }}>
          <h3 className="mb-3 serif" style={{ color: '#0F3460' }}>Real-time Timetables</h3>
          <p className="text-muted" style={{ fontSize: '0.95rem' }}>Powered by verified division timetables to guarantee accurate room availability without conflicts.</p>
        </div>
        <div className="card text-center shadow-sm" style={{ borderTop: '4px solid #28A745' }}>
          <h3 className="mb-3 serif" style={{ color: '#0F3460' }}>Smart Suitability</h3>
          <p className="text-muted" style={{ fontSize: '0.95rem' }}>Matches your required capacity and facilities (Wi-Fi, Power, Projector) to the best rooms.</p>
        </div>
        <div className="card text-center shadow-sm" style={{ borderTop: '4px solid #F59E0B' }}>
          <h3 className="mb-3 serif" style={{ color: '#0F3460' }}>DSA Processing</h3>
          <p className="text-muted" style={{ fontSize: '0.95rem' }}>Uses Hash Tables, Interval Conflict Checks, and Priority Queues for blazing fast recommendations.</p>
        </div>
      </div>
    </div>
  );
}
