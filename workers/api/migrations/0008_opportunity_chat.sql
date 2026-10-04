CREATE TABLE opportunity_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_opp_conversations_user_opp ON opportunity_conversations(user_id, opportunity_id);

CREATE TABLE opportunity_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES opportunity_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_opp_messages_conversation ON opportunity_messages(conversation_id);
