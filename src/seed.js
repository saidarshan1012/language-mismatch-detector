/**
 * Seed Data for MongoDB
 * Run with: node src/seed.js
 */

require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const Coordinator = require('./models/Coordinator');
const Lead = require('./models/Lead');

// ============================================================
// COORDINATORS
// ============================================================

const coordinators = [
  {
    name: 'Priya Sharma',
    languages: ['en', 'hi'],
    department: 'Sales',
    available: true
  },
  {
    name: 'Rahul Kumar',
    languages: ['en', 'hi', 'ta'],
    department: 'Sales',
    available: true
  },
  {
    name: 'Ananya Krishnan',
    languages: ['en', 'ta', 'kn'],
    department: 'Support',
    available: true
  },
  {
    name: 'Vikram Reddy',
    languages: ['en', 'te'],
    department: 'Sales',
    available: true
  },
  {
    name: 'Meera Nair',
    languages: ['en', 'ml'],
    department: 'Technical',
    available: true
  },
  {
    name: 'Arjun Das',
    languages: ['en', 'bn'],
    department: 'Sales',
    available: false
  },
  {
    name: 'Kavya Patel',
    languages: ['en', 'gu'],
    department: 'Support',
    available: true
  },
  {
    name: 'Harpreet Singh',
    languages: ['en', 'pa'],
    department: 'Sales',
    available: true
  },
  {
    name: 'Farhan Ahmed',
    languages: ['en', 'ur', 'hi'],
    department: 'Technical',
    available: true
  },
  {
    name: 'Divya Mohan',
    languages: ['en'],
    department: 'Sales',
    available: true
  }
];

// ============================================================
// LEADS
// ============================================================

const leads = [
  {
    name: 'Ramesh Thangavel',
    phone: '+91-98765-43210',
    email: 'ramesh.t@email.com',
    status: 'new',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: []
  },

  {
    name: 'Sunita Devi',
    phone: '+91-87654-32109',
    email: 'sunita.dev@email.com',
    status: 'new',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: []
  },

  {
    name: 'Karthik Rajan',
    phone: '+91-76543-21098',
    email: 'karthik.r@email.com',
    status: 'new',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: []
  },

  {
    name: 'Lakshmi Venkatesh',
    phone: '+91-65432-10987',
    email: 'lakshmi.v@email.com',
    status: 'in_progress',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: []
  },

  {
    name: 'Mohan Babu',
    phone: '+91-54321-09876',
    email: 'mohan.b@email.com',
    status: 'in_progress',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: [
      {
        transcript:
          'Agent: Hello, this is Rahul from GUVI. How can I help you today?\n' +
          'Customer: வணக்கம், நான் GUVI பற்றி விவரமாக தெரிந்து கொள்ள விரும்புகிறேன்.\n' +
          'Agent: Sure, I can help you with that in Tamil. What would you like to know?',

        detectedLanguages: ['en', 'ta'],
        detectedBy: 'analysis',

        speakerDetails: {
          Agent: {
            role: 'representative',
            language: {
              code: 'en',
              name: 'English'
            }
          },
          Customer: {
            role: 'customer',
            language: {
              code: 'ta',
              name: 'Tamil'
            }
          }
        }
      }
    ]
  },

  {
    name: 'Amir Hussain',
    phone: '+91-43210-98765',
    email: 'amir.h@email.com',
    status: 'transferred',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: []
  },

  {
    name: 'Kannan Murugan',
    phone: '+91-32109-87654',
    email: 'kannan.m@email.com',
    status: 'pending_transfer',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: [
      {
        transcript:
          'Agent: Hello, how may I assist you?\n' +
          'Customer: எனக்கு ஆங்கிலம் புரியல, தமிழ்ல பேசலாமா?',

        detectedLanguages: ['en', 'ta'],
        detectedBy: 'analysis',

        speakerDetails: {
          Agent: {
            role: 'representative',
            language: {
              code: 'en',
              name: 'English'
            }
          },
          Customer: {
            role: 'customer',
            language: {
              code: 'ta',
              name: 'Tamil'
            }
          }
        }
      }
    ]
  },

  {
    name: 'Pooja Gupta',
    phone: '+91-21098-76543',
    email: 'pooja.g@email.com',
    status: 'pending_transfer',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: [
      {
        transcript:
          'Agent: Good morning, this is Divya from GUVI.\n' +
          'Customer: नमस्ते, मुझे हिंदी में बात करनी है।\n' +
          'Agent: Let me transfer you to someone who speaks Hindi.',

        detectedLanguages: ['en', 'hi'],
        detectedBy: 'analysis',

        speakerDetails: {
          Agent: {
            role: 'representative',
            language: {
              code: 'en',
              name: 'English'
            }
          },
          Customer: {
            role: 'customer',
            language: {
              code: 'hi',
              name: 'Hindi'
            }
          }
        }
      }
    ]
  },

  {
    name: 'Thomas Varghese',
    phone: '+91-10987-65432',
    email: 'thomas.v@email.com',
    status: 'pending_transfer',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: []
  },

  {
    name: 'Deepa Iyer',
    phone: '+91-09876-54321',
    email: 'deepa@email.com',
    status: 'completed',
    assignedCoordinatorId: null,
    requiredLanguage: null,
    callTranscriptions: [
      {
        transcript:
          'Agent: Hello, thank you for calling GUVI.\n' +
          'Customer: Hi, I wanted to know about the courses.\n' +
          'Agent: We have Python, Java, and Full Stack courses available.',

        detectedLanguages: ['en'],
        detectedBy: 'analysis',

        speakerDetails: {
          Agent: {
            role: 'representative',
            language: {
              code: 'en',
              name: 'English'
            }
          },
          Customer: {
            role: 'customer',
            language: {
              code: 'en',
              name: 'English'
            }
          }
        }
      },

      {
        transcript:
          'Agent: Have you decided on which course to enroll?\n' +
          'Customer: Yes, I will join the Full Stack course.',

        detectedLanguages: ['en'],
        detectedBy: 'analysis',

        speakerDetails: {
          Agent: {
            role: 'representative',
            language: {
              code: 'en',
              name: 'English'
            }
          },
          Customer: {
            role: 'customer',
            language: {
              code: 'en',
              name: 'English'
            }
          }
        }
      }
    ]
  }
];

