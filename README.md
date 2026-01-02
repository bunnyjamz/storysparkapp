# StorySpark

StorySpark is a mobile-first web app designed as a storytelling coach and story-crafting tool. It helps beginner storytellers capture real-life moments and transform them into compelling narratives.

## Tech Stack

- **Frontend:** React (TypeScript) + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/Auth:** Supabase (PostgreSQL)
- **AI:** Vercel AI Gateway (OpenAI GPT-3.5-turbo) for story analysis
- **Deployment:** Vercel

## Local Setup

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd storyspark
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in your credentials.

   ```bash
   cp .env.example .env.local
   ```

   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `VERCEL_AI_GATEWAY_TOKEN`: Server-side token used by the Vercel Function at `/api/analyze-story`.

   Note: `VERCEL_AI_GATEWAY_TOKEN` is **not** a `VITE_` variable and should never be exposed to the browser.

4. **Run the development server:**

   UI only (Vite):

   ```bash
   npm run dev
   ```

   Full app including the `/api/analyze-story` function (recommended):

   ```bash
   npx vercel dev
   ```

   Open the URL shown in your terminal.

## Supabase Setup

1. **Create a new Supabase project.**
2. **Run Migrations:**
   Use the SQL editor in Supabase dashboard to run the contents of:
   - `supabase/migrations/20231027000000_initial_schema.sql` (original schema)
   - `supabase/migrations/20240101000000_ai_story_organization.sql` (AI features)
3. **Seed Data (Optional):**
   You can run the contents of `supabase/seed.sql` to see how data is structured.

## Database Schema

- **users**: Extended profile data for Supabase Auth users.
- **stories**: Core story data (title, date, setting, tags, freeform text).
- **story_details**: AI-generated story structure (hook, characters, beginning, middle, end, outcome, etc.).
- **coach_notes**: AI coaching feedback (what to cut, vocabulary upgrades, pacing notes, etc.).
- **story_versions**: Version history for future AI improvements.
- **learning_progress**: Tracks explored storytelling structures.

## Vercel AI Gateway Setup

StorySpark routes AI requests through a Vercel Function at `/api/analyze-story`, which then calls the Vercel AI Gateway. This keeps API keys off the client.

### 1) Configure OpenAI in Vercel

1. In Vercel, open your project.
2. Go to **Project Settings → AI Gateway**.
3. Add **OpenAI** as a provider and paste your OpenAI API key.
4. (Optional) Add your OpenAI Organization ID if your account requires it.

### 2) Add the Gateway token env var

In Vercel: **Project Settings → Environment Variables**

- `VERCEL_AI_GATEWAY_TOKEN` (Vercel generates this)

Do **not** use `VITE_OPENAI_API_KEY` anymore.

### Cost / Rate Limits

The app still tracks token usage (when available) and handles common error statuses like 429 (rate limit) and 5xx (provider errors). Vercel AI Gateway provides request monitoring and rate limiting controls in the dashboard.

## Features (Phase 1)

- **Auth:** Email/Password signup and login.
- **Story Capture:** Low-friction form with guided placeholders and helper prompts.
- **Dashboard:** View all captured stories with sorting options.
- **Detail View:** Read individual story details.
- **Responsive:** Optimized for mobile and desktop.

## Features (Phase 2)

- **AI Story Organization:** Automatic analysis of stories to extract key elements:
  - Hook (why the story is worth telling)
  - Characters involved
  - Beginning, Middle, End structure
  - Outcome and lesson learned
  - Turning point
- **Inline Editing:** Edit any AI-generated field
- **Re-analyze:** Run AI analysis again after making changes
- **Loading States:** Visual feedback during AI processing
- **Error Handling:** Graceful handling of API errors with retry options

## Future Phases

- **Phase 3:** AI structure rewrites and cleaned versions.
- **Phase 4:** Full coach mode with detailed feedback.
- **Phase 5:** Sharing and community features.

## Troubleshooting

- **Supabase Credentials:** Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set in `.env.local`.
- **AI Gateway Token:** Ensure `VERCEL_AI_GATEWAY_TOKEN` is set in your Vercel project for AI features to work.
- **TypeScript Errors:** Run `npm run build` to check for type issues.
- **Linting:** Run `npm run lint` to find and fix code style issues.
