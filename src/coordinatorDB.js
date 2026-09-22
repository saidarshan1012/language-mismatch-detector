/**
 * Coordinator Database Module
 * Manages the database of coordinators and their language skills
 */
// Mock database of coordinators
// In production, this would be replaced with actual database connection
const coordinatorDatabase = [
  { id: 1, name: 'Priya Sharma', languages: ['en', 'hi'], department: 'Support', available: true },
  { id: 2, name: 'Rahul Kumar', languages: ['en', 'hi', 'ta'], department: 'Support', available: true },
  { id: 3, name: 'Ananya Reddy', languages: ['en', 'te'], department: 'Technical', available: true },
  { id: 4, name: 'Vikram Singh', languages: ['en', 'hi', 'pa'], department: 'Support', available: false },
  { id: 5, name: 'Meera Nair', languages: ['en', 'ml'], department: 'Sales', available: true },
  { id: 6, name: 'Arjun Das', languages: ['en', 'bn'], department: 'Support', available: true },
  { id: 7, name: 'Kavitha Krishnan', languages: ['en', 'ta', 'kn'], department: 'Technical', available: true },
  { id: 8, name: 'Deepak Patel', languages: ['en', 'hi', 'gu'], department: 'Support', available: true },
  { id: 9, name: 'Sunita Gupta', languages: ['en', 'hi'], department: 'Technical', available: true },
  { id: 10, name: 'Ramesh Iyer', languages: ['en', 'ta', 'hi'], department: 'Sales', available: true },
];

/**
 * Find coordinators who know a specific language
 * @param {string} languageCode - ISO 639-1 language code
 * @param {Object} options - Filter options
 * @returns {Array} - Matching coordinators
 */
function findCoordinatorsByLanguage(languageCode, options = {}) {
  const { availableOnly = true, department = null } = options;

  return coordinatorDatabase.filter(coordinator => {
    // Check language
    if (!coordinator.languages.includes(languageCode)) {
      return false;
    }

    // Check availability
    if (availableOnly && !coordinator.available) {
      return false;
    }

    // Check department
    if (department && coordinator.department !== department) {
      return false;
    }

    return true;
  });
}

/**
 * Find coordinators who know multiple languages
 * @param {Array<string>} languageCodes - Array of ISO 639-1 language codes
 * @param {Object} options - Filter options
 * @returns {Array} - Matching coordinators
 */
function findCoordinatorsByLanguages(languageCodes, options = {}) {
  const { matchAny = true, availableOnly = true, department = null } = options;

  return coordinatorDatabase.filter(coordinator => {
    // Language matching logic
    const languageMatch = matchAny
      ? languageCodes.some(code => coordinator.languages.includes(code))
      : languageCodes.every(code => coordinator.languages.includes(code));

    if (!languageMatch) return false;

    // Check availability
    if (availableOnly && !coordinator.available) return false;

    // Check department
    if (department && coordinator.department !== department) return false;

    return true;
  });
}

/**
 * Get all available coordinators
 * @returns {Array} - All coordinators
 */
function getAllCoordinators() {
  return [...coordinatorDatabase];
}

/**
 * Add a coordinator to the database
 * @param {Object} coordinator - Coordinator details
 * @returns {Object} - Added coordinator with ID
 */
function addCoordinator(coordinator) {
  const newCoordinator = {
    id: coordinatorDatabase.length + 1,
    ...coordinator,
    available: coordinator.available ?? true
  };
  coordinatorDatabase.push(newCoordinator);
  return newCoordinator;
}

module.exports = {
  findCoordinatorsByLanguage,
  findCoordinatorsByLanguages,
  getAllCoordinators,
  addCoordinator
};
