import Papa from 'papaparse';

// Time conflict utility
export function checkTimeConflict(reqStart, reqEnd, occStart, occEnd) {
  // requested_start < occupied_end AND requested_end > occupied_start => conflict
  return reqStart < occEnd && reqEnd > occStart;
}

export function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return 0; // fallback safe value
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes; // returns minutes since midnight
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Core sorting algorithm reference (Implemented in C engine: dsa/campusspot.c)
export function quickSortRooms(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const less = [];
  const equal = [];
  const greater = [];

  for (const item of arr) {
    if (item.score.total > pivot.score.total) {
      greater.push(item);
    } else if (item.score.total < pivot.score.total) {
      less.push(item);
    } else {
      // Deterministic tie-breaker by room_id
      if (item.room.room_id < pivot.room.room_id) {
        greater.push(item);
      } else if (item.room.room_id > pivot.room.room_id) {
        less.push(item);
      } else {
        equal.push(item);
      }
    }
  }

  return [...quickSortRooms(greater), ...equal, ...quickSortRooms(less)];
}

// Purpose scoring
// Score logic: 100 max
// Facility: 30, Capacity: 20, Duration: 25, Purpose: 15, Distance: 10
export function calculateScore(room, req, availableDuration) {
  let score = 0;
  const breakdown = {};
  
  // 1. Facility Match (30 pts)
  let fScore = 0;
  if (req.facilities.wifi && parseInt(room.wifi) === 1) fScore += 10;
  if (req.facilities.power && parseInt(room.power) === 1) fScore += 10;
  if (req.facilities.projector && parseInt(room.projector) === 1) fScore += 10;
  score += fScore;
  breakdown.facility = fScore;
  
  // 2. Capacity Match (20 pts)
  const requiredCap = parseInt(req.students);
  const roomCap = parseInt(room.capacity);
  let cScore = 0;
  if (roomCap >= requiredCap) {
    // Exact or slightly larger is better. If it's way larger, less score.
    const diff = roomCap - requiredCap;
    if (diff <= 10) cScore = 20;
    else if (diff <= 30) cScore = 15;
    else cScore = 10; // wasting a large room
  } else {
    cScore = 0; // Not enough capacity (should be filtered out before this)
  }
  score += cScore;
  breakdown.capacity = cScore;
  
  // 3. Duration/Availability (25 pts)
  // Assuming full duration is available since filtered.
  let dScore = 25;
  score += dScore;
  breakdown.duration = dScore;
  
  // 4. Purpose Match (15 pts)
  let pScore = 0;
  if (req.purpose === 'Coding' && parseInt(room.computers) === 1) pScore = 15;
  else if (req.purpose === 'Group Study' && room.room_type === 'Classroom') pScore = 15;
  else if (req.purpose === 'Presentation' && parseInt(room.projector) === 1) pScore = 15;
  else if (req.purpose === 'Project Discussion') pScore = 10;
  else pScore = 5;
  
  score += pScore;
  breakdown.purpose = pScore;
  
  // Distance is 0 for now
  breakdown.distance = 0;
  
  return { total: score, breakdown };
}

export const loadData = async () => {
  const [manifestRes, roomRes, timetableRes, preloadedRes] = await Promise.all([
    fetch('/data/campusspot_data_manifest.json'),
    fetch('/data/campusspot_room_master_demo.csv'),
    fetch('/data/campusspot_timetable_SY-IT-D_seed.csv'),
    fetch('/data/preloaded_timetables.json')
  ]);
  
  const manifest = await manifestRes.json();
  const roomCsv = await roomRes.text();
  const timetableCsv = await timetableRes.text();
  const preloadedTimetables = await preloadedRes.json();
  
  const rooms = Papa.parse(roomCsv, { header: true, skipEmptyLines: true }).data;
  const rawITD = Papa.parse(timetableCsv, { header: true, skipEmptyLines: true }).data;
  
  // Normalize missing fields as requested
  const normalizeRow = (row) => {
    return {
      division: row.division || 'Not available in current dataset',
      day: row.day || 'Not available in current dataset',
      startTime: row.startTime || 'Not available in current dataset',
      endTime: row.endTime || 'Not available in current dataset',
      subjectCode: row.subjectCode || 'Not available in current dataset',
      subject: row.subject || 'Not available in current dataset',
      type: row.type || 'Not available in current dataset',
      batch: row.batch || 'Not available in current dataset',
      room: row.room || 'Not available in current dataset',
      faculty: row.faculty || 'Not available in current dataset',
      sourceFile: row.sourceFile || 'Unknown'
    };
  };

  const formattedPreloaded = preloadedTimetables.map(normalizeRow);
  
  // Normalize IT-D
  const timetables = rawITD.map(row => {
    let subjectCode = '';
    let subject = row.subject || '';
    if (subject.includes(' - ')) {
      const parts = subject.split(' - ');
      subjectCode = parts[0].trim();
      subject = parts[1].split(':')[0].trim();
    }
    
    return normalizeRow({
      division: 'IT-D',
      day: row.day,
      startTime: row.start_time,
      endTime: row.end_time,
      subjectCode: subjectCode,
      subject: subject,
      type: row.class_type,
      batch: row.batch === '-' ? '' : row.batch,
      room: row.room,
      faculty: row.faculty,
      sourceFile: 'campusspot_timetable_SY-IT-D_seed.csv'
    });
  });
  
  // Add preloaded data
  timetables.push(...formattedPreloaded);
  
  // Load from localStorage for imported overrides
  const importedData = localStorage.getItem('campusspot_imported_timetables');
  if (importedData) {
    try {
      const parsed = JSON.parse(importedData);
      timetables.push(...parsed.map(normalizeRow));
    } catch (e) {
      console.error("Failed to parse imported timetables");
    }
  }
  
  // Hash map of room_id to room
  const roomMap = {};
  rooms.forEach(r => roomMap[r.room_id] = r);
  
  return { manifest, rooms, timetables, roomMap };
};
