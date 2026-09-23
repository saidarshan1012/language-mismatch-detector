/**
 * Main Analyzer Module
 * Combines language detection with coordinator matching
 */

const { 
  analyzeTranscript, 
  parseSpeakerUtterances, 
  detectRoles 
} = require('./languageDetector.js');
const { findCoordinatorsByLanguages, getAllCoordinators } = require('./coordinatorDB.js');

/**
 * Analyze a call transcript and find matching coordinators
 * @param {string} transcript - The call transcript text
 * @param {Object} options - Analysis options
 * @returns {Object} - Complete analysis result
 */
async function analyzeCallTranscript(transcript, options = {}) {
  // Analyze the transcript for language mismatch
  const languageAnalysis = analyzeTranscript(transcript);

  // Parse speaker utterances for detailed info
  const speakerUtterances = parseSpeakerUtterances(transcript);

  // Detect roles using the sophisticated role detection from languageDetector
  // This uses company identification phrases, service phrases, question ratio, etc.
  const roles = detectRoles(speakerUtterances);

  // Build detailed speaker info with roles
  const speakerDetails = {};
  for (const [speaker, langInfo] of Object.entries(languageAnalysis.speakers)) {
    const utterances = speakerUtterances[speaker] || [];
    const roleInfo = roles[speaker] || { role: 'unknown', confidence: 0, signals: {} };
    
    speakerDetails[speaker] = {
      label: speaker,
      role: roleInfo.role,
      roleConfidence: roleInfo.confidence,
      roleSignals: roleInfo.signals,
      language: {
        code: langInfo.code,
        name: langInfo.name,
        confidence: langInfo.confidence,
        switchesLanguage: langInfo.switchesLanguage || false
      },
      utteranceCount: utterances.length,
      totalCharacters: utterances.join(' ').length,
      isCodeSwitching: langInfo.switchesLanguage || false
    };
  }

  // Find matching coordinators if there's a mismatch
  let matchingCoordinators = [];

  if (languageAnalysis.hasLanguageMismatch) {
    const targetLanguages = languageAnalysis.languages;
    matchingCoordinators = await findCoordinatorsByLanguages(targetLanguages, {
      matchAny: true,
      availableOnly: options.availableOnly ?? true,
      department: options.department
    });

    const bestMatches = await findCoordinatorsByLanguages(targetLanguages, {
      matchAny: false,
      availableOnly: options.availableOnly ?? true,
      department: options.department
    });

    matchingCoordinators = matchingCoordinators.map(c => ({
      ...c.toObject(),
      isBestMatch: bestMatches.some(b => b.id === c.id)
    }));
  }

  // Determine redirection target based on customer's language
  let redirectionTarget = null;
  if (languageAnalysis.hasLanguageMismatch && matchingCoordinators.length > 0) {
    // Find the customer's language to prioritize coordinators who speak that language
    const customerSpeaker = Object.entries(roles)
      .filter(([_, r]) => r.role === 'customer')
      .map(([s, _]) => s)[0];
    
    const customerLanguage = customerSpeaker 
      ? languageAnalysis.speakers[customerSpeaker]?.code 
      : null;

    // Prefer best matches (speaks all detected languages)
    const bestMatch = matchingCoordinators.find(c => c.isBestMatch);
    
    // If customer language is known, prefer coordinators who speak that language
    if (customerLanguage) {
      const customerLangMatch = matchingCoordinators.find(
        c => c.languages.includes(customerLanguage) && (c.isBestMatch || c.available)
      );
      redirectionTarget = customerLangMatch || bestMatch || matchingCoordinators[0];
    } else {
      redirectionTarget = bestMatch || matchingCoordinators[0];
    }
  }

  return {
    transcript: transcript,
    speakerDetails: speakerDetails,
    speakers: languageAnalysis.speakers,
    roles: roles,
    languages: languageAnalysis.languages,
    hasLanguageMismatch: languageAnalysis.hasLanguageMismatch,
    summary: languageAnalysis.summary,
    matchingCoordinators: matchingCoordinators,
    redirectionTarget: redirectionTarget,
    needsCoordinator: languageAnalysis.hasLanguageMismatch,
    recommendation: generateRecommendation(languageAnalysis, matchingCoordinators, redirectionTarget, roles)
  };
}

/**
 * Generate a recommendation based on analysis
 */
function generateRecommendation(analysis, coordinators, target, roles) {
  if (!analysis.hasLanguageMismatch) {
    return {
      priority: 'none',
      message: 'No language mismatch detected. No coordinator intervention needed.',
      action: 'none'
    };
  }

  if (coordinators.length === 0) {
    return {
      priority: 'high',
      message: `Language mismatch detected (${analysis.languages.join(', ')}), but no available coordinator found.`,
      action: 'escalate'
    };
  }

  const bestMatches = coordinators.filter(c => c.isBestMatch);
  
  // Find customer info for recommendation message
  const customerEntry = Object.entries(roles).find(([_, r]) => r.role === 'customer');
  const customerInfo = customerEntry 
    ? `${customerEntry[0]} (speaks ${analysis.speakers[customerEntry[0]]?.name || 'unknown'})`
    : '';
  
  return {
    priority: bestMatches.length > 0 ? 'medium' : 'low',
    message: `Language mismatch detected${customerInfo ? ` - ${customerInfo}` : ''}. Found ${coordinators.length} matching coordinator(s)${bestMatches.length > 0 ? ` (${bestMatches.length} best match${bestMatches.length > 1 ? 'es' : ''})` : ''} who can assist.`,
    suggestedCoordinator: target,
    action: 'assign'
  };
}

module.exports = { analyzeCallTranscript, getAllCoordinators };
