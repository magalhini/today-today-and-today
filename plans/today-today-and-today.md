# Plan: Today, Today and Today

> Source PRD: `./PRD.md`

## Architectural Decisions

Durable decisions that apply across all phases:

### Routes

- `/` — Public feed (paginated, newest first)
- `/login` — Login page
- `/register` — Registration page (requires invite code)
- `/write` — Create new draft / continue today's draft
- `/write/[postId]` — Edit existing draft or published post
- `/post/[postId]` — Single post view (public)
- `/profile/[username]` — Author profile with post archive
- `/settings` — User settings, invite codes, account management
- `/admin` — Admin dashboard (admin role only)
- `/about` — About page
- `/api/upload` — Image upload endpoint
- `/api/weather` — Proxied OpenWeatherMap call (keeps API key server-side)

### Schema (SQLite via Drizzle)

- **users** — id, username (unique), display_name, email (unique), password_hash, location, role (admin|member), invite_codes_remaining (default 3), created_at, updated_at
- **sessions** — id, user_id, expires_at, created_at
- **invite_codes** — id, code (unique), created_by, used_by (nullable), used_at (nullable), expires_at, created_at
- **posts** — id, author_id, title, body (HTML), body_format (richtext|markdown), cover_image_path (nullable), location_name, latitude (nullable), longitude (nullable), word_count, status (draft|published), draft_started_at, published_at (nullable), created_at, updated_at
- **atmospheric_details** — id, post_id, type (enum), value, display_text
- **acknowledgments** — id, post_id, user_id, created_at; unique(post_id, user_id)

### Key Models & Constraints

- One post per user per calendar day, enforced by unique constraint on (author_id, date(draft_started_at))
- Post date = draft_started_at (not publish date), displayed clearly in UI
- 1,000 word max per post
- Cover images: max 4MB, resized to max 1920px width, stored on local filesystem
- Atmospheric details: 2-3 randomly selected per draft at creation time
- Invite codes: single-use, 30-day expiry, users start with 3

### Authentication

- Email + password with bcrypt hashing
- HTTP-only secure session cookies
- Server-side session validation on protected routes via middleware

### Typography & Visual Identity

This is the soul of the project. Every phase must treat visual quality as a constraint, not an afterthought.

- **Headings:** Cormorant Garamond (or similar refined serif) — large, expressive, with generous line-height
- **Body text:** Lora or Source Serif Pro — warm, readable, designed for long-form
- **UI elements:** Inter — clean, invisible, stays out of the way
- **Color palette:** Warm off-whites (`#FAF8F5`-range), deep charcoal (`#2C2C2C`-range) for text, a single muted accent (warm terracotta or sage). Minimal color — let typography and whitespace do the work.
- **Spacing philosophy:** Generous margins and padding everywhere. The page should breathe. The editor should feel like an empty room, not a cockpit.
- **Title over image:** White serif text, `text-shadow: 0 2px 12px rgba(0,0,0,0.6)`, image has a CSS gradient overlay (`linear-gradient(transparent 40%, rgba(0,0,0,0.55))`) to guarantee legibility on any image brightness.
- **Atmospheric header:** Italic serif, muted tone, slightly smaller than title — poetic and understated.
- **Blockquotes:** Large left border (2-3px, accent color), italic, generous left indent and padding.
- **Mobile-first:** Single column, comfortable reading widths (max ~680px for text), large tap targets.

### Third-Party Services

- **OpenWeatherMap** — Current weather API, called once per draft creation when location is available
- No other external services for v1

---

## Phase 1: Foundation & Auth

### What to build

Set up the Next.js project with TypeScript, Tailwind CSS, Drizzle ORM + SQLite, and the foundational visual identity. Implement email/password authentication (register, login, logout) with session-based auth. Create the database schema and migration scripts. Seed the database with the admin user and 2-3 dummy users.

The visual tone must be established from this first phase: install the font stack, set up the base color palette and spacing tokens in Tailwind config, and apply them to the auth pages. The login and registration pages should already feel like they belong to a beautiful, minimal writing platform — not a generic SaaS app.

