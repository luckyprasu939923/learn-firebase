require('dotenv').config();
const UserService = require('../services/userService');

const MOCK_USERS = [
  {
    uid: 'usr_lucky_939923',
    name: 'Lucky Prasu',
    email: 'luckyprasu939923@gmail.com',
    role: 'admin',
    department: 'Engineering',
    bio: 'Lead Full Stack Engineer & Firebase Architecture Specialist',
    phone: '+91 98765 43210',
    location: 'Hyderabad, India',
    status: 'active',
    skills: ['JavaScript', 'Node.js', 'Firebase', 'Express', 'React', 'Cloud Firestore'],
  },
  {
    uid: 'usr_sophia_chen_201',
    name: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    role: 'lead_designer',
    department: 'Design',
    bio: 'Product Designer focusing on accessible design systems and glassmorphic micro-interactions.',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    status: 'active',
    skills: ['UI/UX', 'Figma', 'Design Systems', 'CSS3 Animations', 'User Research'],
  },
  {
    uid: 'usr_marcus_vance_305',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    role: 'cloud_architect',
    department: 'Infrastructure',
    bio: 'GCP Certified Cloud Architect managing scalable databases, security rules, and DevOps.',
    phone: '+44 20 7946 0912',
    location: 'London, UK',
    status: 'active',
    skills: ['Google Cloud', 'Firebase Admin', 'Kubernetes', 'CI/CD', 'Security Rules'],
  },
  {
    uid: 'usr_aarav_patel_412',
    name: 'Aarav Patel',
    email: 'aarav.patel@example.com',
    role: 'backend_developer',
    department: 'Backend Engineering',
    bio: 'Backend developer designing resilient RESTful APIs, JWT authentication, and caching layers.',
    phone: '+91 91234 56789',
    location: 'Bengaluru, India',
    status: 'active',
    skills: ['Node.js', 'Express', 'Bcrypt', 'REST APIs', 'Cloud Firestore'],
  },
  {
    uid: 'usr_elena_rostova_529',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    role: 'qa_engineer',
    department: 'Quality Assurance',
    bio: 'Quality Assurance engineer automating end-to-end testing and API regression testing.',
    phone: '+49 30 1234567',
    location: 'Berlin, Germany',
    status: 'active',
    skills: ['Jest', 'Postman', 'Integration Testing', 'Cypress', 'Automation'],
  },
];

async function seedData() {
  console.log('====================================================');
  console.log('🚀 Seeding Mock Data into Cloud Firestore (Collection: users)...');
  console.log('Project ID: work-mock-c479f');
  console.log('====================================================\n');

  const results = [];

  for (const user of MOCK_USERS) {
    try {
      const created = await UserService.createUser(user);
      results.push(created);
      console.log(`✅ [Firestore] Created user: ${user.name} (${user.email}) -> users/${user.uid}`);
    } catch (err) {
      console.error(`❌ Failed to create ${user.name}:`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 Seeding complete! Successfully added ${results.length}/${MOCK_USERS.length} mock users to Firestore.`);
  console.log('👉 View in Userface: http://localhost:5000/userface/username.html');
  console.log('👉 View in Firebase Console: https://console.firebase.google.com/project/work-mock-c479f/firestore');
  console.log('====================================================');

  return results;
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedData, MOCK_USERS };
