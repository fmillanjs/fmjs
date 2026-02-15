---
phase: 01-foundation-authentication
plan: 05
subsystem: auth-flows
tags: [password-reset, profile-management, email-verification, token-validation, idor-prevention]

# Dependency graph
requires:
  - phase: 01-foundation-authentication
    plan: 04
    provides: NextAuth v5 authentication, Redis sessions, login/signup
  - phase: 01-foundation-authentication
    plan: 02
    provides: Prisma VerificationToken model, Zod validators
provides:
  - Password reset flow with one-time tokens (1-hour expiry)
  - Email enumeration prevention
  - User profile view/edit (name, image)
  - Password change with current password verification
  - IDOR protection via session-based mutations
affects: [authentication system completion - AUTH-04, AUTH-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [Token-based password reset, IDOR prevention, Email enumeration prevention, Server-side session validation]

key-files:
  created:
    - apps/web/lib/email.ts (Email utility with dev logging)
    - apps/web/app/(auth)/reset-password/page.tsx (Reset request page)
    - apps/web/app/(auth)/reset-password/[token]/page.tsx (Reset page with token)
    - apps/web/app/(auth)/reset-password/actions.ts (Password reset server actions)
    - apps/web/components/auth/reset-password-request-form.tsx (Reset request form)
    - apps/web/components/auth/reset-password-form.tsx (Reset password form)
    - apps/web/app/(dashboard)/profile/page.tsx (Profile view/edit page)
    - apps/web/app/(dashboard)/profile/actions.ts (Profile server actions)
    - apps/web/components/auth/profile-form.tsx (Profile edit form)
    - apps/web/components/auth/change-password-form.tsx (Password change form)
  modified: []

key-decisions:
  - "Console logging for dev email (production SMTP deferred as acceptable for portfolio)"
  - "Email enumeration prevention: same response whether email exists or not"
  - "One-time token usage enforced by deletion after successful reset"
  - "IDOR prevention: all mutations use session.user.id instead of form data"
  - "Password change requires current password verification"
  - "Email and role fields read-only in profile (managed by admin)"

patterns-established:
  - "Token-based password reset with expiry (1 hour)"
  - "Email anti-enumeration pattern (same response always)"
  - "Session-based authorization (never trust client IDs)"
  - "Current password verification for password changes"
  - "Client-side password confirmation (UX enhancement)"

# Metrics
duration: 3min
completed: 2026-02-15
---

# Phase 1 Plan 05: Password Reset & Profile Management Summary

**Complete auth flows: password reset via email token and user profile management with password change**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-02-15T01:32:22Z
- **Completed:** 2026-02-15T01:35:36Z
- **Tasks:** 2
- **Files created:** 10
- **Files modified:** 0

## Accomplishments

**Password Reset Flow:**
- Request password reset by email
- Generate secure random UUID token (not predictable)
- Store token in VerificationToken table with 1-hour expiry
- Email utility logs reset URL to console (dev mode)
- Reset password page validates token before allowing reset
- Token deleted after successful use (one-time use enforcement)
- Email enumeration prevented (same response for existing/non-existing emails)

**Profile Management:**
- View profile page showing user name, email, role, creation date
- Edit name and profile picture URL
- Email and role displayed as read-only fields
- "Member since" display formatted from createdAt
- Real-time validation with Zod schemas
- Success/error feedback for all operations

**Password Change:**
- Change password requires current password verification
- Client-side validation: new password must differ from current
- Client-side confirmation password matching
- Server-side bcrypt verification of current password
- New password hashed with bcrypt (12 rounds)
- Form clears on successful change

**Security Features:**
- IDOR prevention: all mutations use `session.user.id` from NextAuth
- Never accept user ID from form data
- Token-based reset with expiry enforcement
- Email enumeration prevention (consistent response messages)
- Current password verification prevents unauthorized changes
- One-time token usage

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement password reset flow with token validation** - `73f4ba4` (feat)
2. **Task 2: Implement profile view/edit and password change** - `4fe0339` (feat)

## Files Created/Modified

**Created (10 files):**
- Email utility: `apps/web/lib/email.ts`
- Password reset pages: `apps/web/app/(auth)/reset-password/page.tsx`, `apps/web/app/(auth)/reset-password/[token]/page.tsx`
- Reset actions: `apps/web/app/(auth)/reset-password/actions.ts`
- Reset forms: `apps/web/components/auth/reset-password-request-form.tsx`, `apps/web/components/auth/reset-password-form.tsx`
- Profile page: `apps/web/app/(dashboard)/profile/page.tsx`
- Profile actions: `apps/web/app/(dashboard)/profile/actions.ts`
- Profile forms: `apps/web/components/auth/profile-form.tsx`, `apps/web/components/auth/change-password-form.tsx`

**Modified:** None

## Decisions Made

1. **Console logging for dev email:** For portfolio demonstration, logging password reset URLs to console is acceptable. Production SMTP integration documented in code comments as future TODO. This avoids third-party service setup during development while proving the implementation works.

2. **Email enumeration prevention:** Password reset request returns the same success message regardless of whether the email exists in the database. This prevents attackers from discovering valid email addresses by trying different emails.

3. **One-time token usage:** Token is deleted from database after successful password reset, enforcing one-time use. Attempting to reuse the same token shows "Invalid or expired reset link" error.

4. **IDOR prevention via session:** All profile mutations (`updateProfile`, `changePassword`) use `session.user.id` from NextAuth session, never accepting user ID from form data. This prevents Insecure Direct Object Reference attacks where an attacker could modify another user's data.

5. **Current password verification:** Password change requires entering current password and verifying it with bcrypt before allowing the change. This prevents unauthorized password changes if someone gains temporary access to a logged-in session.

6. **Read-only email and role:** Email and role fields are disabled in the profile form and marked as read-only with explanatory text. Email changes would require email verification flow (future enhancement). Role changes are admin-only operations.

## Deviations from Plan

None - plan executed exactly as written.

## Password Reset Flow Details

**Request Flow:**
1. User visits `/reset-password`
2. Enters email address
3. Form validates email with `resetPasswordRequestSchema`
4. Server action finds user by email (case-insensitive)
5. If user exists:
   - Generate UUID token
   - Delete any existing password-reset tokens for email
   - Create VerificationToken with 1-hour expiry
   - Call `sendResetPasswordEmail` (logs to console in dev)
6. Return success message (same whether email exists or not)

**Reset Flow:**
1. User clicks reset link with token: `/reset-password/{token}`
2. Enters new password and confirmation
3. Form validates with `resetPasswordSchema`
4. Server action finds VerificationToken by token and type
5. Check if token exists and not expired
6. Find user by token identifier (email)
7. Hash new password with bcrypt (12 rounds)
8. Update user password in database
9. Delete the used token
10. Redirect to `/login?reset=success`

**Security Measures:**
- Secure random UUID tokens (not predictable)
- 1-hour expiry enforced at query time
- One-time use via token deletion
- Email enumeration prevention
- Token type field distinguishes password-reset from other verification types

## Profile Management Flow Details

**Update Profile:**
1. User edits name or image URL
2. Form validates with `updateProfileSchema`
3. Server action verifies session authentication
4. Update only provided fields using `session.user.id`
5. Return updated user data
6. Show success message and refresh page

**Change Password:**
1. User enters current password, new password, confirm password
2. Client validates new ≠ current and new = confirm
3. Server action verifies session authentication
4. Fetch user password hash from database
5. Verify current password with bcrypt.compare
6. If incorrect, return error
7. Hash new password (12 rounds)
8. Update password in database
9. Clear form and show success message

**IDOR Prevention:**
- Server actions call `auth()` to get session
- Use `session.user.id` for database queries
- Never accept user ID from form data
- All mutations scoped to authenticated user only

## Validation Schema Coverage

**Password Reset Request:**
- Email: valid email format

**Password Reset:**
- Token: required string
- Password: 8+ chars, uppercase, lowercase, number

**Update Profile:**
- Name: 2-100 characters (optional)
- Image: valid URL (optional, nullable)

**Change Password:**
- Current password: required
- New password: 8+ chars, uppercase, lowercase, number
- Client-side: new ≠ current, new = confirm

## Next Phase Readiness

- Password reset flow complete (AUTH-04)
- Profile management complete (AUTH-05)
- Authentication system fully functional
- Ready for email verification (if needed in future)
- Ready for admin user management features (Phase 2)
- IDOR prevention pattern established for all future features
- Token-based verification pattern ready for other flows

## Issues Encountered

None - all implementation went smoothly with existing schemas and infrastructure.

## User Setup Required

**Environment Variables (already configured):**
- `NEXTAUTH_URL=http://localhost:3000` (base URL for reset links)
- `DATABASE_URL=postgresql://...` (Prisma database)

**Prerequisites:**
- Docker containers running (Postgres on 5434)
- Prisma client generated
- Database schema includes VerificationToken model

## Testing Checklist

**Password Reset:**
- [ ] Visit `/reset-password`, enter email, see console log with token
- [ ] Visit logged token URL `/reset-password/{token}`
- [ ] Enter new password, submit
- [ ] Login with new password - succeeds
- [ ] Try same token again - shows error
- [ ] Request reset for non-existent email - same success message

**Profile Management:**
- [ ] Login and visit `/profile`
- [ ] See current name, email (read-only), role (read-only)
- [ ] Change name, submit, see success and updated name
- [ ] Change profile picture URL, see updated image reference
- [ ] Change password with correct current password - succeeds
- [ ] Change password with wrong current password - shows error
- [ ] Login with new password - succeeds
- [ ] Try changing password where new = current - shows error

## Self-Check: PASSED

All claimed files verified to exist:
- FOUND: apps/web/lib/email.ts
- FOUND: apps/web/app/(auth)/reset-password/page.tsx
- FOUND: apps/web/app/(auth)/reset-password/[token]/page.tsx
- FOUND: apps/web/app/(auth)/reset-password/actions.ts
- FOUND: apps/web/components/auth/reset-password-request-form.tsx
- FOUND: apps/web/components/auth/reset-password-form.tsx
- FOUND: apps/web/app/(dashboard)/profile/page.tsx
- FOUND: apps/web/app/(dashboard)/profile/actions.ts
- FOUND: apps/web/components/auth/profile-form.tsx
- FOUND: apps/web/components/auth/change-password-form.tsx

All claimed commits verified:
- FOUND: 73f4ba4 (Task 1)
- FOUND: 4fe0339 (Task 2)

Next.js build verification:
- PASSED: Build completed successfully
- Routes generated: /reset-password, /reset-password/[token], /profile
- All forms compiled without errors

---
*Phase: 01-foundation-authentication*
*Completed: 2026-02-15*