### Acceptance criteria

- [ ] Next.js App Router project with TypeScript, Tailwind CSS, Drizzle ORM, SQLite
- [ ] Database schema for users and sessions, with migration scripts
- [ ] Font stack installed and configured (serif for headings/body, sans-serif for UI)
- [ ] Base color palette and spacing tokens defined in Tailwind config
- [ ] Registration page (email, username, display name, password) — styled with project typography
- [ ] Login page — styled with project typography
- [ ] Logout functionality
- [ ] Session-based auth with HTTP-only cookies
- [ ] Protected route middleware (redirects unauthenticated users)
- [ ] Seed script: admin user (Ricardo Magalhaes / magalhini / magalhini@gmail.com) + 2-3 dummy users
- [ ] Empty dashboard shell at `/` (authenticated) showing "no posts yet" in beautiful type
- [ ] `pnpm dev` works out of the box with no external dependencies
- [ ] Mobile-responsive auth pages

---

## Phase 2: Invite System

### What to build

Gate registration behind single-use invite codes. Users start with 3 invite codes upon registration, can generate and share them, and codes expire after 30 days. The registration flow now requires a valid invite code. Users can view and manage their invite codes from a settings page (early version).

### Acceptance criteria

- [ ] Database schema for invite_codes, with migration
- [ ] Registration requires a valid, unused, non-expired invite code
- [ ] Invite code is consumed (marked used) upon successful registration
- [ ] New users receive 3 invite codes on registration
- [ ] Settings page at `/settings` where users can view their remaining codes and generate new ones
- [ ] Generated codes display with easy copy-to-clipboard
- [ ] Expired and used codes are visually distinguished
- [ ] Seed script updated: admin user has invite codes, one dummy user was registered via an invite code
- [ ] Unit tests: single-use enforcement, expiry validation, code consumption

---

## Phase 3: The Writing Experience (Plain Text MVP)

### What to build

The core of the platform: the writing editor. Even in this plain-text MVP, the editor must feel like the most beautiful text input the user has ever used. Large serif title input, generous whitespace, no distractions. The page should feel like opening a blank notebook.

Implement draft creation (assigns draft_started_at as post date), save draft, publish, edit, and delete. Enforce the one-post-per-day rule and 1,000-word limit. Display the post date clearly so the user always knows which day they're writing for.

The single post view (`/post/[postId]`) should render the post with the same typographic care — beautiful title, well-set body text, author name, location, and date.

### Acceptance criteria

- [ ] `/write` route — if no draft exists for today, creates one (sets draft_started_at); if one exists, opens it
- [ ] Editor page: large serif title input, spacious body textarea, word count display
- [ ] The editor feels zen: maximum whitespace, no sidebar, minimal chrome
- [ ] Word count enforced at 1,000 words (client-side warning + server-side rejection)
- [ ] Draft auto-save (debounced, saves to server)
- [ ] Post date (draft_started_at) displayed clearly in editor: "Writing for Monday, March 30"
- [ ] One-post-per-day enforcement: cannot create a second draft for the same calendar day
- [ ] Publish action: transitions draft to published, sets published_at
- [ ] Edit published post (returns to editor)
- [ ] Delete post (with confirmation)
- [ ] Single post view at `/post/[postId]` — beautiful typography, author name, location, date
- [ ] Mobile-responsive editor and post view
- [ ] Tests: one-post-per-day rule, word limit enforcement, draft-to-publish transition, post date assignment

---

## Phase 4: Rich Text & Markdown Editor

### What to build

Upgrade the plain text editor to a rich text editor with bold, italic, links, and blockquotes. Add a toggle for Markdown mode with live side-by-side preview. The toolbar should be minimal and unobtrusive — it should fade or recede when the user is actively writing, reappearing on text selection or hover.

Blockquotes deserve special attention: they should be visually striking with elegant left-border treatment and italic serif type.

### Acceptance criteria

