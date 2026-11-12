import { Link } from 'react-router-dom';

export default function Rooms({ data }) {
  return (
    <div className="container">
      <h2 className="mb-4">Campus Rooms</h2>
      
      <div className="grid grid-cols-3 gap-4">
        {data.rooms.map(room => (
          <div key={room.room_id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 style={{ fontSize: '1.2rem' }}>{room.room_number}</h3>
              <span className={`badge ${room.room_type === 'Laboratory' ? 'badge-warning' : 'badge-primary'}`}>
                {room.room_type}
              </span>
            </div>
            <p className="text-muted mb-3">{room.building}</p>
            
            <div className="flex flex-col gap-2 mb-4" style={{ fontSize: '0.9rem' }}>
              <div className="flex justify-between">
                <span>Capacity:</span> <strong>{room.capacity}</strong>
              </div>
              <div className="flex justify-between">
                <span>Wi-Fi:</span> <strong>{parseInt(room.wifi) === 1 ? 'Yes' : 'No'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Projector:</span> <strong>{parseInt(room.projector) === 1 ? 'Yes' : 'No'}</strong>
              </div>
            </div>
            
            <Link to={`/rooms/${room.room_id}`} className="btn btn-outline" style={{ width: '100%', padding: '8px' }}>
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
