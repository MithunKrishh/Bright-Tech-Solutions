const XLSX = require('xlsx');
const path = require('path');

// FIX: Use a robust path that works both locally and on Railway.
// Try multiple candidate locations and use the first one that exists.
const fs = require('fs');

function findExcelFile() {
  const candidates = [
    // process.cwd() = project root on Railway (most reliable)
    path.join(process.cwd(), 'data', 'colleges.xlsx'),
    path.join(process.cwd(), 'colleges.xlsx'),
    // __dirname-relative fallbacks
    path.join(__dirname, '..', '..', 'data', 'colleges.xlsx'),
    path.join(__dirname, '..', '..', 'colleges.xlsx'),
    path.join(__dirname, '..', 'data', 'colleges.xlsx'),
    path.join(__dirname, '..', '..', 'client', 'data', 'colleges.xlsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log('Found colleges.xlsx at:', candidate);
      return candidate;
    }
  }

  console.error('colleges.xlsx not found. Tried:', candidates);
  return null;
}

// Cache the data in memory after first read so we don't re-read the file on every request
let cachedData = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function readCollegeData() {
  const now = Date.now();
  if (cachedData && (now - cacheTime) < CACHE_TTL_MS) {
    return cachedData;
  }

  try {
    const filePath = findExcelFile();
    if (!filePath) return [];

    const workbook = XLSX.readFile(filePath);

    // Try Sheet1 first, then fall back to the first available sheet
    const sheetName = workbook.SheetNames.includes('Sheet1')
      ? 'Sheet1'
      : workbook.SheetNames[0];

    if (!sheetName) {
      console.error('No sheets found in colleges.xlsx');
      return [];
    }

    const sheet = workbook.Sheets[sheetName];
    cachedData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    cacheTime = now;
    console.log(`Loaded ${cachedData.length} rows from ${sheetName}`);
    return cachedData;
  } catch (err) {
    console.error('Error reading colleges.xlsx:', err);
    return [];
  }
}

// Helper to clean fee values (fees are messy strings)
function cleanFee(val) {
  if (!val || val === '') return 'Contact for fees';
  const str = String(val)
    .replace(/[₹,\s]/g, '')
    .split('/')[0]
    .split('TAG')[0]
    .trim();

  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) {
    return '₹' + num.toLocaleString('en-IN');
  }
  return String(val).trim() || 'Contact for fees';
}

function unique(arr) {
  return [...new Set(
    arr
      .filter((v) => v && String(v).trim() !== '')
      .map((v) => String(v).trim())
  )];
}

function normalizeQ(q) {
  return (q || '').toLowerCase().trim();
}

function getDataOr500Empty(req, res) {
  const data = readCollegeData();
  if (!data || data.length === 0) {
    res.status(500).json({ success: false, message: 'College data could not be loaded. Please check the server logs.', data: [] });
    return null;
  }
  return data;
}