// ============================================================
// SEED DATABASE
// ============================================================

async function seedDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);

    // --------------------------------------------------------
    // Clear existing data
    // --------------------------------------------------------

    await Coordinator.deleteMany({});
    await Lead.deleteMany({});

    console.log('Cleared existing coordinators and leads');

    // --------------------------------------------------------
    // Insert coordinators
    // --------------------------------------------------------

    const insertedCoordinators =
      await Coordinator.insertMany(coordinators);

    console.log(
      `Inserted ${insertedCoordinators.length} coordinators`
    );

    // --------------------------------------------------------
    // Assign leads to coordinators
    //
    // These are REAL MongoDB ObjectIds.
    // --------------------------------------------------------

    const assignments = [
      { leadIndex: 0, coordIndex: 2 }, // Ramesh -> Ananya
      { leadIndex: 1, coordIndex: 7 }, // Sunita -> Harpreet
      { leadIndex: 2, coordIndex: 0 }, // Karthik -> Priya
      { leadIndex: 3, coordIndex: 6 }, // Lakshmi -> Kavya
      { leadIndex: 4, coordIndex: 1 }, // Mohan -> Rahul
      { leadIndex: 5, coordIndex: 8 }, // Amir -> Farhan
      { leadIndex: 6, coordIndex: 3 }, // Kannan -> Vikram
      { leadIndex: 7, coordIndex: 5 }, // Pooja -> Arjun
      { leadIndex: 8, coordIndex: 9 }, // Thomas -> Divya
      { leadIndex: 9, coordIndex: 4 }  // Deepa -> Meera
    ];

    assignments.forEach(({ leadIndex, coordIndex }) => {
      leads[leadIndex].assignedCoordinatorId =
        new mongoose.Types.ObjectId(
          insertedCoordinators[coordIndex]._id
        );
    });

    // --------------------------------------------------------
    // Insert leads
    // --------------------------------------------------------

    const insertedLeads = await Lead.insertMany(leads);

    console.log(
      `Inserted ${insertedLeads.length} leads`
    );

    // --------------------------------------------------------
    // Verify assigned IDs
    // --------------------------------------------------------

    console.log('\n=== Lead Assignments ===');

    insertedLeads.forEach(lead => {
      console.log(
        `${lead.name} -> ${lead.assignedCoordinatorId}`
      );
    });

    // --------------------------------------------------------
    // Summary
    // --------------------------------------------------------

    console.log('\n=== Seed Summary ===');

    console.log('\nCoordinators:');

    insertedCoordinators.forEach(coordinator => {
      console.log(
        `- ${coordinator.name} (${coordinator.department}) ` +
        `[${coordinator.languages.join(', ')}] ` +
        `${coordinator.available ? '✓' : '✗'}`
      );
    });

    console.log('\nLeads by Status:');

    const statusCount = {};

    insertedLeads.forEach(lead => {
      statusCount[lead.status] =
        (statusCount[lead.status] || 0) + 1;
    });

    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`- ${status}: ${count}`);
    });

    console.log('\n✅ Seed completed successfully!');

    await mongoose.disconnect();

    process.exit(0);

  } catch (error) {
    console.error('Seed error:', error);

    await mongoose.disconnect();

    process.exit(1);
  }
}

seedDatabase();