- [ ] Rich text editor with toolbar: bold, italic, link, blockquote
- [ ] Toolbar is minimal and unobtrusive — fades during active writing, appears on selection or hover
- [ ] Markdown mode toggle (stored as body_format on the post)
- [ ] Markdown mode: live side-by-side preview (or toggle preview on mobile)
- [ ] Blockquotes render beautifully: large left border, italic, generous indent
- [ ] Rich text stored as HTML in database
- [ ] Keyboard shortcuts for formatting (Cmd/Ctrl+B, Cmd/Ctrl+I, etc.)
- [ ] Formatting preserved correctly on save, reload, and in post view
- [ ] Mobile-friendly: toolbar adapts to smaller screens

---

## Phase 5: Cover Image Upload

### What to build

Allow users to upload one cover image per post (max 4MB). The image appears as a fixed cover below the title in the post view. The title must always be legible over the image regardless of image brightness — this is achieved with CSS gradient overlay and text shadow treatment.

In the editor, show an image upload area (drag-and-drop or click) above the body. In the post view and feed cards, the image becomes the visual anchor of the post.

### Acceptance criteria

- [ ] Image upload endpoint at `/api/upload` with 4MB server-side validation
- [ ] Images resized/compressed server-side (max 1920px width, maintain aspect ratio)
- [ ] Images stored to configurable filesystem path (`./uploads` locally)
- [ ] Database stores only the relative path
- [ ] Editor: drag-and-drop or click-to-upload area, image preview after upload
- [ ] Post view: cover image displayed under the title, full-width
- [ ] Title over image treatment: white serif text + text-shadow + gradient overlay on image — legible on any image
- [ ] Image removed when post is deleted (filesystem cleanup)
- [ ] Replace/remove image in editor
- [ ] Graceful handling of posts without images (no broken layout)
- [ ] Mobile-responsive image display

---

## Phase 6: Atmospheric Context

### What to build

The poetic layer that makes this platform magical. When a user creates a new draft, the browser requests geolocation permission. If granted, the server calls OpenWeatherMap for current conditions and computes atmospheric details. The system randomly selects 2-3 details from: moon phase, golden/blue hour, sunset offset, poetic season, day length, weather condition, temperature — and composes them into a poetic header displayed at the top of the post.

If location is denied, the user can manually enter a location name. Only non-weather-dependent details (moon phase, poetic season) are available without coordinates. The atmospheric header should be rendered in italic serif, understated but evocative.

### Acceptance criteria

- [ ] Browser geolocation request on draft creation (graceful if denied)
- [ ] Server-side OpenWeatherMap integration via `/api/weather` (API key stays server-side)
- [ ] Moon phase calculation (deterministic algorithm, no API)
- [ ] Golden hour / blue hour detection from sunrise/sunset times
- [ ] Sunset/sunrise offset calculation ("the sun set 47 minutes ago")
- [ ] Day length calculation
- [ ] Poetic season derivation (hemisphere-aware, nuanced: "early spring", "the last days of winter")
- [ ] Random selection of 2-3 atmospheric types per draft (never all, never duplicates)
- [ ] Poetic display text composition (e.g., "Under a waxing crescent, the rain fell softly in Montreal")
- [ ] Atmospheric header rendered at top of post in italic serif typography
- [ ] Manual location fallback: text input for location name when geolocation denied
- [ ] Atmospheric details stored in database, immutable after creation
- [ ] Tests: moon phase for known dates, golden hour detection, random selection constraints, fallback behavior

---

## Phase 7: Feed & Post Cards

### What to build

The public dashboard — a paginated feed of published posts, newest first. Each post is rendered as a card: cover image as background (if present), title overlaid, a short text preview (~150 characters), author display name, and location. The feed should feel like browsing a curated gallery of daily writings.

Add filtering by author (clicking an author name, or search) and filtering by location. Responsive grid: single column on mobile, 2-3 columns on desktop.

### Acceptance criteria

- [ ] Paginated feed at `/` showing published posts, newest first
- [ ] Post cards: cover image background (gradient overlay for legibility), title, text preview, author name, location
- [ ] Cards without cover images: elegant fallback (solid warm background with typography-forward design)
- [ ] Pagination controls (previous/next, or page numbers) — styled consistently
- [ ] Filter by author: click author name on card, or search input
- [ ] Filter by location: search/autocomplete input
- [ ] Filters combinable and reflected in URL (shareable filtered views)
- [ ] Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
- [ ] Cards have subtle hover state (slight lift or shadow)
- [ ] Empty state: beautiful "no posts yet" message when filters return nothing
- [ ] Mobile-responsive feed

