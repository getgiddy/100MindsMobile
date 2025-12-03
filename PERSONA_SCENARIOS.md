# Persona-Based Scenario Creation

## Overview

100Minds Mobile now supports creating AI-powered practice scenarios using the Tavus Persona API. This allows users to define interactive coaching experiences with customizable persona behavior, voice, perception, and conversational flow.

## Architecture

### Data Model

**Scenario Type** (`types/scenario.ts`)

- Extended with `tags?: string[]` and `persona?: PersonaConfig`
- `PersonaConfig` includes:
  - Core fields: `personaId`, `personaName`, `systemPrompt`, `pipelineMode`, `context`, `defaultReplicaId`
  - Layers: `llm`, `tts`, `perception`, `stt`, `conversational_flow`
  - Knowledge: `document_ids`, `document_tags`
  - Status tracking: `status`, `lastStatusAt`, `syncError`, `isSyncedRemote`

**Persona Status Lifecycle**

1. `queued` - Persona creation request queued locally or on server
2. `processing` - Tavus is building the persona (may take seconds to minutes)
3. `ready` - Persona is active and can be used in calls
4. `error` - Creation failed; see `syncError` for details

### Services

#### `scenarioService.ts`

- Enhanced `createScenario` to accept `PersonaInput` and store with defaults
- Migration logic in `initialize()` backfills `tags` and `persona` for existing scenarios
- `defaultPersonaConfig()` provides Phase 1 safe defaults

#### `tavusService.ts` (Backend Proxy)

- `createPersona(input)` - POST to backend `/tavus/personas`
- `pollPersonaStatus(personaId)` - Exponential backoff polling (2s → 30s max)
- `getPersonaStatus(personaId)` - Single status fetch
- `listDocuments()` - Fetch pre-indexed knowledge documents
- `listReplicas()` - Fetch available video replicas
- Payload builders for Tavus API format

**Security:** API key is never exposed client-side; backend proxy adds `x-api-key` header.

### Validation

**`utils/validation.ts`**

- `validateScenarioInput()` - Validates title, description, category, duration, tags, persona
- `validatePersonaInput()` - Enforces:
  - `systemPrompt` required for `pipelineMode: "full"`
  - Character limits: prompt ≤ 5000, context ≤ 10000
  - Document/tag limits: ≤ 50 docs, ≤ 20 tags
  - LLM tools ≤ 20

### UI Components

#### `app/create-scenario.tsx`

Multi-step form for creating scenarios with persona configuration:

1. **Basics**: Title, Description (with character counter)
2. **Category & Duration**: Picker for category, numeric input for duration, difficulty picker
3. **Persona Prompt**: System prompt textarea (required for "full" mode)
4. **Persona Context**: Optional context examples
5. **Pipeline Mode**: Toggle "full" vs "echo"
6. **Tags**: Add custom or select from suggested tags
7. **Validation**: Real-time error display; prevents submission on invalid input

#### `components/Picker.tsx`

Custom modal-based picker for cross-platform consistency (category, difficulty)

#### `components/PersonaStatusBadge.tsx`

Color-coded status indicator:

- 🟡 Queued (orange)
- 🔵 Processing (blue)
- 🟢 Ready (green)
- 🔴 Error (red)

#### `components/ScenarioCard.tsx`

Enhanced to display:

- Tags (max 3 visible + "more" count)
- Pipeline mode badge
- Persona status badge

## Phased Rollout Plan

### ✅ Phase 1: Core Persona Creation (Completed)

- [x] Extend types with persona fields
- [x] Storage migration with defaults
- [x] Create UI with prompt, context, pipeline mode
- [x] Validation and error handling
- [x] Category/duration/difficulty selectors
- [x] Status badge component
- [x] Enhanced scenario cards

### 📋 Phase 2: Knowledge & Documents (Next)

- [ ] Pre-indexed document selection UI
- [ ] Document/tag picker with search
- [ ] Backend endpoints for listing documents
- [ ] Attach documents to persona during creation
- [ ] Display knowledge metadata in scenario details

### 🔮 Phase 3: Advanced Layers (Future)