// GET /api/v1/colleges/search?q=searchterm
// Searches College Name, City, State, Course Name, Degree, Subject
function searchColleges(req, res) {
  const data = getDataOr500Empty(req, res);
  if (!data) return;

  const q = normalizeQ(req.query.q);
  if (q.length < 1) {
    return res.json({ success: true, data: [] });
  }

  const collegeMatches = [];
  const courseMatches = [];
  const cityStateMatches = [];
  const seenColleges = new Set();
  const seenCourses = new Set();
  const seenLocations = new Set();

  data.forEach((row) => {
    const collegeName = String(row['College Name'] || '');
    const courseName  = String(row['Course Name']  || '');
    const degree      = String(row['Degree']        || '');
    const subject     = String(row['Subject']       || '');
    const city        = String(row['City']          || '');
    const state       = String(row['State']         || '');

    // --- College name match ---
    const collegeLower = collegeName.toLowerCase();
    if (collegeLower.includes(q) && !seenColleges.has(collegeLower)) {
      seenColleges.add(collegeLower);
      collegeMatches.push({
        type: 'college',
        label: collegeName,
        value: collegeName,
        score: collegeLower.startsWith(q) ? 2 : 1,
      });
    }

    // --- City / State match ---
    const cityLower  = city.toLowerCase();
    const stateLower = state.toLowerCase();
    if (cityLower.includes(q) && !seenLocations.has(cityLower)) {
      seenLocations.add(cityLower);
      cityStateMatches.push({ type: 'city', label: `${city}, ${state}`, value: city, score: cityLower.startsWith(q) ? 2 : 1 });
    } else if (stateLower.includes(q) && !seenLocations.has(stateLower)) {
      seenLocations.add(stateLower);
      cityStateMatches.push({ type: 'state', label: state, value: state, score: stateLower.startsWith(q) ? 2 : 1 });
    }

    // --- Course / Degree / Subject match ---
    const courseLower = [courseName, degree, subject].filter(Boolean).join(' ').toLowerCase();
    const key = (degree || courseName).toLowerCase();
    if (courseLower.includes(q) && !seenCourses.has(key)) {
      seenCourses.add(key);
      courseMatches.push({
        type: 'course',
        label: degree || courseName,
        value: degree || courseName,
        score: (degree.toLowerCase().startsWith(q) || courseLower.startsWith(q)) ? 2 : 1,
      });
    }
  });

  collegeMatches.sort((a, b) => b.score - a.score);
  courseMatches.sort((a, b) => b.score - a.score);
  cityStateMatches.sort((a, b) => b.score - a.score);

  const results = [
    ...collegeMatches.slice(0, 4),
    ...cityStateMatches.slice(0, 3),
    ...courseMatches.slice(0, 3),
  ]
    .slice(0, 10)
    .map(({ score, ...rest }) => rest);

  return res.json({ success: true, data: results });
}

// GET /api/v1/colleges/results?q=searchterm
// Returns full college rows matching query across name, city, state, course, degree
function getResults(req, res) {
  const data = getDataOr500Empty(req, res);
  if (!data) return;

  const q = normalizeQ(req.query.q);
  if (!q) return res.json({ success: true, data: [] });

  const seen = new Set();
  const results = [];

  data.forEach((row) => {
    const collegeName = String(row['College Name'] || '');
    const courseName  = String(row['Course Name']  || '');
    const degree      = String(row['Degree']        || '');
    const subject     = String(row['Subject']       || '');
    const city        = String(row['City']          || '');
    const state       = String(row['State']         || '');

    const haystack = [collegeName, courseName, degree, subject, city, state]
      .join(' ')
      .toLowerCase();

    if (!haystack.includes(q)) return;

    const key = collegeName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        college_name: collegeName,
        state,
        city,
        level: String(row['UG /PG'] || ''),
        degree,
        course_name: courseName,
        duration: String(row['Duration ( YEARS)'] || ''),
        total_fee: cleanFee(row['Total Tuition Fee']),
        year1_fee: cleanFee(row['Year 1']),
        hostel_fee: cleanFee(row['Hotel Fees/year']),
        entrance_test: String(row['Entrance Test'] || ''),
        university: String(row['University Affiliation'] || ''),
        co_ed: String(row['Co-Ed Y/N'] || ''),
      });
    }
  });

  return res.json({ success: true, total: results.length, data: results });
}

