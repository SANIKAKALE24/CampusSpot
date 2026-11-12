import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import FindSpace from './pages/FindSpace';
import Results from './pages/Results';
import RoomDetails from './pages/RoomDetails';
import Timetable from './pages/Timetable';
import Rooms from './pages/Rooms';
import AdminDashboard from './pages/AdminDashboard';
import DSAProcessing from './pages/DSAProcessing';
import DataImport from './pages/DataImport';
import { useEffect, useState } from 'react';
import { loadData } from './utils/dsa';

function App() {
  const [data, setData] = useState({
    manifest: null,
    rooms: [],
    timetables: [],
    roomMap: {},
    loading: true
  });

  const [searchQuery, setSearchQuery] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    loadData().then((res) => {
      setData({ ...res, loading: false });
    });
  }, []);

  if (data.loading) {
    return <div className="page-wrapper"><div className="main-content flex items-center justify-center">Loading CampusSpot Data...</div></div>;
  }

  return (
    <BrowserRouter>
      <div className="page-wrapper">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/find" element={<FindSpace data={data} setSearchQuery={setSearchQuery} setSearchResults={setSearchResults} />} />
            <Route path="/results" element={<Results query={searchQuery} results={searchResults} />} />
            <Route path="/rooms/:id" element={<RoomDetails data={data} />} />
            <Route path="/timetable" element={<Timetable data={data} />} />
            <Route path="/rooms" element={<Rooms data={data} />} />
            <Route path="/admin" element={<AdminDashboard data={data} />} />
            <Route path="/admin/import" element={<DataImport data={data} />} />
            <Route path="/dsa" element={<DSAProcessing data={data} query={searchQuery} results={searchResults} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
