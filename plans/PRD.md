# Today, Today and Today — Product Requirements Document

## Problem Statement

Writers, poets, and reflective thinkers lack a dedicated, distraction-free digital space for daily writing rituals. Existing blogging platforms optimize for audience growth, SEO, and engagement metrics — none of them treat the act of writing itself as sacred. There is no platform that captures the *atmosphere* of the moment a piece was written: the weather outside, the phase of the moon, the quality of light — details that anchor a memory in time and place.

**Today, Today and Today** is an invite-only daily writing platform where each user publishes one entry per day. The experience should feel like opening a beautiful notebook: clean, minimal, and deeply focused on gorgeous typography that invites the writer into flow. The community aspect is gentle — no comments, no metrics, just a quiet "I see you" acknowledgment that someone read and was moved.

## Proposed Solutions

### Solution: Next.js Full-Stack Application with SQLite

A self-hosted Next.js application using SQLite for data persistence, deployed to a VPS. This keeps the entire stack simple, the data under the author's control, and the operational footprint minimal.

**Architecture:**

- **Next.js (App Router)** — Server-side rendering for fast page loads and SEO-friendly public posts. Server Actions for mutations. API routes for weather/location lookups.
- **SQLite via Drizzle ORM** — Lightweight, file-based database. Drizzle provides type-safe queries, excellent migration tooling, and minimal overhead compared to Prisma. Runs identically in local dev and VPS production.
- **Authentication** — Email + password using a session-based auth system (e.g., Lucia Auth or a lightweight custom solution with bcrypt + secure HTTP-only cookies).
- **Image storage** — Local filesystem with a configurable base path (`./uploads` locally, `/var/data/uploads` on VPS). The database stores only the relative path. Images served via a Next.js API route or static file serving in production.
- **OpenWeatherMap API** — Free tier (1,000 calls/day) provides current weather conditions, temperature, sunrise/sunset times. Combined with a moon phase calculation library (lunar math is deterministic, no API needed) and sunrise/sunset data to derive golden hour, blue hour, and day length.

**Pros:**
- Single deployable unit — no microservices, no external database server
- SQLite is zero-config, works identically in dev and production
- Drizzle migrations are plain SQL files, easy to version and review
- Next.js App Router gives server components for fast initial loads
- Full data ownership on VPS

**Cons:**
- SQLite has write concurrency limits (acceptable for this scale — invite-only, ~dozens of users)
- Image storage on VPS filesystem means backups must include the uploads directory
- No CDN for images without additional setup (can be added later)

### Alternative Considered: Postgres + S3

Using PostgreSQL and an S3-compatible object store would scale further but adds operational complexity (managed database, AWS credentials, CORS configuration) that is unnecessary for an invite-only community of this size. This can be migrated to later if needed.

## Implementation Decisions

### Data Model

**Users**
- id, username (unique), display_name, email (unique), password_hash
- location (optional, user-provided default location)
- role (admin | member)
- invite_codes_remaining (starts at 3, admin can increase)
- created_at, updated_at

**Invite Codes**
- id, code (unique), created_by (user id), used_by (nullable user id)
- used_at (nullable), expires_at, created_at

**Posts**
- id, author_id, title, body (rich text stored as HTML), body_format (richtext | markdown)
- cover_image_path (nullable)
- location_name (e.g., "Montreal, Canada")
- latitude, longitude (nullable, for weather lookup)
- word_count (enforced max: 1,000)
- status (draft | published)
- draft_started_at (the date this counts toward — set when draft is created)
- published_at (nullable), created_at, updated_at

**Atmospheric Details** (stored per post at draft creation time)
- post_id, type (enum: moon_phase | golden_blue_hour | sunset_offset | poetic_season | day_length | weather_condition | temperature)
- value (string, e.g., "waxing crescent", "golden hour", "the sun set 47 minutes ago")
- display_text (the final poetic rendering)

Each post gets 2-3 atmospheric details, randomly selected at draft creation time from the available types. Weather-dependent types (weather_condition, temperature, sunset_offset, golden_blue_hour) require location permission; if unavailable, the system selects only from location-independent types (moon_phase, poetic_season, day_length — day length still works with manual location via geocoding).

**Acknowledgments ("I see you")**
- id, post_id, user_id, created_at
- Unique constraint on (post_id, user_id) — one per user per post, removable

### Modules

**1. Auth Module**
- Email + password registration (with invite code validation)
- Login / logout with secure HTTP-only session cookies
- Password hashing with bcrypt
- Session management (creation, validation, expiration)
- Account deletion (cascades to posts, acknowledgments, issued invite codes)

**2. Invite System Module**
- Generate invite codes (users get 3 on registration)
- Validate and consume invite code during registration (single-use)
- Admin endpoint to grant additional invite codes to any user
- Invite code expiration (30 days from creation)

**3. Post Composition Module (the core writing experience)**
- Rich text editor with bold, italic, links, blockquotes — clean and minimal toolbar
- Optional Markdown mode with live preview (side-by-side or toggle)
- One cover image upload (max 4MB, validated server-side), displayed under the title
- Title input — large, beautiful typography, always legible over cover images (text shadow + gradient overlay in CSS)
- Word count display with 1,000-word max enforcement
- Draft auto-save
- "Post date" concept: the date assigned to a post is the date the draft was created (draft_started_at), not the publish date. This is displayed clearly in the editor UI so the user knows which day the post belongs to.
- One post per day enforcement: users cannot create a new draft if they already have a draft or published post for that calendar day
- Publish action (moves from draft to published)
- Edit and delete for own posts

