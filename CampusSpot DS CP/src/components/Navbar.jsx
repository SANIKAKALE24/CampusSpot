import { Link, useLocation } from 'react-router-dom';
import { Map, Settings, Calendar, List, Search } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <Map size={28} className="text-primary" />
          CampusSpot
        </Link>
        <div className="nav-links">
          <Link to="/find" className={isActive('/find')}><div className="flex items-center gap-2"><Search size={18} /> Find Space</div></Link>
          <Link to="/timetable" className={isActive('/timetable')}><div className="flex items-center gap-2"><Calendar size={18} /> Timetable</div></Link>
          <Link to="/rooms" className={isActive('/rooms')}><div className="flex items-center gap-2"><List size={18} /> Rooms</div></Link>
          <Link to="/dsa" className={isActive('/dsa')}><div className="flex items-center gap-2"><Settings size={18} /> DSA Processing</div></Link>
          <Link to="/admin" className={isActive('/admin')}><div className="flex items-center gap-2"><Settings size={18} /> Admin</div></Link>
        </div>
      </div>
    </nav>
  );
}