// GET /api/v1/colleges/by-college?name=collegename
function getCollegeDetails(req, res) {
  const data = readCollegeData();
  if (!data || data.length === 0) {
    return res.status(500).json({ success: false, message: 'College data unavailable', data: null });
  }

  const name = (req.query.name || '').trim().toLowerCase();
  const rows = data.filter(
    (r) => String(r['College Name'] || '').toLowerCase() === name
  );

  if (!rows.length) {
    return res.json({ success: false, message: 'College not found', data: null });
  }

  const first = rows[0];
  const courses = rows.map((r) => ({
    course_name:  String(r['Course Name']           || ''),
    degree:       String(r['Degree']                || ''),
    subject:      String(r['Subject']               || ''),
    level:        String(r['UG /PG']               || ''),
    duration:     String(r['Duration ( YEARS)']    || ''),
    total_fee:    cleanFee(r['Total Tuition Fee']),
    year1_fee:    cleanFee(r['Year 1']),
    year2_fee:    cleanFee(r['Year 2']),
    year3_fee:    cleanFee(r['Year 3']),
    year4_fee:    cleanFee(r['Year 4']),
    donation:     cleanFee(r['Donation']),
    hostel_fee:   cleanFee(r['Hotel Fees/year']),
    hostel_deposit: cleanFee(r['Hostel Deposit']),
    admission_fee:  cleanFee(r['Admission Fee']),
    registration_fee: cleanFee(r['Registration fee']),
    application_fee:  cleanFee(r['Application Fee']),
    entrance_test: String(r['Entrance Test']         || ''),
    university:    String(r['University Affiliation'] || ''),
    co_ed:         String(r['Co-Ed Y/N']             || ''),
  }));

  return res.json({
    success: true,
    data: {
      college_name: String(first['College Name'] || ''),
      state:        String(first['State']        || ''),
      city:         String(first['City']         || ''),
      courses,
    },
  });
}

// GET /api/v1/colleges/by-course?name=degreename
function getCollegesByCourse(req, res) {
  const data = getDataOr500Empty(req, res);
  if (!data) return;

  const name = normalizeQ(req.query.name);
  const rows = data.filter((r) => {
    const degree  = String(r['Degree']      || '').toLowerCase();
    const course  = String(r['Course Name'] || '').toLowerCase();
    const subject = String(r['Subject']     || '').toLowerCase();
    return degree.includes(name) || course.includes(name) || subject.includes(name);
  });

  const seen = new Set();
  const results = [];
  rows.forEach((r) => {
    const cn = String(r['College Name'] || '');
    if (!seen.has(cn.toLowerCase())) {
      seen.add(cn.toLowerCase());
      results.push({
        college_name: cn,
        state:       String(r['State']              || ''),
        city:        String(r['City']               || ''),
        level:       String(r['UG /PG']            || ''),
        degree:      String(r['Degree']             || ''),
        course_name: String(r['Course Name']        || ''),
        duration:    String(r['Duration ( YEARS)'] || ''),
        total_fee:   cleanFee(r['Total Tuition Fee']),
        year1_fee:   cleanFee(r['Year 1']),
      });
    }
  });

  return res.json({ success: true, data: results });
}

// GET /api/v1/colleges/streams
function getStreams(req, res) {
  const data = getDataOr500Empty(req, res);
  if (!data) return;

  const degreeCounts = {};
  data.forEach((r) => {
    const d = String(r['Degree'] || '').trim();
    if (d) degreeCounts[d] = (degreeCounts[d] || 0) + 1;
  });

  const streams = Object.entries(degreeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name]) => name);

  return res.json({ success: true, data: streams });
}

// GET /api/v1/colleges/states
function getStates(req, res) {
  const data = getDataOr500Empty(req, res);
  if (!data) return;
  const states = unique(data.map((r) => r['State']));
  return res.json({ success: true, data: states });
}

// GET /api/v1/colleges/debug
// Shows exactly where Railway is looking for the Excel file
function debugPaths(req, res) {
  const candidates = [
    path.join(process.cwd(), 'data', 'colleges.xlsx'),
    path.join(process.cwd(), 'colleges.xlsx'),
    path.join(__dirname, '..', '..', 'data', 'colleges.xlsx'),
    path.join(__dirname, '..', '..', 'colleges.xlsx'),
    path.join(__dirname, '..', 'data', 'colleges.xlsx'),
  ];

  const results = candidates.map(p => ({ path: p, exists: fs.existsSync(p) }));
  const data = readCollegeData();

  return res.json({
    cwd: process.cwd(),
    __dirname,
    candidates: results,
    rowsLoaded: data.length,
  });
}

module.exports = {
  searchColleges,
  getResults,
  getCollegeDetails,
  getCollegesByCourse,
  getStreams,
  getStates,
  debugPaths,
};