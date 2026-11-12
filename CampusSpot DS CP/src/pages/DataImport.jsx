import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function DataImport({ data }) {
  const divisions = data.manifest.divisions;
  const verified = data.manifest.verified_timetable_sources;
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationState, setValidationState] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Simulate reading and validation
      setTimeout(() => {
        setValidationState({
          fileName: file.name,
          valid: false, // Simulating a required field is missing
          missingFields: ['Room', 'Batch'],
          records: 24
        });
      }, 1000);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <Link to="/admin" className="btn btn-outline mb-4 flex items-center gap-2 w-max shadow-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
      
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="serif mb-1" style={{ fontSize: '2rem', color: '#0F3460' }}>Data Import & Verification</h2>
          <p className="text-muted">Import Excel timetable files to update the DSA search pool.</p>
        </div>
      </div>

      <div className="card shadow-sm mb-5" style={{ border: '2px dashed #cbd5e1', backgroundColor: '#f8f9fa' }}>
        <div className="flex flex-col items-center justify-center py-5">
          <FileSpreadsheet size={48} className="text-muted mb-3" />
          <h3 className="mb-2" style={{ color: '#0F3460' }}>Upload Timetable Excel</h3>
          <p className="text-muted mb-4 text-center max-w-md">Must include: Division, Subject, Subject Code, Type, Faculty, Day, Time, Room, Batch</p>
          
          <label className="btn btn-primary cursor-pointer flex items-center gap-2 shadow-sm">
            <Upload size={18} /> Select Excel File
            <input type="file" accept=".xlsx" className="hidden" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
        
        {validationState && (
          <div className="p-4 m-4" style={{ backgroundColor: 'white', borderRadius: '8px', borderLeft: validationState.valid ? '4px solid #28A745' : '4px solid #F59E0B' }}>
            <h4 className="flex items-center gap-2 mb-2">
              {validationState.valid ? <CheckCircle className="text-success" size={20} /> : <AlertCircle className="text-warning" size={20} />}
              Validation Results for {validationState.fileName}
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-muted mb-1 text-sm">Records Analyzed</p>
                <strong>{validationState.records}</strong>
              </div>
              <div>
                <p className="text-muted mb-1 text-sm">Status</p>
                {validationState.valid ? (
                  <strong className="text-success">Verified</strong>
                ) : (
                  <strong className="text-warning">Needs Verification</strong>
                )}
              </div>
            </div>
            
            {!validationState.valid && (
              <div className="mt-3 text-sm text-danger">
                Warning: Missing required fields in some records: <strong>{validationState.missingFields.join(', ')}</strong>. Do not automatically invent these values.
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              <button className="btn btn-primary" disabled={!validationState.valid}>Commit Data</button>
              <button className="btn btn-outline" onClick={() => setValidationState(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="card shadow-sm">
        <h3 className="mb-4 serif" style={{ color: '#0F3460', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Current Data Sources</h3>
        <div className="table-container">
          <table className="table w-100">
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th>Division</th>
                <th>Status</th>
                <th>Source Type</th>
                <th>Source File</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map(div => {
                const isVerified = !!verified[div];
                const source = verified[div];
                
                return (
                  <tr key={div} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ fontWeight: 500 }}>{div}</td>
                    <td>
                      {isVerified ? (
                        <span className="badge badge-success flex items-center gap-1 w-max"><CheckCircle size={12} /> Verified</span>
                      ) : (
                        <span className="badge badge-warning flex items-center gap-1 w-max"><AlertCircle size={12} /> Pending</span>
                      )}
                    </td>
                    <td>{source ? source.status : 'N/A'}</td>
                    <td className="text-muted text-sm">{source ? source.sourceFile : '-'}</td>
                    <td>
                      {!isVerified && <button className="btn btn-primary text-sm shadow-sm" style={{ padding: '6px 12px' }}>Import</button>}
                      {isVerified && <button className="btn btn-outline text-sm" style={{ padding: '6px 12px' }}>Re-import</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
