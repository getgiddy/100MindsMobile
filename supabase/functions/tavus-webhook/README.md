# Tavus Webhook Integration

This edge function handles webhook callbacks from Tavus when conversations end, automatically creating feedback sessions from the conversation data.

## How It Works

### 1. Conversation Creation Flow

When a user starts a conversation:

```typescript
// In your app
const conversation = await tavusService.createConversation({
	replicaId: "replica_xxx",
	personaId: "persona_xxx",
	scenarioId: "scenario_uuid",
	conversationName: "Leadership Practice",
});
```

This:

1. Creates a Tavus conversation with `callback_url` pointing to this webhook
2. Stores a record in the `conversations` table with status `active`
3. Returns the conversation URL for the user to join

### 2. Webhook Processing

When the conversation ends, Tavus sends a POST request to:

```
https://your-project.supabase.co/functions/v1/tavus-webhook
```

The webhook:

1. Validates the payload contains `conversation_id`
2. Finds the matching conversation record in the database
3. Updates the conversation status to `completed` or `failed`
4. Stores the full Tavus metadata (transcript, duration, etc.)
5. Automatically creates a feedback session if transcript is available

### 3. Automatic Feedback Generation

The webhook transforms Tavus data into feedback:

```typescript
{
  user_id: "user_uuid",
  scenario_id: "scenario_uuid",
  conversation_id: "conversation_uuid",
  score: 75, // Calculated from transcript analysis
  completed_at: "2025-12-06T10:30:00Z",
  duration: 420, // seconds
  transcript: [...], // Transformed from Tavus format
  analysis: {
    strengths: ["Completed the conversation", ...],
    areasForImprovement: ["Consider more detailed responses", ...],
    keyInsights: ["Conversation lasted 7 minutes", ...],
    communicationScore: 80,
    empathyScore: 70,
    problemSolvingScore: 75,
    overallScore: 75
  }
}
```

## Database Schema

### conversations table

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  conversation_id TEXT UNIQUE, -- Tavus conversation ID
  user_id UUID REFERENCES profiles(id),
  scenario_id UUID REFERENCES scenarios(id),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT, -- 'active', 'completed', 'ended', 'failed'
  tavus_metadata JSONB, -- Full webhook payload
  recording_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### feedback_sessions table (updated)

```sql
ALTER TABLE feedback_sessions
ADD COLUMN conversation_id UUID REFERENCES conversations(id);
```

## Webhook Payload

Tavus sends this payload when a conversation ends:

```json
{
	"conversation_id": "conv_xxx",
	"status": "ended",
	"end_reason": "participant_left",
	"started_at": "2025-12-06T10:23:00Z",
	"ended_at": "2025-12-06T10:30:00Z",
	"duration": 420,
	"transcript": [
		{
			"role": "agent",
			"content": "Hey there!",
			"timestamp": "2025-12-06T10:23:00Z"
		},
		{
			"role": "user",
			"content": "Hi, I need to discuss...",
			"timestamp": "2025-12-06T10:23:05Z"
		}
	],
	"participant_name": "John Doe",
	"recording_url": "https://tavus.io/recordings/xxx",
	"participant_left_at": "2025-12-06T10:30:00Z"
}
```

## Security

- Webhook uses Supabase service role key to bypass RLS
- Only processes conversations that exist in database
- Validates required fields before processing
- Conversation records can only be created by authenticated users

### Future Enhancement: Signature Verification

Consider adding webhook signature verification:

```typescript
const signature = req.headers.get("x-tavus-signature");
const isValid = verifyWebhookSignature(payload, signature);
if (!isValid) {
	return new Response("Invalid signature", { status: 401 });
}
```

## Deployment

Deploy the edge function:

```bash
supabase functions deploy tavus-webhook
```

Set environment variables in Supabase dashboard:

- `TAVUS_API_KEY` - Your Tavus API key (if needed for verification)

## Testing

Test the webhook locally:

```bash
# Start local Supabase
supabase start

# Deploy function locally
supabase functions serve tavus-webhook

# Send test webhook
curl -X POST http://localhost:54321/functions/v1/tavus-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test_conv_123",
    "status": "ended",
    "transcript": [
      {"role": "agent", "content": "Hello", "timestamp": "2025-12-06T10:00:00Z"},
      {"role": "user", "content": "Hi", "timestamp": "2025-12-06T10:00:05Z"}
    ],
    "duration": 300
  }'
```

## Error Handling

The webhook handles various error cases:

1. **Conversation not found**: Returns 404
2. **Missing required fields**: Returns 400
3. **Database errors**: Returns 500
4. **No transcript**: Updates conversation but doesn't create feedback

All errors are logged with context for debugging.

## Future Improvements

1. **AI-powered analysis**: Replace basic scoring with GPT-4 analysis
2. **Sentiment analysis**: Analyze tone and emotions in transcript
3. **Custom metrics**: Allow scenarios to define custom evaluation criteria
4. **Recording storage**: Store recordings in Supabase Storage
5. **Real-time updates**: Use Supabase Realtime to notify UI of feedback creation
6. **Retry mechanism**: Handle webhook delivery failures gracefully
