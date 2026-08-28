import { Context, LlmRequest, LlmResponse } from '@google/adk';
import type { Content, Part } from '@google/genai';
import { Storage } from '@google/cloud-storage';

// ---------------------------------------------------------------------------
// Helpers & Logging
// ---------------------------------------------------------------------------

const getGcsDataBucket = (): string => {
  const cloudProject = process.env.GOOGLE_CLOUD_PROJECT || '';
  return (
    process.env.GCS_DATA_BUCKET || `${cloudProject}-small-business-loan-data`
  );
};

async function loadDocumentFromArtifacts(
  context: Context,
): Promise<{ rawBytes: Buffer | null; mimeType: string }> {
  try {
    const { listArtifacts, loadArtifact } = context;

    const availableFiles = await listArtifacts();

    if (!availableFiles || availableFiles.length === 0) {
      return { rawBytes: null, mimeType: '' };
    }

    const artifactName = availableFiles[0];
    if (!artifactName) {
      return { rawBytes: null, mimeType: '' };
    }

    const artifactData = await loadArtifact(artifactName);
    if (!artifactData) {
      return { rawBytes: null, mimeType: '' };
    }

    // AgentSpace format (object with inlineData property)
    if (typeof artifactData === 'object' && 'inlineData' in artifactData) {
      const inlineData = (artifactData as Record<string, any>).inlineData;
      const mime = inlineData?.mimeType || 'application/pdf';
      const fileData = inlineData?.data || '';

      if (typeof fileData === 'string') {
        return { rawBytes: Buffer.from(fileData, 'base64'), mimeType: mime };
      }
      return { rawBytes: Buffer.from(fileData), mimeType: mime };
    }

    // ADK Web format (Part object with inlineData property)
    if (
      typeof artifactData === 'object' &&
      'inlineData' in artifactData &&
      (artifactData as Part).inlineData
    ) {
      const inlineData = (artifactData as Part).inlineData!;
      const mime = inlineData.mimeType || 'application/pdf';
      const data = inlineData.data;

      const bytes =
        typeof data === 'string'
          ? Buffer.from(data, 'base64')
          : Buffer.from(data);
      return { rawBytes: bytes, mimeType: mime };
    }

    console.warn(
      `[DocumentExtractor] Unexpected artifact format: ${typeof artifactData}`,
    );
  } catch (error) {
    console.error(
      `[DocumentExtractor] Error loading document from artifact service:`,
      error,
    );
  }

  return { rawBytes: null, mimeType: '' };
}

async function loadDocumentFromGcs(
  bucketName: string,
  blobName: string,
): Promise<Buffer> {
  const storage = new Storage();
  const file = storage.bucket(bucketName).file(blobName);
  const [contents] = await file.download();
  return contents;
}

function getInlineDoc(state: Record<string, any>): Part | null {
  const inlineDoc = state.inline_document;
  if (inlineDoc && typeof inlineDoc === 'object') {
    const dataB64 = inlineDoc.data || '';
    const mimeType = inlineDoc.mime_type || 'application/pdf';
    if (dataB64) {
      try {
        const rawBytes = Buffer.from(dataB64, 'base64');
        console.log(
          `[DocumentExtractor] Loaded document from session state: mime_type=${mimeType}, size=${rawBytes.length} bytes`,
        );
        return {
          inlineData: {
            mimeType,
            data: rawBytes.toString('base64'),
          },
        };
      } catch (error) {
        console.error(
          `[DocumentExtractor] Failed to decode inline_document base64:`,
          error,
        );
      }
    }
  }
  return null;
}

async function getArtifactDoc(context: Context): Promise<Part | null> {
  const { rawBytes, mimeType } = await loadDocumentFromArtifacts(context);
  if (rawBytes) {
    console.log(
      `[DocumentExtractor] Loaded document from artifact service: mime_type=${mimeType}, size=${rawBytes.length} bytes`,
    );
    return {
      inlineData: {
        mimeType,
        data: rawBytes.toString('base64'),
      },
    };
  }
  return null;
}

async function getGcsDoc(userMessage: string): Promise<Part | null> {
  const gcsBucket = getGcsDataBucket();
  if (gcsBucket) {
    const triggerKeywords = [
      'gcs',
      'sample_application_complete.pdf',
      'sample_application_incomplete.pdf',
    ];
    const lowerMessage = userMessage.toLowerCase();

    if (triggerKeywords.some((kw) => lowerMessage.includes(kw))) {
      console.log(
        '[DocumentExtractor] Triggered GCS file fetch based on user request keywords.',
      );
      let fileToFetch = 'sample_application_complete.pdf';
      if (lowerMessage.includes('sample_application_incomplete.pdf')) {
        fileToFetch = 'sample_application_incomplete.pdf';
      }

      try {
        const rawBytes = await loadDocumentFromGcs(gcsBucket, fileToFetch);
        const mimeType = 'application/pdf';
        console.log(
          `[DocumentExtractor] Loaded document from GCS: ${fileToFetch}, size=${rawBytes.length} bytes`,
        );
        return {
          inlineData: {
            mimeType,
            data: rawBytes.toString('base64'),
          },
        };
      } catch (error) {
        console.error(
          `[DocumentExtractor] Failed to load document from GCS:`,
          error,
        );
      }
    }
  } else {
    console.warn(
      '[DocumentExtractor] No document found and GCS_DATA_BUCKET not configured for fallback.',
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// ADK-JS Before Model Callback
// ---------------------------------------------------------------------------

export const injectDocumentIntoRequest = async ({
  callbackContext,
  llmRequest,
}: {
  callbackContext: Context;
  llmRequest: LlmRequest;
}): Promise<LlmResponse | void> => {
  // 1. Check Session State
  let docPart = getInlineDoc(callbackContext.state || {});

  // 2. Fallback to Artifact Service
  if (!docPart) {
    docPart = await getArtifactDoc(callbackContext);
  }

  // 3. Fallback to GCS based on request contents
  if (!docPart) {
    let userMessage = '';
    if (llmRequest.contents) {
      for (const content of llmRequest.contents) {
        if (content.role === 'user' && content.parts) {
          for (const part of content.parts) {
            if ('text' in part && part.text) {
              userMessage += part.text + ' ';
            }
          }
        }
      }
    }
    docPart = await getGcsDoc(userMessage);
  }

  if (!docPart) {
    console.warn(
      '[DocumentExtractor] No document found in session state, artifact service, or GCS',
    );
    return undefined;
  }

  // 4. Inject Document into outgoing LLM Request
  if (!llmRequest.contents) {
    llmRequest.contents = [];
  }

  const injectedContent: Content = {
    role: 'user',
    parts: [
      { text: 'Here is the loan application document to extract data from:' },
      docPart,
    ],
  };

  llmRequest.contents.push(injectedContent);
  console.log('[DocumentExtractor] Injected document into LLM request');

  return undefined;
};
