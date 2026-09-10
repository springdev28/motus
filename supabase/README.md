# Motus shared accounts and comics

Implementation is prepared for a dedicated Supabase project. No production database has been provisioned or modified by this change. Until runtime configuration is supplied, the app shows an explicit service notice and keeps local drafts and settings usable.

## Deployment setup

1. Select the dedicated Motus project and confirm its organization and hosting cost. Do not apply the schema to an unrelated existing project.
2. Apply `motus-platform-schema.sql` once to the new project. This is a bootstrap schema, not an idempotent migration. It creates eight RLS-protected tables plus a private JSON storage bucket.
3. In Supabase Auth, set the site URL and allowed redirect URL `https://olive-toad-138897.hostingersite.com/account`. Add `http://localhost:3000/account` only for local development if needed.
4. Configure custom SMTP for confirmation and password recovery emails, keep email confirmation enabled, set a minimum password length of 12, and test delivery to an address outside the organization. Supabase's default SMTP only sends to authorized organization addresses and is insufficient for public registration. See https://supabase.com/docs/guides/auth/auth-smtp.
5. Set these runtime variables in the Hostinger Node application:
   - `MOTUS_SUPABASE_URL`: the dedicated project's HTTPS URL.
   - `MOTUS_SUPABASE_PUBLISHABLE_KEY`: a modern `sb_publishable_` key, never a service-role or secret key.
   - `SITE_URL`: `https://olive-toad-138897.hostingersite.com`.
6. Build and deploy using the existing Hostinger `server.js` entry, Node 22, and `npm run build`. Local development can use exported environment variables or the hosting environment. The config API reads runtime environment variables and returns only validated public configuration.
7. Run the access checks below before opening public registration. Check Supabase security/performance advisors as well.

## Access and release checks

Use two separate test accounts, A and B, plus an anonymous client. Do not use a service-role client for permission tests.

- Anonymous clients can read profiles, communities, memberships, and published works. They cannot write anything or read private preferences, bookmarks, follows, reports, or unpublished editions.
- A can create and update only A's profile, preferences, and works. B cannot update those records, upload into A's storage folder, delete A's editions, or read an unpublished edition.
- Joining and leaving a community affect only the current user's membership. Only a community owner can edit its name, address, description, and rules.
- A can publish into a joined or owned community. Publishing into another community must fail.
- Drafts remain in the existing `motus-basic-v1` IndexedDB store. Publishing uploads an immutable snapshot of at most 50 MB, with access controlled by the associated work's published flag. Later local edits do not alter the public snapshot until republished.
- Unpublishing removes the public work and storage access while keeping the owner's edition available. The unpublish action also clears community association so leaving a community never prevents withdrawing a work.
- Publishing an existing local ID owned by another account must fail without replacing any data.
- Test signup confirmation, sign-in, sign-out, password recovery, profile creation, community creation/join/leave, publishing, reading on another device, bookmarks, creator follows, and reading preferences.
- Verify all three reader layouts, both reading directions, motion off, page transitions, and image proportions. Verify no original Studio route is exposed.

## Reporting and limits

Reports are stored privately in `public.content_reports`. The site operator reviews them in the Supabase dashboard and can set a reported work's `published` flag to `false` if needed. Reports do not email the operator. There is no moderation dashboard in this release.

Directory and archive queries return at most 500 recent records. Comic files remain JSON editions containing validated raster image data; no HTML, scripts, remote image URLs, payments, ads, or original Studio routes are exposed. Reading progress and appearance stay on each device; layout, direction, animation, and remember-position preferences sync to signed-in accounts.
