const XLSX = require('xlsx');
const path = require('path');

// Sample college data
const collegeData = [
  // Kerala Universities
  {
    college_name: 'Kerala University',
    college_location: 'Thiruvananthapuram',
    college_state: 'Kerala',
    college_type: 'Government',
    course_name: 'Bachelor of Technology (BTech)',
    course_duration: '4 Years',
    course_type: 'UG',
    stream: 'Engineering',
    eligibility: '10+2 with PCM, Min 50%',
    approximate_fees: '₹35,000/year',
    description: 'BTech program covering core engineering disciplines with strong placement support.'
  },
  {
    college_name: 'Kerala University',
    college_location: 'Thiruvananthapuram',
    college_state: 'Kerala',
    college_type: 'Government',
    course_name: 'Master of Science (MSc)',
    course_duration: '2 Years',
    course_type: 'PG',
    stream: 'Science',
    eligibility: 'BSc degree, Min 50%',
    approximate_fees: '₹25,000/year',
    description: 'Advanced studies in Science with research opportunities.'
  },
  {
    college_name: 'Amrita Vishwa Vidyapeetham',
    college_location: 'Adoor',
    college_state: 'Kerala',
    college_type: 'Deemed',
    course_name: 'Master of Business Administration (MBA)',
    course_duration: '2 Years',
    course_type: 'PG',
    stream: 'Management',
    eligibility: "Bachelor's degree, Min 50%",
    approximate_fees: '₹2,50,000/year',
    description: 'Comprehensive MBA with industry partnerships and global exposure.'
  },
  {
    college_name: 'Amrita Vishwa Vidyapeetham',
    college_location: 'Adoor',
    college_state: 'Kerala',
    college_type: 'Deemed',
    course_name: 'Bachelor of Technology (BTech)',
    course_duration: '4 Years',
    course_type: 'UG',
    stream: 'Engineering',
    eligibility: '10+2 with PCM, Min 60%',
    approximate_fees: '₹1,80,000/year',
    description: 'Engineering excellence with modern labs and industry tie-ups.'
  },
  {
    college_name: 'Cochin University of Science and Technology',
    college_location: 'Kochi',
    college_state: 'Kerala',
    college_type: 'Government',
    course_name: 'Master of Computer Applications (MCA)',
    course_duration: '2 Years',
    course_type: 'PG',
    stream: 'Engineering',
    eligibility: "Bachelor's in CS/IT or relevant, Min 50%",
    approximate_fees: '₹40,000/year',
    description: 'Advanced computing program with specializations in AI and Data Science.'
  },
  
  // Tamil Nadu Colleges
  {
    college_name: 'Anna University',
    college_location: 'Chennai',
    college_state: 'Tamil Nadu',
    college_type: 'Government',
    course_name: 'Bachelor of Technology (BTech)',
    course_duration: '4 Years',
    course_type: 'UG',
    stream: 'Engineering',
    eligibility: '10+2 with PCM, Min 50%',
    approximate_fees: '₹50,000/year',
    description: 'Premier engineering institution with excellent placement record.'
  },
  {
    college_name: 'Anna University',
    college_location: 'Chennai',
    college_state: 'Tamil Nadu',
    college_type: 'Government',
    course_name: 'Master of Technology (MTech)',
    course_duration: '2 Years',
    course_type: 'PG',
    stream: 'Engineering',
    eligibility: 'BTech degree, Min 60%',
    approximate_fees: '₹60,000/year',
    description: 'Advanced engineering with research and innovation focus.'
  },
  {
    college_name: 'Madras Medical College',
    college_location: 'Chennai',
    college_state: 'Tamil Nadu',
    college_type: 'Government',
    course_name: 'Bachelor of Medicine and Bachelor of Surgery (MBBS)',
    course_duration: '5.5 Years',
    course_type: 'UG',
    stream: 'Medical',
    eligibility: '10+2 with PCB, NEET Qualified',
    approximate_fees: '₹8,000/year',
    description: 'Prestigious medical college with top-tier clinical training.'
  },
  {
    college_name: 'PSG College of Technology',
    college_location: 'Coimbatore',
    college_state: 'Tamil Nadu',
    college_type: 'Private',
    course_name: 'Bachelor of Engineering (BE)',
    course_duration: '4 Years',
    course_type: 'UG',
    stream: 'Engineering',
    eligibility: '10+2 with PCM, Min 55%',
    approximate_fees: '₹85,000/year',
    description: 'Quality engineering education with industrial exposure.'
  },
  {
    college_name: 'Loyola College',
    college_location: 'Chennai',
    college_state: 'Tamil Nadu',
    college_type: 'Private',
    course_name: 'Bachelor of Arts (BA)',
    course_duration: '3 Years',
    course_type: 'UG',
    stream: 'Arts',
    eligibility: '10+2, Min 50%',
    approximate_fees: '₹45,000/year',
    description: 'Liberal arts education with focus on holistic development.'
  },
  {
    college_name: 'Loyola College',
    college_location: 'Chennai',
    college_state: 'Tamil Nadu',
    college_type: 'Private',
    course_name: 'Bachelor of Commerce (BCom)',
    course_duration: '3 Years',
    course_type: 'UG',
    stream: 'Commerce',
    eligibility: '10+2, Min 50%',
    approximate_fees: '₹40,000/year',
    description: 'Commerce education with emphasis on practical business skills.'
  },
  
  // Karnataka Colleges
  {
    college_name: 'Bangalore University',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Government',
    course_name: 'Bachelor of Science (BSc)',
    course_duration: '3 Years',
    course_type: 'UG',
    stream: 'Science',
    eligibility: '10+2 with PCM/PCB, Min 45%',
    approximate_fees: '₹30,000/year',
    description: 'Comprehensive science program with research opportunities.'
  },
  {
    college_name: 'Bangalore University',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Government',
    course_name: 'Master of Arts (MA)',
    course_duration: '2 Years',
    course_type: 'PG',
    stream: 'Arts',
    eligibility: "Bachelor's degree, Min 50%",
    approximate_fees: '₹20,000/year',
    description: 'Advanced studies in humanities and social sciences.'
  },
  {
    college_name: 'National Law School of India University',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Government',
    course_name: 'Bachelor of Laws (LLB)',
    course_duration: '3 Years',
    course_type: 'UG',
    stream: 'Law',
    eligibility: "Bachelor's degree, CLAT Qualified",
    approximate_fees: '₹2,20,000/year',
    description: 'Premier law school with excellent academic standards.'
  },
  {
    college_name: 'National Law School of India University',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Government',
    course_name: 'Master of Laws (LLM)',
    course_duration: '1 Year',
    course_type: 'PG',
    stream: 'Law',
    eligibility: 'LLB degree, Min 55%',
    approximate_fees: '₹2,50,000/year',
    description: 'Specialized law program with research focus.'
  },
  {
    college_name: 'Manipal Academy of Higher Education',
    college_location: 'Manipal',
    college_state: 'Karnataka',
    college_type: 'Deemed',
    course_name: 'Bachelor of Pharmacy (BPharm)',
    course_duration: '4 Years',
    course_type: 'UG',
    stream: 'Medical',
    eligibility: '10+2 with PCM/PCB, Min 50%',
    approximate_fees: '₹2,00,000/year',
    description: 'Pharmaceutical sciences with modern facilities and research.'
  },
  {
    college_name: 'Christ University',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Deemed',
    course_name: 'Bachelor of Business Administration (BBA)',
    course_duration: '3 Years',
    course_type: 'UG',
    stream: 'Management',
    eligibility: '10+2, Min 60%',
    approximate_fees: '₹1,80,000/year',
    description: 'Business management program with entrepreneurship focus.'
  },
  {
    college_name: 'Christ University',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Deemed',
    course_name: 'Master of Business Administration (MBA)',
    course_duration: '2 Years',
    course_type: 'PG',
    stream: 'Management',
    eligibility: "Bachelor's degree, Min 50%",
    approximate_fees: '₹4,50,000/year',
    description: 'MBA with specializations in Finance, Marketing, and HR.'
  },
  {
    college_name: 'JSS Academy of Technical Education',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Private',
    course_name: 'Diploma in Engineering',
    course_duration: '3 Years',
    course_type: 'Diploma',
    stream: 'Engineering',
    eligibility: '10th pass, Min 40%',
    approximate_fees: '₹60,000/year',
    description: 'Technical education with hands-on training in engineering.'
  },
  
  // Additional diverse courses
  {
    college_name: 'Government Medical College Thiruvananthapuram',
    college_location: 'Thiruvananthapuram',
    college_state: 'Kerala',
    college_type: 'Government',
    course_name: 'Bachelor of Medicine and Bachelor of Surgery (MBBS)',
    course_duration: '5.5 Years',
    course_type: 'UG',
    stream: 'Medical',
    eligibility: '10+2 with PCB, NEET Qualified, Min 50%',
    approximate_fees: '₹10,000/year',
    description: 'Top government medical college with excellent clinical exposure.'
  },
  {
    college_name: 'IIM Bangalore',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Government',
    course_name: 'Post Graduate Programme in Management (PGPM)',
    course_duration: '2 Years',
    course_type: 'PG',
    stream: 'Management',
    eligibility: "Bachelor's degree, CAT Qualified",
    approximate_fees: '₹12,00,000/year',
    description: 'Premier business school with world-class faculty and placements.'
  },
  {
    college_name: 'Calicut University',
    college_location: 'Calicut',
    college_state: 'Kerala',
    college_type: 'Government',
    course_name: 'Bachelor of Computer Applications (BCA)',
    course_duration: '3 Years',
    course_type: 'UG',
    stream: 'Engineering',
    eligibility: '10+2 with Maths, Min 45%',
    approximate_fees: '₹28,000/year',
    description: 'Computer applications program with software development focus.'
  },
  {
    college_name: 'St. Josephs College',
    college_location: 'Bangalore',
    college_state: 'Karnataka',
    college_type: 'Private',
    course_name: 'Certificate in Digital Marketing',
    course_duration: '6 Months',
    course_type: 'Certificate',
    stream: 'Management',
    eligibility: '10+2 or Bachelor degree',
    approximate_fees: '₹35,000 total',
    description: 'Professional certification in digital marketing and social media.'
  }
];

// Create workbook and worksheet
const ws = XLSX.utils.json_to_sheet(collegeData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Colleges');

// Write to file
const filePath = path.join(__dirname, 'colleges.xlsx');
XLSX.writeFile(wb, filePath);

console.log('✅ Excel file created successfully at:', filePath);
console.log(`📊 Total records: ${collegeData.length}`);
