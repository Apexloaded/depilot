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
  User[User / Operator] -->|POST /chat or /stream| Express[Express service on Cloud Run]
  Express --> Chat[ChatService]
  Chat --> Runner[Google ADK Runner]
  Runner --> Orchestrator[Master Orchestrator<br/>Gemini 3.7]
  Orchestrator --> Guard[Workflow callbacks<br/>classification, state, safety gates]
  Guard --> Firestore[(Cloud Firestore<br/>sessions, memory, workflows, deals)]
  Orchestrator --> LandGuard[LandGuard sub-agent<br/>Gemini 3.7]
  Orchestrator --> DealPilot[DealPilot sub-agent<br/>Gemini 3.7]
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
- `pnpm@9.15.0`
- Google Cloud project with Gemini API access and Firestore enabled
- `gcloud` CLI authenticated for Cloud Run deployment
- `firebase` CLI authenticated for firebase deploy indexes
- Firebase service account credentials with Firestore access

### 2. Environment Configuration

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

```dotenv
PORT=8080
FIREBASE_PROJECT_ID=firebase_project_id
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-gcp-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_GENAI_USE_VERTEXAI=1
GOOGLE_CLOUD_PROJECT="google_cloud_project_id"
GOOGLE_CLOUD_LOCATION="global"
GOOGLE_GENAI_USE_ENTERPRISE=True
```

### 3. One-Command Setup & Launch Commands

Install the packages
```bash
pnpm install
```

Seed the database and deploy indexes

Ensure you have firebase cli installed on your local machine to enable you deploy indexes

```bash
pnpm seed:db
pnpm deploy:indexes
```

Your can launch using either ADK web UI or direct API call

ADK Web UI launch
```bash
pnpm agent:dev
```
```text
http://localhost:8000/
```

Launch for direct API call
```bash
pnpm dev
```
```text
http://localhost:8080/
```

### 4. Pre-configured Synthetic Test Payload / API Curl Commands

Land due-diligence request:

```bash
curl -sS http://localhost:8080/chat \
  -F "userId=judge-demo" \
  -F "message=Audit a Lagos Ibeju-Lekki survey with Minna UTM Zone 31N beacons A 582104.32 714902.18, B 582204.32 714902.18, C 582204.32 714802.18, D 582104.32 714802.18. Check geometry, cadastral risk, and flood exposure."
```

Multimodal to extract, verify and apply a full payment to a deal if no descripancies are found after check.

```bash
curl -sS http://localhost:8080/stream \
  -F "userId=user-id" \
  -F "message=Extract, verify and apply this payment evidence for DEAL-2026-00001." \
  -F "files=@./test/receipt-50m.jpeg;type=image/jpeg"
```

Multimodal to extract, verify and apply an installment payment to a deal if no descripancies are found after check.

```bash
curl -sS http://localhost:8080/stream \
  -F "userId=user-id" \
  -F "message=I have uploaded this payment proof from Chidi Eze, verify this payment and apply it to the deal with deal number DEAL-2026-00002" \
  -F "files=@./test/chidi-eze-10m.jpeg;type=image/jpeg"
```

You can use the same test data when testing using ADK web UI

## 🛠️ Built With
- `Google Cloud Platform` (Cloud Run-ready Dockerfile, Firestore, Pub/Sub package/scaffold)
- `Gemini` (Google ADK Gemini model integration and GenAI SDK multimodal extraction)
- `Google ADK` / Agent Framework
- `Express`
- `TypeScript`
- `Firebase Admin SDK`