---

## Phase 8: "I See You" Acknowledgments

### What to build

A quiet, gentle interaction: readers can acknowledge a post with an "I see you" button. It's a toggle — click to acknowledge, click again to remove. The count is visible on the post view and on feed cards. The post author can see who has acknowledged their post.

The interaction should feel warm and human, not like a "like" button. The UI treatment matters — consider a subtle icon (an eye, a hand, a small wave) that feels intentional, not gamified.

### Acceptance criteria

- [ ] "I see you" button on single post view — toggle to acknowledge/remove
- [ ] Acknowledgment count visible on post view and feed cards
- [ ] Author can see list of users who acknowledged (on post view, expandable or tooltip)
- [ ] Cannot acknowledge own posts
- [ ] Button has a warm, human feel — not a generic thumbs-up or heart
- [ ] Optimistic UI update (immediate visual feedback, syncs with server)
- [ ] Database: unique constraint on (post_id, user_id), acknowledgment is removable
- [ ] Unauthenticated users see the count but cannot interact

---

## Phase 9: Author Profiles & Account Management

### What to build

Public author profile pages showing a user's post archive in reverse chronological order. User settings page with account management: edit display name, default location, change password, and delete account (with confirmation and full cascade).

The profile page should feel like a personal journal archive — same typographic care as the rest of the platform.

### Acceptance criteria

- [ ] Author profile at `/profile/[username]` — display name, username, member since date
- [ ] Paginated post archive on profile, reverse chronological, same card treatment as feed
- [ ] Settings page at `/settings`: edit display name, default location, change password
- [ ] Account deletion with confirmation dialog — cascades posts, acknowledgments, invite codes
- [ ] Profile pages are public (viewable without login)
- [ ] Clicking author name anywhere in the app navigates to their profile
- [ ] About page at `/about` with placeholder content, styled consistently
- [ ] Mobile-responsive profile and settings pages

---

## Phase 10: Admin Dashboard

### What to build

An admin-only dashboard for platform moderation. View all users with post counts and join dates. Grant additional invite codes to any user. View all invite codes and their status. Delete users or posts for moderation.

This is a functional tool — it should be clean and usable, but doesn't need the same poetic treatment as the writing experience.

### Acceptance criteria

- [ ] Admin dashboard at `/admin` — protected by admin role check
- [ ] User list: display name, username, email, post count, join date, invite codes remaining
- [ ] Grant additional invite codes to any user (input count + confirm)
- [ ] Invite code list: code, created by, status (available/used/expired), used by, dates
- [ ] Delete user (with confirmation) — cascades all their data
- [ ] Delete post (with confirmation) — removes post and its image
- [ ] Non-admin users see 404 or redirect when accessing `/admin`
- [ ] Mobile-responsive admin views

---

## Phase 11: Polish, Seed Data & Testing

### What to build

Final polish pass. Enrich the seed script with realistic sample posts that showcase the platform's beauty: varied atmospheric details, cover images, different writing styles (poetry, prose, reflection). Run through the full experience on mobile and desktop, fix rough edges. Write E2E tests for critical flows.

### Acceptance criteria

- [ ] Seed script creates compelling sample content: 3+ users, 10+ posts across several days
- [ ] Sample posts include cover images, atmospheric details, varied formatting (rich text + markdown)
- [ ] E2E tests (Playwright): registration with invite code, writing and publishing a post, browsing the feed, acknowledging a post
- [ ] Full accessibility audit: keyboard navigation, screen reader, color contrast (WCAG AA)
- [ ] Cross-browser check: Chrome, Firefox, Safari
- [ ] Mobile experience polished: editor, feed, post view, profile
- [ ] No broken layouts with or without cover images, with or without atmospheric details
- [ ] Loading states and error states are styled consistently with the design system
