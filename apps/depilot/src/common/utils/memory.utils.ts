import {
  BasePlugin,
  type BaseMemoryService,
  type MemoryEntry,
  type SearchMemoryRequest,
  type SearchMemoryResponse,
  type Session,
} from '@google/adk';
import { firestore } from '@repo/firebase';

const memoryScopes = firestore.collection('agent_memory');
const maxQueryTerms = 10;
const maxResults = 20;

type StoredMemoryEntry = {
  content: MemoryEntry['content'];
  author?: string;
  timestamp?: string;
  tokens: string[];
  sourceSessionId: string;
  sourceEventId: string;
};

type FirestoreDocument = {
  data(): unknown;
};

type ScoredEntry = {
  entry: StoredMemoryEntry;
  score: number;
};

function scopeId(appName: string, userId: string) {
  return [appName, userId].map(encodeURIComponent).join('__');
}

function entryId(sessionId: string, eventId: string) {
  return [sessionId, eventId].map(encodeURIComponent).join('__');
}

function contentText(content: MemoryEntry['content']) {
  return (content.parts ?? [])
    .flatMap((part) => ('text' in part && part.text ? [part.text] : []))
    .join(' ');
}

function searchTokens(text: string) {
  return [...new Set(text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])];
}

function memoryEntries(session: Session) {
  return session.events.flatMap((event, index) => {
    if (!event.content) {
      return [];
    }

    const text = contentText(event.content);
    const tokens = searchTokens(text);
    if (tokens.length === 0) return [];

    const sourceEventId = event.id || `${session.id}-${index}`;
    const entry: StoredMemoryEntry = {
      content: event.content,
      ...(event.author ? { author: event.author } : {}),
      ...(Number.isFinite(event.timestamp)
        ? { timestamp: new Date(event.timestamp).toISOString() }
        : {}),
      tokens,
      sourceSessionId: session.id,
      sourceEventId,
    };

    return [{ id: entryId(session.id, sourceEventId), entry }];
  });
}

export class MemoryService implements BaseMemoryService {
  async addSessionToMemory(session: Session): Promise<void> {
    const entries = memoryEntries(session);
    const scope = memoryScopes.doc(scopeId(session.appName, session.userId));

    await scope.set(
      {
        appName: session.appName,
        userId: session.userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    const collection = scope.collection('entries');

    for (let start = 0; start < entries.length; start += 400) {
      const batch = firestore.batch();
      for (const { id, entry } of entries.slice(start, start + 400)) {
        batch.set(collection.doc(id), entry, { merge: true });
      }
      await batch.commit();
    }
  }

  async searchMemory({
    appName,
    userId,
    query,
  }: SearchMemoryRequest): Promise<SearchMemoryResponse> {
    const tokens = searchTokens(query).slice(0, maxQueryTerms);
    if (tokens.length === 0) {
      return { memories: [] };
    }

    const snapshot = await memoryScopes
      .doc(scopeId(appName, userId))
      .collection('entries')
      .where('tokens', 'array-contains-any', tokens)
      .limit(200)
      .get();

    const documents = snapshot.docs as FirestoreDocument[];
    const scored: ScoredEntry[] = documents.map((document) => {
      const entry = document.data() as Partial<StoredMemoryEntry>;
      const entryTokens = Array.isArray(entry.tokens) ? entry.tokens : [];
      const score = entryTokens.filter((token) =>
        tokens.includes(token),
      ).length;
      return { entry: entry as StoredMemoryEntry, score };
    });
    const memories: MemoryEntry[] = scored
      .filter(({ score }) => score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          (right.entry.timestamp ?? '').localeCompare(
            left.entry.timestamp ?? '',
          ),
      )
      .slice(0, maxResults)
      .map(({ entry }) => ({
        content: entry.content,
        ...(entry.author ? { author: entry.author } : {}),
        ...(entry.timestamp ? { timestamp: entry.timestamp } : {}),
      }));

    return { memories };
  }
}

export const memoryService = new MemoryService();
