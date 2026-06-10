const XLSX = require('xlsx');
const path = require('path');

function readCollegeData() {
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'colleges.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['Sheet1'];
    if (!sheet) {
      throw new Error('Sheet1 not found in Excel file');
    }
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } catch (err) {
    console.error('Error reading colleges.xlsx:', err);
    return [];
  }
}

// Helper to clean fee values (fees are messy strings)
function cleanFee(val) {
  if (!val || val === '') return 'Contact for fees';
  const str = String(val)
    .replace(/[₹,\s]/g, '') // remove rupee, commas, spaces
    .split('/')[0] // take first value if multiple
    .split('TAG')[0] // remove TAG annotations
    .trim();

  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) {
    return '₹' + num.toLocaleString('en-IN');
  }
  return String(val).trim() || 'Contact for fees';
}

// Helper to get unique values
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
    res.status(500).json({ success: true, data: [] });
    return null;
  }
  return data;
}

// GET /api/v1/colleges/search?q=searchterm
// Search across "College Name" AND "Course Name" AND "Degree" AND "Subject"
// Case insensitive partial match. Return max 10 suggestions.
// Deduplicate college names and course names separately.
function searchColleges(req, res) {
  const data = getDataOr500Empty(req, res);
  if (!data) return;

  const q = normalizeQ(req.query.q);
  if (q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const collegeMatches = [];
  const courseMatches = [];
  const seenColleges = new Set();
  const seenCourses = new Set();

  data.forEach((row) => {
    const collegeName = String(row['College Name'] || '');
    const courseName = String(row['Course Name'] || '');
    const degree = String(row['Degree'] || '');
    const subject = String(row['Subject'] || '');

    if (
      collegeName.toLowerCase().includes(q) &&
      !seenColleges.has(collegeName.toLowerCase())
    ) {
      seenColleges.add(collegeName.toLowerCase());
      collegeMatches.push({
        type: 'college',
        label: collegeName,
        value: collegeName,
      });
    }

    const courseSearch = [courseName, degree, subject]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (
      courseSearch.includes(q) &&
      !seenCourses.has(degree.toLowerCase())
    ) {
      seenCourses.add(degree.toLowerCase());
      courseMatches.push({
        type: 'course',
        label: degree || courseName,
        value: degree || courseName,
      });
    }
  });

  const results = [...collegeMatches.slice(0, 5), ...courseMatches.slice(0, 5)].slice(0, 10);
  return res.json({ success: true, data: results });
}

// GET /api/v1/colleges/by-college?name=collegename
// Filter rows where "College Name" matches (case insensitive exact).
// Return college info + all its courses.
function getCollegeDetails(req, res) {
  const data = readCollegeData();
  if (!data || data.length === 0) {
    return res.status(500).json({ success: true, data: null });
  }

  const name = (req.query.name || '').trim().toLowerCase();
  const rows = data.filter(
    (r) => String(r['College Name'] || '').toLowerCase() === name
  );

  if (!rows.length) {
    return res.json({
      success: false,
      message: 'College not found',
      data: null,
    });
  }

  const first = rows[0];
  const courses = rows.map((r) => ({
    course_name: String(r['Course Name'] || ''),
    degree: String(r['Degree'] || ''),
    subject: String(r['Subject'] || ''),
    level: String(r['UG /PG'] || ''),
    duration: String(r['Duration ( YEARS)'] || ''),
    total_fee: cleanFee(r['Total Tuition Fee']),
    year1_fee: cleanFee(r['Year 1']),
    year2_fee: cleanFee(r['Year 2']),
    year3_fee: cleanFee(r['Year 3']),
    year4_fee: cleanFee(r['Year 4']),
    hostel_fee: cleanFee(r['Hotel Fees/year']),
    admission_fee: cleanFee(r['Admission Fee']),
  }));

  return res.json({
    success: true,
    data: {
      college_name: String(first['College Name'] || ''),
      state: String(first['State'] || ''),
      city: String(first['City'] || ''),
      courses,
    },
  });
}

// GET /api/v1/colleges/by-course?name=degreename
// Filter rows where "Degree" OR "Course Name" partially matches search term.
// Group by college, return list of colleges.
function getCollegesByCourse(req, res) {
  const data = getDataOr500Empty(req, res);
  if (!data) return;

  const name = normalizeQ(req.query.name);

  const rows = data.filter((r) => {
    const degree = String(r['Degree'] || '').toLowerCase();
    const course = String(r['Course Name'] || '').toLowerCase();
    const subject = String(r['Subject'] || '').toLowerCase();

    return degree.includes(name) || course.includes(name) || subject.includes(name);
  });

  // Group by college, keep one entry per college
  const seen = new Set();
  const results = [];

  rows.forEach((r) => {
    const cn = String(r['College Name'] || '');
    if (!seen.has(cn.toLowerCase())) {
      seen.add(cn.toLowerCase());
      results.push({
        college_name: cn,
        state: String(r['State'] || ''),
        city: String(r['City'] || ''),
        level: String(r['UG /PG'] || ''),
        degree: String(r['Degree'] || ''),
        course_name: String(r['Course Name'] || ''),
        duration: String(r['Duration ( YEARS)'] || ''),
        total_fee: cleanFee(r['Total Tuition Fee']),
        year1_fee: cleanFee(r['Year 1']),
      });
    }
  });

  return res.json({ success: true, data: results });
}

// GET /api/v1/colleges/streams
// Return all unique values from "Degree" column as stream filter options.
// Limit to 15 most common.
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
// Return unique states for filter.
function getStates(req, res) {
  const data = getDataOr500Empty(req, res);
  if (!data) return;

  const states = unique(data.map((r) => r['State']));
  return res.json({ success: true, data: states });
}

module.exports = {
  searchColleges,
  getCollegeDetails,
  getCollegesByCourse,
  getStreams,
  getStates,
};

