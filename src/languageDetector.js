/**
 * Language Detection Module
 * Uses 'franc' library to detect language from text
 */

const { franc, francAll } = require('franc');
const ISO6391 = require('iso-639-1');

// Map ISO 639-3 to ISO 639-1
const langMap = {
  'eng': 'en',
  'hin': 'hi',
  'tam': 'ta',
  'tel': 'te',
  'kan': 'kn',
  'mal': 'ml',
  'mar': 'mr',
  'ben': 'bn',
  'guj': 'gu',
  'pan': 'pa',
  'urd': 'ur',
  'ara': 'ar',
  'spa': 'es',
  'fra': 'fr',
  'deu': 'de',
  'por': 'pt',
  'ita': 'it',
  'rus': 'ru',
  'jpn': 'ja',
  'kor': 'ko',
  'zho': 'zh',
  'und': 'und'
};

// Script-based detection for Indian languages
// NOTE: these only match native Unicode script blocks. Romanized/transliterated
// Indic text (e.g. "eppadi irukkeenga") will NOT match any of these and will
// fall through to franc, which is unreliable on romanized Indic input. If your
// transcripts may contain romanized text, this module needs a separate
// classifier for that case — script-range regex alone can't cover it.
const scriptPatterns = {
  // Devanagari script (Hindi, Marathi, etc.)
  hi: /[\u0900-\u097F]/g,
  // Tamil script
  ta: /[\u0B80-\u0BFF]/g,
  // Telugu script
  te: /[\u0C00-\u0C7F]/g,
  // Kannada script
  kn: /[\u0C80-\u0CFF]/g,
  // Malayalam script
  ml: /[\u0D00-\u0D7F]/g,
  // Bengali script
  bn: /[\u0980-\u09FF]/g,
  // Gujarati script
  gu: /[\u0A80-\u0AFF]/g,
  // Gurmukhi/Punjabi script
  pa: /[\u0A00-\u0A7F]/g,
  // Arabic/Urdu script (shared block — Arabic text will also match this and
  // be labeled 'ur'. Add Urdu-specific extended-range characters if you need
  // to disambiguate Arabic from Urdu.)
  ur: /[\u0600-\u06FF]/g,
};

// franc needs a reasonable amount of text to be trustworthy. Short utterances
// ("yes sir", "ok tell me") produce near-random guesses with a misleadingly
// present score, so we gate franc's use below this length.
const FRANC_MIN_RELIABLE_LENGTH = 20;

// --- Role detection (business representative vs. customer) ---
//
// This is a heuristic MVP classifier, not a trained model. It assumes a
// two-party call. Confidence should always be surfaced to the caller rather
// than treated as certain, since none of these signals are individually
// reliable, especially across languages.
//
// Signal 1 (strongest, near-decisive): the speaker label itself already
// names the role, e.g. "Agent:", "Customer:", "Rep 1:". Common in transcripts
// produced by call-center tooling.
const representativeLabelKeywords = ['agent', 'rep', 'representative', 'csr', 'support', 'advisor', 'executive', 'associate', 'care team', 'staff'];
const customerLabelKeywords = ['customer', 'client', 'caller', 'user', 'guest'];

// Signal 2: service/greeting phrases typical of a representative opening or
// closing a call.
// Signal 3: company-identification phrases — e.g. "we are calling you from
// HCL GUVI", "calling on behalf of [company]" — this is one of the strongest
// content signals for MVP purposes, since a customer essentially never says
// this. MVP coverage is English + Tamil only, as agreed; extend with
// Kannada/other-language equivalents once you have more sample transcripts.
const representativePhrases = [
  'thank you for calling', 'thanks for calling', 'how can i help', 'how may i help',
  'how may i assist', 'how can i assist', 'is there anything else',
  'may i know your name', 'may i have your', 'your reference number', 'your ticket number',
  'this call may be recorded', 'this call is being recorded', 'welcome to',
  'good morning, this is', 'good afternoon, this is', 'good evening, this is',
  'speaking with', 'how may i direct'
];

