import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function RoomDetails({ data }) {
  const { id } = useParams();
  const room = data.roomMap[id];

  if (!room) {
    return <div className="container">Room not found.</div>;
  }

  const roomTimetable = data.timetables.filter(t => t.room === room.room_id);

  return (
    <div className="container">
      <Link to="/rooms" className="btn btn-outline mb-4"><ArrowLeft size={16} /> Back to Rooms</Link>
      
      <div className="card mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="mb-1">Room {room.room_number}</h2>
            <p className="text-muted">{room.building} - {room.room_type}</p>
            {room.metadata_status === 'DEMO_ASSUMPTION' && (
              <div className="badge badge-warning mt-2">Demo Data (Pending Verification)</div>
            )}
          </div>
          <div className="text-right">
            <div className="badge badge-primary mb-1">Capacity: {room.capacity}</div>
            <div className="flex gap-2 justify-end mt-2">
              {parseInt(room.wifi) === 1 && <span className="badge badge-info">Wi-Fi</span>}
              {parseInt(room.power) === 1 && <span className="badge badge-info">Power</span>}
              {parseInt(room.projector) === 1 && <span className="badge badge-info">Projector</span>}
              {parseInt(room.computers) === 1 && <span className="badge badge-info">Computers</span>}
            </div>
          </div>
        </div>
      </div>

      <h3 className="mb-3">Weekly Timetable</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Class/Subject</th>
              <th>Type</th>
              <th>Batch</th>
            </tr>
          </thead>
          <tbody>
            {roomTimetable.length === 0 ? (
              <tr><td colSpan="5" className="text-center text-muted">No scheduled classes</td></tr>
            ) : (
              roomTimetable.sort((a, b) => {
                const days = { "Monday":1, "Tuesday":2, "Wednesday":3, "Thursday":4, "Friday":5, "Saturday":6 };
                return (days[a.day] - days[b.day]) || (a.start_time.localeCompare(b.start_time));
              }).map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.day}</td>
                  <td>{entry.start_time} - {entry.end_time}</td>
                  <td>{entry.subject.split(':')[0]} <br/><small className="text-muted">{entry.faculty}</small></td>
                  <td>{entry.class_type}</td>
                  <td>{entry.batch !== '-' ? entry.batch : 'All'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
