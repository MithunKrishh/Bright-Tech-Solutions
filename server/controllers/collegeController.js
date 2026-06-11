const fs = require('fs');
const path = require('path');

let cachedData = null;

function readCollegeData() {
  if (cachedData) return cachedData;
  try {
    const filePath = path.join(process.cwd(), 'data', 'colleges.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    cachedData = JSON.parse(raw);
    console.log(`Loaded ${cachedData.length} rows from colleges.json`);
    return cachedData;
  } catch (err) {
    console.error('Error reading colleges.json:', err);
    return [];
  }
}

function unique(arr) {
  return [...new Set(
    arr.filter((v) => v && String(v).trim() !== '').map((v) => String(v).trim())
  )];
}

function normalizeQ(q) {
  return (q || '').toLowerCase().trim();
}

function getDataOr500(req, res) {
  const data = readCollegeData();
  if (!data.length) {
    res.status(500).json({ success: false, message: 'College data unavailable', data: [] });
    return null;
  }
  return data;
}

// GET /api/v1/colleges/search?q=searchterm
function searchColleges(req, res) {
  const data = getDataOr500(req, res);
  if (!data) return;

  const q = normalizeQ(req.query.q);
  if (q.length < 1) return res.json({ success: true, data: [] });

  const collegeMatches = [];
  const courseMatches = [];
  const cityStateMatches = [];
  const seenColleges = new Set();
  const seenCourses = new Set();
  const seenLocations = new Set();

  data.forEach((row) => {
    const collegeLower = row.college_name.toLowerCase();
    if (collegeLower.includes(q) && !seenColleges.has(collegeLower)) {
      seenColleges.add(collegeLower);
      collegeMatches.push({
        type: 'college',
        label: row.college_name,
        value: row.college_name,
        score: collegeLower.startsWith(q) ? 2 : 1,
      });
    }

    const cityLower = row.city.toLowerCase();
    const stateLower = row.state.toLowerCase();
    if (cityLower.includes(q) && !seenLocations.has(cityLower)) {
      seenLocations.add(cityLower);
      cityStateMatches.push({ type: 'city', label: `${row.city}, ${row.state}`, value: row.city, score: cityLower.startsWith(q) ? 2 : 1 });
    } else if (stateLower.includes(q) && !seenLocations.has(stateLower)) {
      seenLocations.add(stateLower);
      cityStateMatches.push({ type: 'state', label: row.state, value: row.state, score: stateLower.startsWith(q) ? 2 : 1 });
    }

    const courseLower = [row.course_name, row.degree, row.subject].filter(Boolean).join(' ').toLowerCase();
    const key = (row.degree || row.course_name).toLowerCase();
    if (courseLower.includes(q) && !seenCourses.has(key)) {
      seenCourses.add(key);
      courseMatches.push({
        type: 'course',
        label: row.degree || row.course_name,
        value: row.degree || row.course_name,
        score: (row.degree.toLowerCase().startsWith(q) || courseLower.startsWith(q)) ? 2 : 1,
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
  ].slice(0, 10).map(({ score, ...rest }) => rest);

  return res.json({ success: true, data: results });
}

// GET /api/v1/colleges/results?q=searchterm
function getResults(req, res) {
  const data = getDataOr500(req, res);
  if (!data) return;

  const q = normalizeQ(req.query.q);
  if (!q) return res.json({ success: true, data: [] });

  const seen = new Set();
  const results = [];

  data.forEach((row) => {
    const haystack = [row.college_name, row.course_name, row.degree, row.subject, row.city, row.state]
      .join(' ').toLowerCase();

    if (!haystack.includes(q)) return;

    const key = row.college_name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        college_name: row.college_name,
        state: row.state,
        city: row.city,
        level: row.level,
        degree: row.degree,
        course_name: row.course_name,
        duration: row.duration,
        total_fee: row.total_fee || 'Contact for fees',
        year1_fee: row.year1_fee || 'Contact for fees',
        hostel_fee: row.hostel_fee || 'Contact for fees',
        entrance_test: row.entrance_test,
        university: row.university,
        co_ed: row.co_ed,
      });
    }
  });

  return res.json({ success: true, total: results.length, data: results });
}

// GET /api/v1/colleges/by-college?name=collegename
function getCollegeDetails(req, res) {
  const data = getDataOr500(req, res);
  if (!data) return;

  const name = (req.query.name || '').trim().toLowerCase();
  const rows = data.filter((r) => r.college_name.toLowerCase() === name);

  if (!rows.length) {
    return res.json({ success: false, message: 'College not found', data: null });
  }

  const first = rows[0];
  const courses = rows.map((r) => ({
    course_name: r.course_name,
    degree: r.degree,
    subject: r.subject,
    level: r.level,
    duration: r.duration,
    total_fee: r.total_fee || 'Contact for fees',
    year1_fee: r.year1_fee || 'Contact for fees',
    year2_fee: r.year2_fee || 'Contact for fees',
    year3_fee: r.year3_fee || 'Contact for fees',
    year4_fee: r.year4_fee || 'Contact for fees',
    hostel_fee: r.hostel_fee || 'Contact for fees',
    hostel_deposit: r.hostel_deposit || 'Contact for fees',
    admission_fee: r.admission_fee || 'Contact for fees',
    registration_fee: r.registration_fee || 'Contact for fees',
    application_fee: r.application_fee || 'Contact for fees',
    entrance_test: r.entrance_test,
    university: r.university,
    co_ed: r.co_ed,
  }));

  return res.json({
    success: true,
    data: {
      college_name: first.college_name,
      state: first.state,
      city: first.city,
      courses,
    },
  });
}

// GET /api/v1/colleges/by-course?name=degreename
function getCollegesByCourse(req, res) {
  const data = getDataOr500(req, res);
  if (!data) return;

  const name = normalizeQ(req.query.name);
  const rows = data.filter((r) => {
    return r.degree.toLowerCase().includes(name) ||
           r.course_name.toLowerCase().includes(name) ||
           r.subject.toLowerCase().includes(name);
  });

  const seen = new Set();
  const results = [];
  rows.forEach((r) => {
    const key = r.college_name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        college_name: r.college_name,
        state: r.state,
        city: r.city,
        level: r.level,
        degree: r.degree,
        course_name: r.course_name,
        duration: r.duration,
        total_fee: r.total_fee || 'Contact for fees',
        year1_fee: r.year1_fee || 'Contact for fees',
      });
    }
  });

  return res.json({ success: true, data: results });
}

// GET /api/v1/colleges/streams
function getStreams(req, res) {
  const data = getDataOr500(req, res);
  if (!data) return;

  const degreeCounts = {};
  data.forEach((r) => {
    if (r.degree) degreeCounts[r.degree] = (degreeCounts[r.degree] || 0) + 1;
  });

  const streams = Object.entries(degreeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name]) => name);

  return res.json({ success: true, data: streams });
}

// GET /api/v1/colleges/states
function getStates(req, res) {
  const data = getDataOr500(req, res);
  if (!data) return;
  const states = unique(data.map((r) => r.state));
  return res.json({ success: true, data: states });
}

// GET /api/v1/colleges/debug
function debugPaths(req, res) {
  const filePath = path.join(process.cwd(), 'data', 'colleges.json');
  const data = readCollegeData();
  return res.json({
    cwd: process.cwd(),
    filePath,
    exists: fs.existsSync(filePath),
    rowsLoaded: data.length,
    sample: data[0] || null,
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