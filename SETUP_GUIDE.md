# YieldIQ Local Setup Guide

Welcome to YieldIQ! This guide will help you get the project running locally on your machine with all features (Auth, Firestore, and AI) fully functional.

## 1. Prerequisites
- **Node.js**: v18 or higher.
- **Firebase Account**: Access to [Firebase Console](https://console.firebase.google.com/).
- **Google AI API Key**: Get one from [Google AI Studio](https://aistudio.google.com/).

## 2. Firebase Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (or use the one provided in `src/firebase/config.ts`).
3. **Enable Authentication**:
   - Go to Auth -> Sign-in method.
   - Enable **Email/Password**.
   - Enable **Google** (Sign-in with Gmail).
4. **Enable Firestore**:
   - Create a database in **Production Mode** (rules will be applied from your `firestore.rules` file).
5. **Authorized Domains**:
   - In Auth -> Settings -> Authorized domains, ensure `localhost` is listed.

## 3. Environment Variables
Rename `.env` to `.env.local` or update `.env` with:
- `GOOGLE_GENAI_API_KEY`: Your Gemini API key.
- The Firebase config in `src/firebase/config.ts` is already populated for the Studio project, but you can update it if you create your own.

## 4. Run the Project
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:9002`.

---

## 🤖 Prompt for Antigravity AI (Copy-Paste this!)

> "I have just downloaded the YieldIQ project. Please help me set it up:
> 1. Check if dependencies are installed, if not, run `npm install`.
> 2. Look at `.env` and tell me which keys I need to fill in.
> 3. Verify that the Firebase config in `src/firebase/config.ts` is correctly imported in `src/firebase/index.ts`.
> 4. Ensure the Google Sign-In button in `src/app/login/page.tsx` is configured to use the local auth instance.
> 5. Once keys are provided, run the development server for me."

---

## 5. Troubleshooting Google Sign-In
If Google Sign-In fails locally:
1. Ensure the `apiKey` and `authDomain` in `src/firebase/config.ts` match your Firebase Project.
2. Check that you've enabled the Google provider in the Firebase Console.
3. Make sure you are running on `localhost` (port 9002 by default in this project).
