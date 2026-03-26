# YieldIQ Project Architecture & System Overview

## 1. Project Identity
**YieldIQ** is an AI-powered agricultural intelligence platform designed to help farmers optimize their harvests through data-driven insights, multi-lingual AI assistance, and real-time cloud monitoring.

## 2. Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS with ShadCN UI components.
- **Icons:** Lucide React.
- **Charts:** Recharts (integrated via ShadCN Chart components).
- **Backend-as-a-Service:** Firebase (Firestore for NoSQL database, Firebase Authentication for identity).
- **Generative AI:** Google Genkit 1.x using the `@genkit-ai/google-genai` plugin (Gemini 2.5 Flash model).
- **Environment:** Firebase App Hosting (Production) and Google Cloud Workstations (Development).

## 3. Core Systems

### A. Authentication & Identity Management
- **Providers:** Email/Password and Google Sign-In (OAuth).
- **Signup Workflow:**
    1. User submits name, email, and password.
    2. Firebase Auth creates the credential.
    3. A `UserProfile` document is immediately created in Firestore at `/users/{userId}` to store non-sensitive "Login Details" (FirstName, LastName, Email).
    4. An automated verification email is triggered via `sendEmailVerification`.
- **Email Verification Gate:** 
    - The `DashboardLayout` acts as a security middleware. It checks `user.emailVerified`.
    - If unverified, the user is redirected to `/verify-email`.
    - If unauthenticated, the user is redirected to `/login`.
- **Security Rules:** `firestore.rules` enforces that users can only read/write data where the path `{userId}` matches their `request.auth.uid`. Verification status is checked for all sub-collections.

### B. Database Architecture (Firestore)
The database follows an "Authorization Independence" pattern using a hierarchical structure:
- `/users/{userId}`: Root profile.
- `/users/{userId}/farms/primary`: Stores the active farm's metadata (location, soil type, current crop, growth stage).
- `/users/{userId}/advisory_reports/{reportId}`: Stores history of AI-generated agricultural advice.
- `/users/{userId}/notifications/{id}`: (Planned) Alerts for weather or pests.
- `/crop_types/` and `/seasons/`: Global read-only reference data.

### C. Generative AI System (Genkit)
AI logic is encapsulated in "Flows" executed as Server Actions:
- **Personalized Farming Advisory (`personalized-farming-advisory-flow.ts`):** 
    - **Input:** Context from the user's `Farm` profile (Crop, Soil, Location).
    - **Prompt:** Expert botanist persona. Uses Handlebars to inject farm data.
    - **Output:** Structured JSON containing water needs, fertilizer tips, and action items.
- **Local Language Assistant (`local-language-assistant.ts`):**
    - **Input:** User query in Hindi, Marathi, or English.
    - **Prompt:** Multi-lingual assistant capable of code-switching to provide actionable farming advice.
    - **Output:** Natural language response in the user's detected tongue.

## 4. User Workflow & Pages

### I. Landing Page (`/`)
- Public-facing marketing site.
- Links to Features, Impact, and Auth flows.

### II. Dashboard Overview (`/dashboard`)
- **Components:** `YieldOverviewChart` (Recharts), Quick Stats cards.
- **Logic:** Aggregates data from the `Farm` document to show predicted yields and risk levels. If no farm profile exists, it displays a "Setup Required" alert.

### III. Farm Profile (`/dashboard/farm-profile`)
- **System:** The "Source of Truth" for AI.
- **Fields:** Farm Name, Location (MapPin integration), Size, Soil Type, Crop Type, Planting Date, Growth Stage.
- **Backend:** Uses `setDoc` with `merge: true` to persist data to Firestore.

### IV. AI Advisory (`/dashboard/advisory`)
- **Workflow:** 
    1. Fetches current `Farm` profile.
    2. Passes profile context to the AI Flow.
    3. Displays a multi-category report (Water, Fertilizer, Pests).
    4. Automatically saves the output to the database for history.

### V. AI Assistant (`/dashboard/assistant`)
- **UI:** Chat interface with `ScrollArea`.
- **Features:** Suggested questions (Hindi/Marathi/English) and real-time streaming-like feedback.

### VI. Database Explorer (`/dashboard/explorer`)
- **System:** Administrative Transparency Tool.
- **Function:** Allows the user (and project owner) to see exactly what is stored in Firestore in a table format.
- **Visibility:** Specifically shows "Login Details" and "Farm Assets" while ensuring passwords are never stored/visible.

### VII. GIS Visualization (`/dashboard/map`)
- **Component:** Mock-up of satellite imagery analysis.
- **Data:** Visualizes NDVI (Health Index) and Moisture levels using placeholder aerial imagery.

## 5. Error Handling Architecture
- **Contextual Errors:** The app uses a custom `FirestorePermissionError` system.
- **Event Emitter:** A global `errorEmitter` catches permission denials and emits them to a `FirebaseErrorListener`.
- **Visual Feedback:** Errors are surfaced to the developer/user via specialized Next.js error boundaries that display the exact security rule that failed.
