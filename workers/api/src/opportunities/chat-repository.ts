import { getNowIso } from "../lib/dates";

export interface ChatConversation {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export class ChatRepository {
  static async getConversation(db: D1Database, userId: string, opportunityId: string): Promise<ChatConversation | null> {
    return await db
      .prepare(`SELECT * FROM opportunity_conversations WHERE user_id = ? AND opportunity_id = ? LIMIT 1`)
      .bind(userId, opportunityId)
      .first<ChatConversation>();
  }

  static async createConversation(db: D1Database, userId: string, opportunityId: string): Promise<ChatConversation> {
    const id = crypto.randomUUID();
    const now = getNowIso();
    
    await db
      .prepare(`INSERT INTO opportunity_conversations (id, user_id, opportunity_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, userId, opportunityId, now, now)
      .run();
      
    return {
      id,
      user_id: userId,
      opportunity_id: opportunityId,
      created_at: now,
      updated_at: now
    };
  }

  static async getMessages(db: D1Database, conversationId: string): Promise<ChatMessage[]> {
    const res = await db
      .prepare(`SELECT * FROM opportunity_messages WHERE conversation_id = ? ORDER BY created_at ASC`)
      .bind(conversationId)
      .all<ChatMessage>();
    return res.results || [];
  }

  static async addMessage(db: D1Database, conversationId: string, role: string, content: string): Promise<ChatMessage> {
    const id = crypto.randomUUID();
    const now = getNowIso();

    await db.batch([
      db.prepare(`INSERT INTO opportunity_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`).bind(id, conversationId, role, content, now),
      db.prepare(`UPDATE opportunity_conversations SET updated_at = ? WHERE id = ?`).bind(now, conversationId)
    ]);

    return {
      id,
      conversation_id: conversationId,
      role,
      content,
      created_at: now
    };
  }
}