- [ ] LLM settings: model selection, speculative inference, tools/functions
- [ ] TTS settings: engine, voice, emotion control
- [ ] Perception: ambient awareness queries, perception tools
- [ ] STT: engine, pause/interrupt sensitivity
- [ ] Conversational flow: turn detection, patience, commitment
- [ ] Expert mode toggle with progressive disclosure

### 🚀 Phase 4: Remote Sync & Polling

- [ ] Integrate `tavusService.createPersona()` on scenario save
- [ ] Optimistic local save → remote creation → poll status
- [ ] Background polling service with AppState listeners
- [ ] Retry/backoff for failed creations
- [ ] Offline queue for scenarios created without connectivity

## Backend Requirements

### Endpoints to Implement

```typescript
// Create persona (proxies to Tavus API)
POST /api/tavus/personas
Body: PersonaInput (system_prompt, pipeline_mode, layers, etc.)
Response: { persona_id, persona_name, created_at, status }

// Get persona status
GET /api/tavus/personas/:id/status
Response: { persona_id, status, last_status_at, error? }

// List pre-indexed documents
GET /api/tavus/documents
Response: [{ id, name, tags, created_at }]

// List available replicas
GET /api/tavus/replicas
Response: [{ id, name, thumbnail_url }]
```

### Security Considerations

- Store Tavus API key server-side only (env var)
- Validate all inputs server-side before calling Tavus
- Rate limit persona creation per user (e.g., 10/hour)
- Log errors centrally; return sanitized messages to client
- Use short-lived auth tokens for client requests

## Usage Example

```typescript
import { scenarioService } from "@/services/scenarioService";
import type { CreateScenarioInput, PersonaInput } from "@/types";

const persona: PersonaInput = {
	systemPrompt: "You are a supportive life coach...",
	pipelineMode: "full",
	context: "Sample coaching conversation examples...",
	layers: {
		llm: { model: "tavus-gpt-4o", speculative_inference: true },
		tts: { tts_engine: "cartesia", tts_model_name: "sonic" },
	},
};

const scenario: CreateScenarioInput = {
	title: "Career Transition Coaching",
	description: "Navigate career change with expert guidance",
	category: "Leadership",
	duration: 15,
	difficulty: "intermediate",
	tags: ["Career", "Transition", "Coaching"],
	persona,
};

const newScenario = await scenarioService.createScenario(scenario);
// newScenario.persona.status === undefined (local-only for now)
// In Phase 4, will call tavusService.createPersona and poll for "ready"
```

## Testing

### Local Testing (Phase 1)

```bash
npm start
```

- Navigate to Create Scenario screen
- Fill in title, description, category, duration, difficulty
- Add persona prompt and context
- Select pipeline mode
- Add tags
- Submit → scenario saved locally with persona defaults

### Backend Integration Testing (Phase 4)

Mock backend responses for testing:

```json
// POST /tavus/personas
{
  "persona_id": "p123",
  "persona_name": "Life Coach",
  "created_at": "2025-12-01T10:00:00Z",
  "status": "queued"
}

// GET /tavus/personas/p123/status
{
  "persona_id": "p123",
  "status": "ready",
  "last_status_at": "2025-12-01T10:02:00Z"
}
```

## Known Limitations

1. **No remote sync yet** - Personas stored locally; backend integration pending
2. **No async status updates** - Polling service not implemented
3. **Limited layer customization** - Advanced settings UI deferred to Phase 3
4. **No document attachment** - Pre-indexed selection UI pending Phase 2
5. **No tool/function builder** - LLM tools must be manually defined in JSON (Phase 3)

## Future Enhancements

- **Visual persona builder** - Drag-and-drop tool designer
- **Replica upload** - Allow users to upload custom avatars
- **Voice cloning** - Integrate Tavus voice cloning workflow
- **A/B testing** - Compare persona configurations for effectiveness
- **Analytics** - Track persona usage, completion rates, user satisfaction
- **Templates** - Pre-built persona configurations for common use cases
- **Sharing** - Export/import persona configs between users

## Resources

- [Tavus Persona API Docs](https://docs.tavus.io/api-reference/personas/create-persona)
- [Tavus Layers Configuration](https://docs.tavus.io/api-reference/personas/layers)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

---

**Last Updated:** December 1, 2025  
**Version:** Phase 1 Complete
