import { useState } from 'react';
import { ArrowDown, Play, Activity } from 'lucide-react';

export default function DSAProcessing({ results }) {
  const [running, setRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setShowResults(true);
    }, 1500);
  };

  const hasRun = !!results || showResults;

  const pipelineSteps = [
    "REACT SEARCH QUERY",
    "NODE.JS EXPRESS API",
    "EXECUTE C BINARY (child_process)",
    "PARSE JSON TO C STRUCTS & ARRAYS",
    "HASH TABLE SEPARATE CHAINING (O(1))",
    "INTERVAL CONFLICT CHECK [req, occ)",
    "CAPACITY & FACILITY HARD FILTERS",
    "TRANSPARENT SUITABILITY SCORING",
    "QUICK SORT (MIDDLE PIVOT, O(N log N))",
    "JSON RESPONSE TO NODE.JS",
    "RENDER RANKED ROOMS IN REACT"
  ];

  let topRooms = [];
  if (results && results.ranked) {
    topRooms = results.ranked;
  } else {
    topRooms = [
      { room: { room_id: "1208", room_number: "1208", capacity: 22 }, score: { total: 95, facility: 30, capacity: 15, purpose: 15, duration: 25, base: 10 } },
      { room: { room_id: "1201", room_number: "1201", capacity: 66 }, score: { total: 80, facility: 20, capacity: 10, purpose: 15, duration: 25, base: 10 } },
      { room: { room_id: "1202", room_number: "1202", capacity: 66 }, score: { total: 80, facility: 20, capacity: 10, purpose: 15, duration: 25, base: 10 } }
    ];
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="serif mb-1" style={{ fontSize: '2rem', color: '#0F3460' }}>Algorithm & Processing</h2>
          <p className="text-muted">C Executable Pipeline & DSA Concept Visualizer</p>
        </div>
        {!hasRun && (
          <button className="btn btn-primary shadow-sm flex items-center gap-2" onClick={handleRun} disabled={running}>
            <Play size={18} /> {running ? 'Processing...' : 'Run DSA Simulation'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="card shadow-sm h-100" style={{ backgroundColor: '#f8f9fa' }}>
            <h3 className="serif mb-4 text-center" style={{ color: '#0F3460', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
              Execution Pipeline
            </h3>
            <div className="flex flex-col items-center">
              {pipelineSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center w-100">
                  <div className="text-center font-bold p-3 w-100" style={{ 
                    backgroundColor: index >= 2 && index <= 9 ? '#e0f2fe' : 'white', 
                    border: index >= 2 && index <= 9 ? '2px solid #0284c7' : '2px solid #0F3460', 
                    borderRadius: '8px',
                    color: index >= 2 && index <= 9 ? '#0369a1' : '#0F3460',
                    fontSize: '0.8rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    {step}
                  </div>
                  {index < pipelineSteps.length - 1 && (
                    <ArrowDown className="my-2 text-muted" size={24} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
          {(!hasRun && !running) && (
            <div className="card shadow-sm h-100 flex flex-col justify-center items-center text-center p-5" style={{ border: '2px dashed #cbd5e1' }}>
              <Activity size={48} className="text-muted mb-4" />
              <h3 className="serif text-muted mb-2">Analysis Pending</h3>
              <p className="text-muted max-w-md">Click "Run DSA Simulation" or run a query from the "Find a Space" page to view the C engine pipeline.</p>
            </div>
          )}

          {running && (
            <div className="card shadow-sm h-100 flex flex-col justify-center items-center p-5">
              <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }}></div>
              <h3 className="serif text-primary">Executing C Engine...</h3>
              <p className="text-muted mt-2">Running timetable interval checks and Quick Sort in C binary...</p>
            </div>
          )}

          {hasRun && !running && (
            <>
              {/* Quick Sort Visual Card */}
              <div className="card shadow-sm mt-0">
                <h3 className="serif mb-3" style={{ color: '#0F3460', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  Quick Sort Ranking (Middle-Pivot, Hoare Partition)
                </h3>
                <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                  Eligible rooms are sorted in descending order of Suitability Score. Ties are broken deterministically by Room ID.
                </p>
                <div className="flex flex-col gap-3">
                  {topRooms.slice(0, 5).map((item, idx) => (
                    <div key={item.room.room_id || idx} className="p-3 border rounded flex justify-between items-center" style={{ backgroundColor: idx === 0 ? '#f0fdf4' : 'white', borderColor: idx === 0 ? '#86efac' : '#e2e8f0' }}>
                      <div className="flex items-center gap-3">
                        <span className="badge" style={{ backgroundColor: idx === 0 ? '#16a34a' : '#0F3460', color: 'white', fontSize: '0.9rem', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                          {idx + 1}
                        </span>
                        <div>
                          <strong>Room {item.room.room_number || item.room.room_id}</strong>
                          <span className="text-muted text-sm ml-2">({item.room.building || 'IT Block'} • Cap: {item.room.capacity})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="badge badge-success" style={{ fontSize: '0.95rem' }}>Score: {item.score?.total}/100</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-light rounded text-muted" style={{ fontSize: '0.85rem' }}>
                  <strong>Complexity:</strong> Average Time: <code>O(N log N)</code> | Auxiliary Space: <code>O(log N)</code> recursion stack.
                </div>
              </div>

              {/* Hash Table Visual Card */}
              <div className="card shadow-sm">
                <h3 className="serif mb-3" style={{ color: '#0F3460', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  Hash Table with Separate Chaining (Room Lookup)
                </h3>
                <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                  Rooms are indexed into a 31-bucket hash table using the <code>djb2</code> algorithm: <code>hash = ((hash &lt;&lt; 5) + hash) + c</code>.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded bg-white">
                    <div className="text-muted font-bold mb-1">Collision Strategy</div>
                    <div>Separate Chaining (Singly Linked List)</div>
                  </div>
                  <div className="p-3 border rounded bg-white">
                    <div className="text-muted font-bold mb-1">Lookup Time Complexity</div>
                    <div>Average: <code>O(1)</code> | Worst-case: <code>O(N)</code></div>
                  </div>
                </div>
              </div>
              
              {results && results.stats && (
                <div className="card shadow-sm">
                  <h3 className="serif mb-4" style={{ color: '#0F3460', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    C Engine Execution Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="text-center p-3 border rounded">
                        <div className="text-muted text-sm">Rooms Checked</div>
                        <div className="font-bold text-lg">{results.stats.rooms_checked}</div>
                     </div>
                     <div className="text-center p-3 border rounded">
                        <div className="text-muted text-sm">Capacity Filtered</div>
                        <div className="font-bold text-lg">{results.stats.cap_filtered}</div>
                     </div>
                     <div className="text-center p-3 border rounded">
                        <div className="text-muted text-sm">Time Conflicts</div>
                        <div className="font-bold text-lg">{results.stats.conflicts}</div>
                     </div>
                     <div className="text-center p-3 border rounded bg-success text-white">
                        <div className="text-sm">Available Rooms</div>
                        <div className="font-bold text-lg">{results.ranked?.length || topRooms.length}</div>
                     </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
