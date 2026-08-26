import {
  BaseSessionService,
  type AppendEventRequest,
  type CreateSessionRequest,
  type DeleteSessionRequest,
  type GetSessionRequest,
  type ListSessionsRequest,
  type ListSessionsResponse,
  type Session,
} from '@google/adk';
import { FieldValue, firestore } from '@repo/firebase';
import { sanitizeForFirestore } from './firestore.sanitizer.js';

type StoredSession = Session & {
  updatedAt: number;
};

type FirestoreDocument = {
  data(): unknown;
};

class SessionService extends BaseSessionService {
  private collection = firestore.collection('agent_sessions');

  async getOrCreateSession(request: CreateSessionRequest): Promise<Session> {
    const existing = await this.getSession({
      appName: request.appName,
      userId: request.userId,
      sessionId: request.sessionId ?? '',
    });

    if (existing) {
      return existing;
    }

    return this.createSession(request);
  }

  async createSession(request: CreateSessionRequest): Promise<Session> {
    const session: Session = {
      id: request.sessionId ?? crypto.randomUUID(),
      appName: request.appName,
      userId: request.userId,
      state: request.state ?? {},
      events: [],
      lastUpdateTime: Date.now(),
    };

    await this.collection
      .doc(this.documentId(session.appName, session.userId, session.id))
      .set({
        ...session,
        updatedAt: session.lastUpdateTime,
      });

    return session;
  }

  async getSession(request: GetSessionRequest): Promise<Session | undefined> {
    const snapshot = await this.collection
      .doc(this.documentId(request.appName, request.userId, request.sessionId))
      .get();

    if (!snapshot.exists) {
      return undefined;
    }

    const storedSession = snapshot.data() as StoredSession;
    let events = storedSession.events ?? [];

    if (request.config?.afterTimestamp !== undefined) {
      events = events.filter(
        (event) => event.timestamp > request.config!.afterTimestamp!,
      );
    }

    if (request.config?.numRecentEvents) {
      events = events.slice(-request.config.numRecentEvents);
    }

    return {
      id: storedSession.id,
      appName: storedSession.appName,
      userId: storedSession.userId,
      state: storedSession.state ?? {},
      events,
      lastUpdateTime: storedSession.lastUpdateTime,
    };
  }

  async listSessions(
    request: ListSessionsRequest,
  ): Promise<ListSessionsResponse> {
    const snapshot = await this.collection
      .where('appName', '==', request.appName)
      .where('userId', '==', request.userId)
      .get();

    const allSessions = snapshot.docs
      .map((doc: FirestoreDocument) => doc.data() as StoredSession)
      .sort((left: StoredSession, right: StoredSession) => {
        const difference = left.lastUpdateTime - right.lastUpdateTime;
        return request.order === 'asc' ? difference : -difference;
      });

    const requestedLimit = request.limit ?? allSessions.length;
    const limit = requestedLimit || 1;
    const page = request.page ?? Math.floor((request.offset ?? 0) / limit) + 1;
    const offset = request.page ? (page - 1) * limit : (request.offset ?? 0);
    const pageSessions: StoredSession[] = allSessions.slice(
      offset,
      offset + limit,
    );
    const totalItems = allSessions.length;

    return {
      sessions: pageSessions.map((session: StoredSession) => ({
        id: session.id,
        appName: session.appName,
        userId: session.userId,
        state: {},
        events: [],
        lastUpdateTime: session.lastUpdateTime,
      })),
      page,
      limit: requestedLimit || totalItems,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
    };
  }

  async deleteSession(request: DeleteSessionRequest): Promise<void> {
    await this.collection
      .doc(this.documentId(request.appName, request.userId, request.sessionId))
      .delete();
  }

  async appendEvent({ session, event }: AppendEventRequest) {
    const appendedEvent = await super.appendEvent({ session, event });
    session.lastUpdateTime = Date.now();

    const docRef = this.collection.doc(
      this.documentId(session.appName, session.userId, session.id),
    );

    const safeEvent = sanitizeForFirestore(appendedEvent);

    await docRef.set(
      {
        events: FieldValue.arrayUnion(safeEvent),
        state: sanitizeForFirestore(session.state ?? {}),
        lastUpdateTime: session.lastUpdateTime,
        updatedAt: session.lastUpdateTime,
      },
      { merge: true },
    );

    return appendedEvent;
  }

  private documentId(appName: string, userId: string, sessionId: string) {
    return [appName, userId, sessionId].map(encodeURIComponent).join('__');
  }
}

export const sessionService = new SessionService();
