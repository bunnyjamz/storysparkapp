# StorySpark

StorySpark is a mobile-first web app designed as a storytelling coach and story-crafting tool. It helps beginner storytellers capture real-life moments and transform them into compelling narratives.

## Tech Stack

- **Frontend:** React (TypeScript) + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/Auth:** Supabase (PostgreSQL)
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
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials.
   ```bash
   cp .env.example .env.local
   ```
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).

## Supabase Setup

1. **Create a new Supabase project.**
2. **Run Migrations:**
   Use the SQL editor in Supabase dashboard to run the contents of `supabase/migrations/20231027000000_initial_schema.sql`.
3. **Seed Data (Optional):**
   You can run the contents of `supabase/seed.sql` to see how data is structured.

## Database Schema

- **users**: Extended profile data for Supabase Auth users.
- **stories**: Core story data (title, date, setting, tags, freeform text).
- **story_versions**: Version history for future AI improvements.
- **learning_progress**: Tracks explored storytelling structures.

## Features (Phase 1)

- **Auth:** Email/Password signup and login.
- **Story Capture:** Low-friction form with guided placeholders and helper prompts.
- **Dashboard:** View all captured stories with sorting options.
- **Detail View:** Read individual story details.
- **Responsive:** Optimized for mobile and desktop.

## Future Phases

- **Phase 2:** AI-powered organization and storytelling structures.
- **Phase 3:** Coach mode with AI feedback.
- **Phase 4:** Sharing and community features.

## Troubleshooting

- **Supabase Credentials:** Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set in `.env.local`.
- **TypeScript Errors:** Run `npm run build` to check for type issues.
- **Linting:** Run `npm run lint` to find and fix code style issues.