// Company-identification patterns: "we are calling you from <company>" and
// its Tamil equivalent. Matched with regex (not plain substring) so small
// wording variations ("we're calling from", "this is calling from") are
// still caught. MVP: English + Tamil only.
const companyIdentificationPatterns = [
  // English
  /we\s*(are|'re)?\s*calling\s*(you\s*)?from/i,
  /calling\s*(you\s*)?on\s*behalf\s*of/i,
  /this\s*is\s*.{0,40}\s*calling\s*from/i,
  /this\s*is\s*.{0,40}\s*from\s*(hcl|guvi)/i,
  // Tamil — "...-இலிருந்து/இருந்து உங்களை அழைக்கிறோம்" (calling you from ...),
  // "...சார்பாக அழைக்கிறோம்" (calling on behalf of ...),
  // "...நிறுவனத்திலிருந்து அழைக்கிறோம்" (calling from the company)
  /இருந்து\s*(உங்களை\s*)?அழைக்கிறோம்/,
  /சார்பாக\s*அழைக்கிறோம்/,
  /நிறுவனத்திலிருந்து\s*அழைக்கிறோம்/
];

/**
 * Detect language from text using script character proportions.
 * Instead of returning on the first script that appears anywhere in the text
 * (which breaks on code-mixed utterances, e.g. Tamil+English in one turn),
 * this counts characters per script and returns the majority script, while
 * flagging when more than one script is present.
 * @param {string} text - The text to analyze
 * @returns {Object|null} - Detected language info or null
 */
function detectByScript(text) {
  const counts = {};
  let total = 0;

  for (const [lang, pattern] of Object.entries(scriptPatterns)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      counts[lang] = matches.length;
      total += matches.length;
    }
  }

  if (total === 0) {
    return null;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topLang, topCount] = sorted[0];
  const isMixed = sorted.length > 1;

  return {
    code: topLang,
    name: ISO6391.getName(topLang) || topLang,
    confidence: Math.round((topCount / total) * 100) / 100,
    method: 'script',
    mixed: isMixed,
    // Full breakdown so callers can see secondary scripts rather than losing
    // that signal entirely (useful for code-switched call center speech).
    scriptBreakdown: isMixed
      ? Object.fromEntries(sorted.map(([lang, count]) => [lang, count]))
      : undefined
  };
}

// Common short English words/acknowledgments seen in call transcripts. Used
// only as a fallback for short, pure-Latin-alphabet text that would
// otherwise be discarded as 'und' below FRANC_MIN_RELIABLE_LENGTH. This
// matters specifically for language-switch calls: a speaker's short English
// confirmations ("yes sir", "ok thank you") would otherwise be silently
// excluded from the per-speaker majority vote, which can leave an earlier
// minority language incorrectly "winning" even after the conversation has
// actually moved to English.
const commonEnglishWords = new Set([
  'yes', 'no', 'ok', 'okay', 'sure', 'fine', 'good', 'thank', 'thanks', 'you',
  'sir', 'maam', 'maam', 'please', 'hello', 'hi', 'bye', 'morning', 'afternoon',
  'evening', 'speaking', 'calling', 'call', 'from', 'is', 'the', 'and', 'not',
  'can', 'will', 'i', 'we', 'comfortable', 'english', 'understand', 'right',
  'correct', 'done', 'problem', 'issue', 'wait', 'hold', 'line'
]);

/**
 * Detect language from text
 * @param {string} text - The text to analyze
 * @returns {Object} - Detected language info
 */
