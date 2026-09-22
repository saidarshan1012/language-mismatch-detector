# Language Mismatch Detection Web Application

A web application that analyzes call transcripts to detect language mismatches between speakers and matches them with available coordinators who speak the required languages.

## Features

- **Web Interface**: Modern, responsive UI for uploading and analyzing transcripts
- **Language Detection**: Multiple detection methods:
  - Script-based detection (Unicode) for Indian languages (Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, Urdu)
  - `franc` library for general language detection
  - Per-utterance analysis for code-switching detection
  
- **Language Mismatch Detection**: Identifies when speakers are using different languages

- **Coordinator Matching**: 
  - Finds available coordinators who speak the required languages
  - Marks "Best Matches" who speak ALL detected languages
  - Provides redirection recommendations

- **Role Detection**: Automatically detects speaker roles (Agent, Customer, Supervisor)

## Supported Languages

| Language | Code | Script |
|----------|------|--------|
| English | en | Latin |
| Hindi | hi | Devanagari |
| Tamil | ta | Tamil |
| Telugu | te | Telugu |
| Kannada | kn | Kannada |
| Malayalam | ml | Malayalam |
| Bengali | bn | Bengali |
| Gujarati | gu | Gujarati |
| Punjabi | pa | Gurmukhi |
| Urdu | ur | Arabic |

## Installation

```bash
npm install
```

## Usage

### Start the Web Server

```bash
npm start
```

The server will start at http://localhost:3000

### Web Interface

1. Open http://localhost:3000 in your browser
2. Upload a `.txt` transcript file OR paste transcript text
3. Click "Analyze Transcript"
4. View results including:
   - Speakers with detected languages and roles
   - Language mismatch status
   - Recommended coordinator for redirection

### API Endpoints

#### POST /api/analyze

Analyze a transcript for language mismatch.

**With file upload:**
```bash
curl -X POST -F "transcript=@transcript.txt" http://localhost:3000/api/analyze
```

**With JSON body:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"transcript": "Agent: Hello\nCustomer: नमस्ते"}' \
  http://localhost:3000/api/analyze
```

**Response:**
```json
{
  "speakerDetails": {
    "Agent": {
      "label": "Agent",
      "role": "Agent",
      "language": { "code": "en", "name": "English", "confidence": 1 },
      "utteranceCount": 2,
      "totalCharacters": 50
    },
    "Customer": {
      "label": "Customer",
      "role": "Customer",
      "language": { "code": "hi", "name": "Hindi", "confidence": 1 },
      "utteranceCount": 1,
      "totalCharacters": 30
    }
  },
  "languages": ["en", "hi"],
  "hasLanguageMismatch": true,
  "summary": "Language mismatch detected!...",
  "matchingCoordinators": [...],
  "redirectionTarget": { "name": "Priya Sharma", ... },
  "recommendation": { "priority": "medium", "action": "assign" }
}
```

#### GET /api/coordinators

Get all coordinators in the database.

#### GET /api/history

Get recent analysis history.

## Project Structure

```
D:/guvi-problem/
├── src/
│   ├── server.js           # Express web server
│   ├── analyzer.js         # Main analysis logic
│   ├── languageDetector.js # Language detection module
│   ├── coordinatorDB.js    # Coordinator database (mock)
│   └── index.js           # CLI demo
├── public/
│   └── index.html         # Web UI
├── uploads/               # Temporary file uploads
├── rspack.config.js       # Rspack configuration
├── package.json
└── README.md
```

## Transcript Format

The parser supports various formats:

```
Agent: Hello, how can I help you?
Customer: नमस्ते, मुझे मदद चाहिए।

[00:01:23] Agent: Let me check that for you.
00:01:45 Customer: OK, thank you.
```

Supported speaker labels:
- Agent, CSR, Executive, Support, Advisor
- Customer, Caller, Client, User  
- Supervisor, Manager, Lead
- Bot, AI, Assistant

## Output Fields

| Field | Description |
|-------|-------------|
| `speakerDetails` | Per-speaker analysis with role, language, confidence |
| `languages` | Unique language codes detected |
| `hasLanguageMismatch` | Boolean indicating mismatch |
| `matchingCoordinators` | Available coordinators who speak any detected language |
| `redirectionTarget` | Recommended coordinator for handoff |
| `recommendation` | Priority and action recommendation |

## Building

```bash
npm run build
```

Output will be in `dist/bundle.js`.

## Test Files

Sample transcripts are provided:
- `test-transcript-hindi.txt` - Hindi/English mismatch
- `test-transcript-tamil.txt` - Tamil/English mismatch

## Technologies

- **Backend**: Node.js, Express
- **Language Detection**: franc, Unicode script patterns
- **Build Tool**: Rspack
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework)

## License

ISC