**4. Atmospheric Context Module**
- On draft creation: request browser geolocation (optional)
- If location granted: call OpenWeatherMap API for current conditions, temperature, sunrise/sunset
- Calculate moon phase (deterministic algorithm, no API)
- Determine golden hour / blue hour based on sunrise/sunset times
- Calculate day length from sunrise/sunset
- Derive poetic season from date and hemisphere
- Calculate sunset/sunrise offset ("the sun set 23 minutes ago")
- Randomly select 2-3 of the available atmospheric types
- Compose poetic display text for each (e.g., "Under a waxing crescent" / "The rain was pouring outside" / "Written during the golden hour")
- Render the composed atmospheric header at the top of the post in beautiful typography
- If location denied: user may manually enter location name. Only non-weather-dependent details will be available (moon phase, poetic season). If manual location is provided, day length can be calculated via geocoding.

**5. Feed / Dashboard Module**
- Paginated feed of published posts, newest first
- Post cards: cover image as background, title overlay, text preview (first ~150 characters), author display name, location name
- Filter by author (click author name or search)
- Filter by location (search/autocomplete)
- Responsive grid layout (1 column mobile, 2-3 columns desktop)

**6. Author Profile Module**
- Public profile page showing all published posts by a user, paginated
- Display name, username, member since date
- Post archive in reverse chronological order

**7. Admin Dashboard Module**
- View all users (with post counts, join date)
- Grant additional invite codes to users
- View all invite codes and their status
- Ability to delete users or posts (moderation)

**8. Image Handling Module**
- Upload endpoint with 4MB size validation
- Image processing: resize/compress for web (maintain aspect ratio, max ~1920px width)
- Store to configurable local filesystem path
- Serve via API route (dev) or static file serving (production)
- Cleanup on post deletion

### Typography & Design Decisions

- **Font pairing:** A refined serif for titles and body text (e.g., Playfair Display or Cormorant Garamond for headings, Lora or Source Serif Pro for body), paired with a clean sans-serif for UI elements (e.g., Inter)
- **Title treatment:** Large, bold serif type. Over cover images: white text with a subtle text-shadow and a gradient overlay on the image (dark at bottom) to ensure legibility regardless of image brightness
- **Atmospheric header:** Italic serif, slightly smaller than the title, rendered in a muted tone above or below the title
- **Writing editor:** Maximum whitespace. No sidebar. Minimal toolbar that fades when writing. The textarea/editor should feel like a blank page
- **Blockquotes:** Large left border, italic, indented — elegant and prominent
- **Color palette:** Warm, muted tones. Off-white backgrounds, deep charcoal text. Accent color kept minimal
- **Responsive:** Mobile-first. Single column feed on mobile, editor is full-width with comfortable margins

### API Contracts

**OpenWeatherMap** — Current Weather endpoint:
- `GET https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric`
- Returns: weather conditions, temperature, sunrise/sunset timestamps
- Called once per draft creation (only if location is available)

### Seed Data

- Admin user: Ricardo Magalhaes, username `magalhini`, email `magalhini@gmail.com`
- 2-3 additional dummy users with sample posts spanning several days
- Sample posts with varied atmospheric conditions, cover images, and content styles

## Testing Decisions

A good test for this project verifies **external behavior through the module's public interface** — not internal implementation details. Tests should be resilient to refactoring: if the internal structure changes but the behavior is the same, no tests should break.

### Modules to test:

**1. Atmospheric Context Module**
- Given a set of weather data, location, and timestamp, it produces correct poetic text
- Moon phase calculation returns correct phase for known dates
- Golden/blue hour detection is correct for known sunrise/sunset times
- Random selection always picks 2-3 details, never duplicates
- Graceful fallback when location is not provided

**2. Post Composition Module**
- Enforces 1,000-word limit
- Enforces one-post-per-day (draft_started_at date is used, not publish date)
- Draft-to-publish state transition works correctly
- Post date is correctly assigned as the draft creation date
- Cannot create a new draft for a day that already has a post

**3. Invite System Module**
- Invite codes are single-use
- Expired codes are rejected
- Users start with 3 invite codes
- Admin can grant additional codes

**4. Auth Module**
- Registration requires valid invite code
- Password is hashed, never stored in plain text
- Session management (creation, validation, expiration)
- Account deletion cascades correctly

### Prior art for tests:
- This is a greenfield project, so test patterns will be established from scratch
- Use Vitest for unit/integration tests
- Use Playwright for critical E2E flows (registration, writing a post, publishing)

## Out of Scope

- **Comments** — by design, this platform has no comment system
- **Social features** — no following, no notifications, no DMs
- **OAuth / magic link auth** — email + password only for v1
- **CDN / image optimization service** — images served from VPS filesystem for now
- **VPS deployment and infrastructure setup** — will be addressed separately
- **Full About page content** — page will exist with placeholder content
- **Search by post content** — only search by author and filter by location for v1
- **Password reset flow** — can be added later
- **Email notifications** — no transactional email for v1

## Further Notes

- **Accessibility:** Semantic HTML, proper heading hierarchy, ARIA labels on interactive elements, keyboard-navigable editor and feed, sufficient color contrast ratios (WCAG AA minimum), alt text for cover images (author-provided or title as fallback)
- **Mobile responsive:** Mobile-first CSS, touch-friendly tap targets, responsive images, editor comfortable on phone screens
- **Local development:** `pnpm dev` should work out of the box with SQLite file in project root, seed script for dummy data, uploads stored in `./uploads`
- **Migration strategy:** Drizzle Kit for generating and running migrations. Seed script separate from migrations.
- **Future considerations:** RSS feed per author, dark mode, export posts as PDF/epub, yearly "journal" compilation