function detectLanguage(text) {
  if (!text || text.trim().length < 3) {
    return { code: 'und', name: 'Unknown', confidence: 0 };
  }

  // First try script-based detection for Indian languages
  const scriptResult = detectByScript(text);
  if (scriptResult) {
    return scriptResult;
  }

  const trimmed = text.trim();

  // Below franc's reliable-length threshold: instead of defaulting straight
  // to 'und' (which drops this utterance from majority-language voting),
  // check whether it's short, pure-Latin-alphabet text containing a common
  // English word. If so, count it as English at reduced confidence rather
  // than losing the signal entirely. Anything that doesn't match still
  // returns 'und' as before.
  if (trimmed.length < FRANC_MIN_RELIABLE_LENGTH) {
    const isPureLatin = /^[a-zA-Z0-9\s.,!?'"-]+$/.test(trimmed);
    if (isPureLatin) {
      const words = trimmed.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
      if (words.some(w => commonEnglishWords.has(w))) {
        return { code: 'en', name: 'English', confidence: 0.6, method: 'short_latin_heuristic' };
      }
    }
    return { code: 'und', name: 'Unknown', confidence: 0, method: 'too_short' };
  }

  // Use franc for other languages
  const results = francAll(text, { minLength: 3, only: ['eng', 'hin', 'tam', 'tel', 'kan', 'mal', 'ben', 'guj', 'pan', 'urd'] });

  if (results && results.length > 0) {
    const [langCode, score] = results[0];
    const isoCode = langMap[langCode] || langCode;
    const langName = isoCode === 'und' ? 'Unknown' : (ISO6391.getName(isoCode) || langCode);

    return {
      code: isoCode,
      name: langName,
      originalCode: langCode,
      confidence: Math.round(score * 100) / 100,
      method: 'franc'
    };
  }

  // Fallback: try general franc detection
  const langCode = franc(text);
  const isoCode = langMap[langCode] || langCode;
  const langName = isoCode === 'und' ? 'Unknown' : (ISO6391.getName(isoCode) || langCode);

  return {
    code: isoCode,
    name: langName,
    originalCode: langCode,
    confidence: langCode === 'und' ? 0 : 0.5,
    method: 'fallback'
  };
}

/**
 * Parse a transcript into per-speaker utterances.
 * Handles an optional leading timestamp (e.g. "[00:01:23] Speaker 1: hello"
 * or "00:01:23 Speaker 1: hello") before the speaker label, so the first
 * colon in a timestamp isn't mistaken for the speaker delimiter. The speaker
 * label itself is restricted to a short run of letters/digits/spaces so a
 * colon appearing later inside the utterance text doesn't get misread as a
 * second label.
 * @param {string} transcript - Full transcript with speaker labels
 * @returns {Object} - Map of speaker -> array of utterance strings
 */
function parseSpeakerUtterances(transcript) {
  // Normalize line endings first. Windows-style \r\n (common in uploaded
  // .txt files) leaves a trailing \r on every line if we only split on '\n'.
  // JS regex '.' doesn't match \r, and '$' (without the 'm' flag) only
  // matches the true end of the string — so that leftover \r silently breaks
  // the match on every line except the last one. Stripping \r here (rather
  // than trying to account for it in the regex) keeps the regex itself
  // simple and handles \r\n, bare \r, and \n uniformly.
  const lines = transcript.split(/\r\n|\r|\n/).filter(line => line.trim());
  const speakerUtterances = {};

  // Optional timestamp like "[00:01:23]" or "00:01:23" or "(00:01)", then a
  // short speaker label (<=30 chars, no colons), then the utterance.
  const lineRegex = /^\s*(?:[[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s+)?([A-Za-z0-9 _.-]{1,30}):\s*(.+)$/;

  lines.forEach(line => {
    const match = line.match(lineRegex);
    if (match) {
      const [, speaker, text] = match;
      const key = speaker.trim();
      if (!speakerUtterances[key]) {
        speakerUtterances[key] = [];
      }
      speakerUtterances[key].push(text.trim());
    }
  });

  return speakerUtterances;
}

/**
 * Score how likely a single speaker is to be the business representative,
 * based on their speaker label, speaking order, company-identification
 * phrases, service phrases, and question ratio. Higher score = more likely
 * representative; lower/negative = more likely customer.
 * @param {string} speaker - Speaker label as it appears in the transcript
 * @param {string[]} utterances - This speaker's utterances
 * @param {boolean} speaksFirst - Whether this speaker's first line precedes
 *   every other speaker's first line in the transcript
 * @returns {Object} - { score, signals }
 */
function scoreRepresentativeLikelihood(speaker, utterances, speaksFirst) {
  let score = 0;
  const signals = {};

  // Signal 1: the label itself names the role.
  const lowerLabel = speaker.toLowerCase();
  if (representativeLabelKeywords.some(k => lowerLabel.includes(k))) {
    signals.labelMatch = 'representative';
    score += 10;
  } else if (customerLabelKeywords.some(k => lowerLabel.includes(k))) {
    signals.labelMatch = 'customer';
    score -= 10;
  }

  // Signal 2: speaks first (representatives/agents typically open the call).
  if (speaksFirst) {
    signals.speaksFirst = true;
    score += 1;
  }

  // Signal 3: service/greeting phrases (currently English-only substring
  // list — weaker/more generic than the company-ID signal below).
  const joined = utterances.join(' ').toLowerCase();
  const phraseHits = representativePhrases.filter(p => joined.includes(p));
  if (phraseHits.length > 0) {
    signals.servicePhrases = phraseHits;
    score += phraseHits.length;
  }

  // Signal 4: company-identification phrases ("we are calling you from
  // <company>", Tamil equivalents). Near-decisive when present — a customer
  // essentially never says this — so weighted close to the label-match
  // signal. MVP: English + Tamil only (see companyIdentificationPatterns).
  const companyIdHits = companyIdentificationPatterns.filter(p => p.test(joined));
  if (companyIdHits.length > 0) {
    signals.companyIdentification = true;
    score += 8 * companyIdHits.length;
  }

  // Signal 5: question ratio — representatives tend to ask more clarifying/
  // process questions (verifying details, asking what the issue is) than
  // customers, who more often state a problem or answer. This is a weak,
  // noisy signal on its own, so it's weighted lightly.
  const questionCount = utterances.filter(u => u.trim().endsWith('?')).length;
  const questionRatio = utterances.length > 0 ? questionCount / utterances.length : 0;
  signals.questionRatio = Math.round(questionRatio * 100) / 100;
  score += questionRatio;

  return { score, signals };
}

/**
 * Detect which speaker is the business representative and which is the
 * customer. Heuristic MVP classifier — see comments above
 * scoreRepresentativeLikelihood for the signals used and their limitations.
 * Designed for two-party calls; with more than two speakers, only the
 * highest scorer is labeled "representative" and the rest are labeled
 * "customer", which may not be accurate (e.g. conference calls, transfers).
 * @param {Object} speakerUtterances - Map of speaker -> utterance array, as
 *   returned by parseSpeakerUtterances (key order = order of first appearance)
 * @returns {Object} - Map of speaker -> { role, confidence, signals }
 */
function detectRoles(speakerUtterances) {
  const speakerOrder = Object.keys(speakerUtterances);
  if (speakerOrder.length === 0) {
    return {};
  }

  if (speakerOrder.length === 1) {
    return {
      [speakerOrder[0]]: { role: 'unknown', confidence: 0, signals: { note: 'only one speaker detected' } }
    };
  }

  const scored = speakerOrder.map((speaker, i) => ({
    speaker,
    ...scoreRepresentativeLikelihood(speaker, speakerUtterances[speaker], i === 0)
  }));

  scored.sort((a, b) => b.score - a.score);

  const scoreGap = scored[0].score - scored[1].score;
  // Normalize the gap into a rough 0-1 confidence. This is a heuristic
  // scale, not a calibrated probability.
  const confidence = Math.max(0, Math.min(1, scoreGap / 10));

  const roles = {};
  scored.forEach((entry, i) => {
    roles[entry.speaker] = {
      role: i === 0 ? 'representative' : 'customer',
      confidence: i === 0 ? Math.round(confidence * 100) / 100 : Math.round(confidence * 100) / 100,
      signals: entry.signals
    };
  });

  if (speakerOrder.length > 2) {
    roles._note = 'More than two speakers detected — role detection assumed a two-party call; only the top scorer was labeled representative.';
  }

  return roles;
}

/**
 * Analyze a transcript for language mismatch and speaker roles
 * @param {string} transcript - Full transcript with speaker labels
 * @returns {Object} - Analysis result with detected languages, mismatch info,
 *   and representative/customer role detection
 */
function analyzeTranscript(transcript) {
  const speakerUtterances = parseSpeakerUtterances(transcript);
  const roles = detectRoles(speakerUtterances);

  // Detect language per utterance (not just once on the joined blob), so a
  // speaker who code-switches across turns isn't collapsed into a single
  // label. We still report a per-speaker "dominant" language, but the
  // per-utterance detail is kept too.
  const speakerLanguages = {};
  const speakerUtteranceDetail = {};

  for (const [speaker, utterances] of Object.entries(speakerUtterances)) {
    const perUtterance = utterances.map(u => detectLanguage(u));
    speakerUtteranceDetail[speaker] = utterances.map((text, i) => ({
      text,
      detected: perUtterance[i]
    }));

    // Dominant language: proportion of this speaker's utterances detected in
    // each language — plain majority vote, no weighting by position or
    // character length. If a speaker's utterances split e.g. 20% Tamil / 80%
    // English, English wins and confidence reports as 0.8. This was tried
    // with length-weighting and position-weighting first; both were dropped
    // because they added bias (script verbosity, recency) the goal doesn't
    // call for — the goal is just: which language did each speaker use for
    // most of their turns, and do the two speakers' majorities match.
    const codeCounts = {};
    perUtterance.forEach(d => {
      if (d.code !== 'und') {
        codeCounts[d.code] = (codeCounts[d.code] || 0) + 1;
      }
    });

    const ranked = Object.entries(codeCounts).sort((a, b) => b[1] - a[1]);
    if (ranked.length > 0) {
      const [dominantCode] = ranked[0];
      const totalCount = ranked.reduce((sum, [, c]) => sum + c, 0);
      speakerLanguages[speaker] = {
        code: dominantCode,
        name: dominantCode === 'und' ? 'Unknown' : (ISO6391.getName(dominantCode) || dominantCode),
        confidence: Math.round((ranked[0][1] / totalCount) * 100) / 100,
        method: 'per_utterance_majority',
        switchesLanguage: ranked.length > 1
      };
    } else {
      speakerLanguages[speaker] = detectLanguage(utterances.join(' '));
    }
  }

  // Check for language mismatch
  const languages = [...new Set(Object.values(speakerLanguages).map(l => l.code))];
  const hasMismatch = languages.length > 1 && !languages.includes('und');

  return {
    speakers: speakerLanguages,
    speakerUtteranceDetail,
    roles,
    languages: languages.filter(l => l !== 'und'),
    hasLanguageMismatch: hasMismatch,
    primaryLanguage: languages[0] || 'und',
    secondaryLanguage: languages[1] || null,
    summary: generateSummary(speakerLanguages, hasMismatch, roles)
  };
}

/**
 * Generate a human-readable summary
 */
function generateSummary(speakerLanguages, hasMismatch, roles = {}) {
  const speakers = Object.entries(speakerLanguages);

  if (speakers.length === 0) {
    return 'No speakers detected in transcript.';
  }

  const roleLabel = (speaker) => {
    const r = roles[speaker];
    if (!r || r.role === 'unknown') return '';
    return ` [${r.role}]`;
  };

  if (!hasMismatch) {
    const lang = speakers[0][1].name;
    return `All speakers are communicating in ${lang}. No language mismatch detected.`;
  }

  const langList = speakers.map(([speaker, lang]) =>
    `${speaker}${roleLabel(speaker)} (${lang.name}${lang.switchesLanguage ? ', code-switching' : ''})`
  ).join(' and ');

  return `Language mismatch detected! Speakers: ${langList}.`;
}

module.exports = {
  detectLanguage,
  analyzeTranscript,
  detectByScript,
  parseSpeakerUtterances,
  detectRoles
};