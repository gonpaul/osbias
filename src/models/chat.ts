import db from '@/lib/db';
import { AuthError } from '@/lib/authz';

export type ChatSession = {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export async function getChatSessions(userId: number): Promise<Array<Pick<ChatSession,'id'|'name'>>> {
  return db('chat_sessions')
    .select('id', 'name')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');
}

export async function createChatSession(userId: number, name: string): Promise<ChatSession> {
  const [row] = await db('chat_sessions')
    .insert({ user_id: userId, name })
    .returning('*');
  return row as ChatSession;
}

export async function getMessages(sessionId: number, userId: number): Promise<ChatMessage[]> {
  // Ensure session ownership
  const session = await db('chat_sessions').first('id').where({ id: sessionId, user_id: userId });
  if (!session) throw new AuthError(404, 'Not found');
  return db('chat_messages')
    .select('*')
    .where({ session_id: sessionId })
    .orderBy('created_at', 'asc');
}

export async function addMessage(sessionId: number, userId: number, role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
  const session = await db('chat_sessions').first('id').where({ id: sessionId, user_id: userId });
  if (!session) throw new AuthError(404, 'Not found');
  const [row] = await db('chat_messages')
    .insert({ session_id: sessionId, role, content })
    .returning('*');
  return row as ChatMessage;
}


