import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function FindSpace({ data, setSearchQuery, setSearchResults }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    day: 'Monday',
    startTime: '11:15',
    endTime: '11:45',
    students: '4',
    purpose: 'Project Discussion',
    facilities: {
      wifi: true,
      power: true,
      projector: false
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, facilities: { ...prev.facilities, [name]: checked } }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3001/api/find-spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: form,
          timetables: data.timetables
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSearchQuery(form);
        setSearchResults({
          ranked: result.results,
          stats: result.stats,
          algorithm: result.algorithm
        });
        navigate('/results');
      } else {
        alert("Error from DSA engine: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the DSA engine.");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="mb-4 text-center">Find a Space</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Day of Week</label>
            <select name="day" className="form-control" value={form.day} onChange={handleChange}>
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Saturday</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input type="time" name="startTime" className="form-control" value={form.startTime} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input type="time" name="endTime" className="form-control" value={form.endTime} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Number of Students</label>
              <input type="number" name="students" className="form-control" value={form.students} onChange={handleChange} min="1" max="150" required />
            </div>
            <div className="form-group">
              <label className="form-label">Purpose</label>
              <select name="purpose" className="form-control" value={form.purpose} onChange={handleChange}>
                <option>Coding</option>
                <option>Project Discussion</option>
                <option>Presentation</option>
                <option>Group Study</option>
                <option>Individual Study</option>
              </select>
            </div>
          </div>
          
          <div className="form-group mb-4">
            <label className="form-label">Required Facilities</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="wifi" checked={form.facilities.wifi} onChange={handleChange} /> Wi-Fi
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="power" checked={form.facilities.power} onChange={handleChange} /> Power Outlets
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="projector" checked={form.facilities.projector} onChange={handleChange} /> Projector
              </label>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            <Search size={20} /> Find Available Spaces
          </button>
        </form>
      </div>
    </div>
  );
}
