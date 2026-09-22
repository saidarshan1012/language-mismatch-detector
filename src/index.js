/**
 * Main Entry Point
 * Language Mismatch Detection Application
 */

const { analyzeTranscript, detectLanguage } = require('./languageDetector.js');
const { findCoordinatorsByLanguage, findCoordinatorsByLanguages, getAllCoordinators } = require('./coordinatorDB.js');
const { analyzeCallTranscript } = require('./analyzer.js');

// Sample transcripts for testing
const sampleTranscripts = [
  // No mismatch - English
  `Agent: Hello, thank you for calling customer support. How may I help you today?
Customer: Hi, I need help with my recent order. It hasn't arrived yet.
Agent: I apologize for the inconvenience. Let me look up your order details.
Customer: Sure, my order number is 12345.`,

  // Hindi mismatch (with Devanagari script)
  `Agent: Hello, thank you for calling customer support.
Customer: नमस्ते, मुझे अपने ऑर्डर के बारे में जानकारी चाहिए।
Agent: I'm sorry, could you please repeat that in English?
Customer: मैं हिंदी में बात करना चाहता हूं। मेरी समस्या समझ में नहीं आ रही है।`,

  // Tamil mismatch (with Tamil script)
  `Agent: Good morning, customer support. How can I assist you?
Customer: வணக்கம், எனக்கு ஒரு துணிக் கொள்ளை இருக்கு.
Agent: I'm sorry, I don't understand. Could you speak in English?
Customer: நான் தமிழ் பேசுகிறேன். ஒரு விஷயம் கேட்க வேண்டும்.`,

  // Mixed languages - bilingual agent
  `Agent: Hello, this is Priya from technical support.
Customer: नमस्ते, मुझे एक तकनीकी समस्या है। Can you help me?
Agent: Of course! आप हिंदी में बताना चाहते हो या English में?
Customer: आप दोनों समझते हो? बहुत अच्छा!`
];

/**
 * Run analysis on sample transcripts
 */
function runDemo() {
  console.log('='.repeat(60));
  console.log('LANGUAGE MISMATCH DETECTION APPLICATION');
  console.log('='.repeat(60));
  console.log();

  sampleTranscripts.forEach((transcript, index) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`TRANSCRIPT ${index + 1}`);
    console.log('─'.repeat(60));
    console.log(transcript);

    console.log('\n--- ANALYSIS RESULT ---');
    const result = analyzeCallTranscript(transcript);

    console.log(`\n📊 Language Mismatch: ${result.analysis.hasLanguageMismatch ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`📝 Languages Detected: ${result.analysis.languages.length > 0 ? result.analysis.languages.join(', ') : 'None'}`);
    console.log(`\n💬 Summary: ${result.analysis.summary}`);

    if (result.needsCoordinator) {
      console.log(`\n👥 Matching Coordinators (${result.matchingCoordinators.length}):`);
      result.matchingCoordinators.forEach(c => {
        console.log(`   • ${c.name} - Languages: ${c.languages.join(', ')} - Dept: ${c.department}`);
      });
      console.log(`\n📌 Recommendation: ${result.recommendation.message}`);
    }

    console.log();
  });

  // Show all coordinators
  console.log('\n' + '='.repeat(60));
  console.log('AVAILABLE COORDINATORS DATABASE');
  console.log('='.repeat(60));
  getAllCoordinators().forEach(c => {
    const status = c.available ? '✓ Available' : '✗ Busy';
    console.log(`[${c.id}] ${c.name} | Languages: ${c.languages.join(', ')} | ${c.department} | ${status}`);
  });
}

/**
 * Analyze a custom transcript
 * @param {string} transcript - Custom transcript text
 */
function analyzeCustomTranscript(transcript) {
  return analyzeCallTranscript(transcript);
}

// Export main functions
module.exports = {
  analyzeTranscript,
  detectLanguage,
  findCoordinatorsByLanguage,
  findCoordinatorsByLanguages,
  analyzeCallTranscript,
  getAllCoordinators,
  analyzeCustomTranscript
};

// Run demo when executed directly
if (require.main === module) {
  runDemo();
}
