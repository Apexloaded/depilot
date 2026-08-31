# DePilot
> **Track:** The Taskmaster
> **Hashtag:** #AllThingsAgenticHackathon

## 🌟 Overview & Problem Statement
- **The Problem:** Nigerian real-estate teams still validate land parcels, survey plans, payment evidence, deal records, and stage transitions through scattered chats, spreadsheets, manual ledger checks, and human-dependent follow-up. This makes fraud detection, cadastral due diligence, and payment reconciliation slow and error-prone.
- **The Agentic Solution:** DePilot is an autonomous real-estate operations agent that accepts natural language and multimodal evidence, classifies the request, opens or resumes a persistent workflow, routes work to specialist sub-agents, executes verification tools, applies deterministic safety gates, stores memory/state in Firestore, and returns an operational verdict with the next required action.

## 🧠 Why It's "Agentic" (Not Just a Chatbot)
- **Goal-Driven Autonomy:** A master ADK `LlmAgent` converts a high-level property or deal request into a workflow, classifies it as deal, due-diligence, or hybrid verification, and delegates execution to the correct specialist sub-agent instead of only answering with a prompt response.
- **Tools & Dynamic Execution:** The orchestrator and sub-agents use ADK function tools for workflow lookup, deal search/history, deal verification, payment extraction, payment schedule generation, payment ledger application, Minna-to-WGS84 conversion, survey geometry audit, cadastral zoning checks, missing beacon reconstruction, and topography/flood-risk analysis.
- **State & Memory Management:** Firestore stores workflow state, session events, memory entries, deal records, payment schedules, payment records, and audit history. ADK callbacks prime request context, extract deal numbers, create or resume workflows, block unsafe tool execution, compact long context, and mark workflows complete only after terminal verdicts.

## 🏗️ Architecture & Google Cloud Integration

```mermaid
flowchart TD
  User[Judge / Operator] -->|POST /chat or /stream| Express[Express service on Cloud Run]
  Express --> Chat[ChatService]
  Chat --> Runner[Google ADK Runner]
  Runner --> Orchestrator[Master Orchestrator<br/>Gemini 3.5 Flash]
  Orchestrator --> Guard[Workflow callbacks<br/>classification, state, safety gates]
  Guard --> Firestore[(Cloud Firestore<br/>sessions, memory, workflows, deals)]
  Orchestrator --> LandGuard[LandGuard sub-agent<br/>Gemini 3.1 Pro Preview]
  Orchestrator --> DealPilot[DealPilot sub-agent<br/>Gemini 3.1 Pro Preview]
  DealPilot --> Vision[Vision extraction<br/>GenAI SDK + Gemini]
  LandGuard --> CadastralTools[Geodesy, zoning, geometry, flood tools]
  DealPilot --> DealTools[Deal, schedule, payment, verification tools]
  PubSub[Pub/Sub push endpoint scaffold] --> Express
```

| Component | Technology / Service Used | Specific Role in System |
| :--- | :--- | :--- |
| **LLM Reasoning** | Gemini Models through Google ADK and GenAI SDK | Autonomous planning, workflow classification, multimodal extraction, decision-making, and final verification |
| **Agent Framework** | Google ADK for TypeScript (`@google/adk`) | Runner, `LlmAgent`, sub-agent orchestration, function tools, callbacks, memory loading, and context compaction |
| **Hosting & Compute** | Google Cloud Run via the included `Dockerfile` | Serverless Express API for `/chat`, `/stream`, and Pub/Sub push handling |
| **State & Storage** | Cloud Firestore through Firebase Admin SDK | Persistent agent sessions, memory, workflow state, deal records, payment schedules, payment records, and audit trails |
| **Background Events** | Google Cloud Pub/Sub package and push endpoint scaffold | Event-driven workflow entrypoint is present; the subscription handler still needs final wiring before claiming full background autonomy |

## 🚀 Quickstart & Judge Reproduction Guide

Run locally or deploy to Cloud Run in under 3 minutes after credentials are available.

### 1. Prerequisites

- Node.js `>=18` (`22` is used in the Dockerfile)
- `pnpm@8.15.5`
- Google Cloud project with Gemini API access and Firestore enabled
- `gcloud` CLI authenticated for Cloud Run deployment
- Firebase service account credentials with Firestore access

### 2. Environment Configuration

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required schema:

```dotenv
GOOGLE_API_KEY=your-gemini-api-key
FIREBASE_PROJECT_ID=your-gcp-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-gcp-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PORT=8080
LOG_LEVEL=info
```

Notes for judges:

- `GOOGLE_API_KEY` is used by the GenAI SDK vision/classification path.
- Firestore variables are required at module import time by `packages/firebase/src/config/firebase.config.ts`.
- On Cloud Run, store secrets in Secret Manager or deploy them as environment variables.

### 3. One-Command Setup & Launch Commands

```bash
corepack enable
corepack prepare pnpm@8.15.5 --activate
pnpm install --frozen-lockfile
pnpm --filter @repo/firebase build
pnpm --filter depilot build
pnpm --filter depilot start
```

The service starts on:

```text
http://localhost:8080
```

Cloud Run deployment:

```bash
gcloud services enable run.googleapis.com firestore.googleapis.com pubsub.googleapis.com
gcloud run deploy depilot \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8080,LOG_LEVEL=info
```

For production deployment, provide `GOOGLE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` through Secret Manager instead of plain CLI flags.

### 4. Pre-configured Synthetic Test Payload / API Curl Commands

Deal verification request:

```bash
curl -sS http://localhost:8080/chat \
  -F "userId=judge-demo" \
  -F "message=Verify deal DEAL-2026-00042 and check whether the latest payment receipt should be applied. Do not mutate anything without approval."
```

Land due-diligence request:

```bash
curl -sS http://localhost:8080/chat \
  -F "userId=judge-demo" \
  -F "message=Audit a Lagos Ibeju-Lekki survey with Minna UTM Zone 31N beacons A 582104.32 714902.18, B 582204.32 714902.18, C 582204.32 714802.18, D 582104.32 714802.18. Check geometry, cadastral risk, and flood exposure."
```

Multimodal receipt or survey upload:

```bash
curl -sS http://localhost:8080/chat \
  -F "userId=judge-demo" \
  -F "message=Extract and verify this payment evidence for DEAL-2026-00042." \
  -F "files=@./sample-receipt.png;type=image/png"
```

Streaming response:

```bash
curl -N http://localhost:8080/stream \
  -F "userId=judge-demo" \
  -F "message=Run a hybrid verification for DEAL-2026-00042 and flag any cadastral/payment contradictions."
```

## 🎥 Demo & Deliverables
- **Live Hosted Endpoint:** Replace before Devpost submission with the Cloud Run URL, for example `https://depilot-xxxxx-uc.a.run.app`
- **Video Walkthrough:** Replace before Devpost submission with the YouTube/Vimeo demo link

## 🛠️ Built With
- `Google Cloud Platform` (Cloud Run-ready Dockerfile, Firestore, Pub/Sub package/scaffold)
- `Gemini` (Google ADK Gemini model integration and GenAI SDK multimodal extraction)
- `Google ADK` / Agent Framework
- `Express`
- `TypeScript`
- `Firebase Admin SDK`
- `Turborepo`
