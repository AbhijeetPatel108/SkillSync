# SkillSync Interview Guide

## 1. Project Overview

SkillSync is a React and Express student collaboration platform backed by MySQL. Authenticated users maintain public profiles, list skills they offer and want to learn, discover other active profiles, send collaboration requests, chat after acceptance, and review a collaboration partner.

The current implementation is a modular monorepo with a Vite React client and a CommonJS Express server. MySQL access uses a `mysql2/promise` connection pool and parameterized SQL. Project management is implemented as owner-managed projects with lifecycle status and associated skill names.

## 2. Problem Statement

Students need a focused way to find compatible collaborators based on skills and learning goals, establish a relationship through an explicit request, communicate privately after acceptance, and record feedback afterward.

## 3. Implemented Features

- Registration and login with bcryptjs password hashing.
- JWT bearer authentication with configurable expiration.
- Active-user checks on protected HTTP requests and Socket.IO connections.
- Public and private profile retrieval and profile updates.
- Up to 10 offered and 10 wanted skills per user.
- Skill discovery with search, name, category, level, location, sort, and pagination filters.
- Collaboration request states: pending, accepted, rejected, cancelled.
- Duplicate and self-request validation.
- Accepted-match chat with Socket.IO and persisted messages.
- Message history, rooms, unread counts, and read receipts.
- One review per reviewer per accepted match, rating aggregation, listing, and deletion.
- Project CRUD, search, lifecycle status, and associated skill names.
- Admin-only paginated user directory.
- Helmet, CORS, request-size limits, centralized error handling, and request logging outside production.

## 4. Architecture

```text
React page/component
  -> client service
  -> Axios instance and bearer-token interceptor
  -> Express route
  -> protect middleware
  -> controller
  -> mysql2 pool.execute(parameterized SQL)
  -> JSON response
  -> React state/UI
```

Socket chat follows a parallel path: the client sends Socket.IO events, `socketAuth` verifies the JWT and active user, and `socketHandler` validates match membership before reading or writing chat data.

## 5. Folder Structure

- `client/src/pages`: route-level screens for auth, dashboard, skills, matches, chat, profile, and reviews.
- `client/src/components`: reusable UI pieces grouped by feature.
- `client/src/services`: API calls for auth, users, skills, projects, matches, reviews, chat, and admin users.
- `client/src/api/axios.js`: shared Axios instance and auth interceptors.
- `client/src/context/AuthContext.jsx`: current authenticated user and auth actions.
- `server/app.js`: Express middleware and route registration.
- `server/index.js`: dotenv loading, MySQL startup check, HTTP server, Socket.IO setup.
- `server/routes`: HTTP endpoint declarations.
- `server/controllers`: validation, authorization checks, SQL operations, and response mapping.
- `server/middleware`: JWT protection, error handling, and 404 handling.
- `server/config`: database pool and constants.
- `server/socket`: Socket.IO authentication and event handlers.
- `server/utils`: pagination, error type, and reusable MySQL user/profile queries.
- `database/schema.sql`: relational schema.

## 6. Frontend Architecture

React Router provides route composition and protected routing. `AuthProvider` loads `/api/auth/me` when a token exists, stores the user in context, and clears an invalid token. Services call the shared Axios instance, which reads the bearer token from local storage and removes it after a 401 response.

The frontend uses response objects such as `response.data.user`, `response.data.users`, `response.data.matches`, and `response.data.reviews`. The Vite client currently points to `http://localhost:5000/api` in `client/src/api/axios.js`.

## 7. Backend Architecture

Express applies Helmet, CORS, JSON/form size limits, optional Morgan logging, route modules, a not-found handler, and a centralized error handler. Protected route modules apply `router.use(protect)`. Controllers use `pool.execute` with placeholders for values. Dynamic SQL fragments are limited to server-controlled table names, selected sort clauses, and field lists.

`server/models` was removed because it contained unreferenced Mongoose models left from the previous database design. The active application uses MySQL tables and SQL directly.

## 8. HTTP API List

All endpoints below are mounted below `/api`.

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/health` | No | Health response |
| POST | `/auth/register` | No | Create a user and return a JWT |
| POST | `/auth/login` | No | Verify credentials and return a JWT |
| GET | `/auth/me` | Yes | Return current user |
| POST | `/auth/logout` | Yes | Client-side logout acknowledgement |
| GET | `/users/profile` | Yes | Return current private profile |
| PUT | `/users/profile` | Yes | Update name, bio, location, or avatar |
| GET | `/users/:id` | Yes | Return a public profile |
| POST | `/users/skills/offered` | Yes | Add an offered skill |
| DELETE | `/users/skills/offered/:skillName` | Yes | Remove an offered skill |
| POST | `/users/skills/wanted` | Yes | Add a wanted skill |
| DELETE | `/users/skills/wanted/:skillName` | Yes | Remove a wanted skill |
| GET | `/skills` | Yes | Search and paginate public profiles |
| GET | `/matches/sent` | Yes | List sent requests by status |
| GET | `/matches/received` | Yes | List received requests by status |
| GET | `/matches/accepted` | Yes | List accepted matches |
| POST | `/matches` | Yes | Send or reopen a request |
| GET | `/matches/:id` | Yes | Get a participant's match |
| PATCH | `/matches/:id/accept` | Yes | Recipient accepts |
| PATCH | `/matches/:id/reject` | Yes | Recipient rejects |
| PATCH | `/matches/:id/cancel` | Yes | Sender cancels |
| GET | `/reviews/me` | Yes | Reviews received by current user |
| GET | `/reviews/given` | Yes | Reviews written by current user |
| GET | `/reviews/user/:id` | Yes | Reviews received by a user |
| POST | `/reviews` | Yes | Create a review for an accepted match |
| GET | `/reviews/:id` | Yes | Get one review |
| DELETE | `/reviews/:id` | Yes | Delete own review and recalculate stats |
| GET | `/projects` | Yes | Search and paginate projects |
| POST | `/projects` | Yes | Create an owned project |
| GET | `/projects/:id` | Yes | Get project details |
| PATCH | `/projects/:id` | Yes | Update an owned project |
| DELETE | `/projects/:id` | Yes | Delete an owned project |
| GET | `/admin/users` | Admin | Paginated user directory |
| GET | `/chat/rooms` | Yes | List accepted chat rooms |
| GET | `/chat/rooms/:matchId/messages` | Yes | Get paginated message history |
| PATCH | `/chat/rooms/:matchId/read` | Yes | Mark messages read |

## 9. MySQL Schema and Relationships

- `users`: identity, unique email, password hash, profile fields, role, active flag, login time, cached review statistics.
- `user_skill_offered`: offered skills owned by `users.id`.
- `user_skill_wanted`: wanted skills owned by `users.id`.
- `matches`: directed sender/receiver relationship and lifecycle status.
- `messages`: messages belonging to a match and sender.
- `message_read_by`: composite `(message_id, user_id)` read-receipt key.
- `reviews`: reviewer, reviewee, and match references with a rating and comment.
- `projects`: owner, title, description, lifecycle status, and timestamps.
- `project_skills`: project-owned skill names with a unique project/name constraint.

Foreign keys use InnoDB and cascading deletes. User email is unique. A review is unique per `(reviewer_id, match_id)`. Project skills are unique per project by name. The match table has a canonical unique pair key populated for pending and accepted rows, preventing active relationships in either direction. Ratings are constrained by controller validation to whole numbers from 1 through 5. The schema uses `BIGINT UNSIGNED` identifiers, `ENUM` status/role values, timestamps, and `utf8mb4`.

## 10. Authentication and Authorization

Registration validates required fields, normalizes email, hashes the password with bcryptjs cost 12, inserts `password_hash`, and signs a JWT. Login loads the user by normalized email, rejects inactive accounts, compares the supplied password with the hash, updates `last_login`, and signs a JWT with `id` and a default or configured seven-day expiration.

`protect` reads `Authorization: Bearer <token>`, verifies the JWT, reloads the active user from MySQL, and places the database user on `req.user`. This means a deactivated account is rejected even if its token has not expired. Controllers use `req.user.id` for ownership checks.

The `authorize(...roles)` middleware protects `/api/admin/users` with the `admin` role. Project mutations additionally enforce `projects.owner_id = req.user.id`; a normal user cannot update or delete another user's project by changing the URL ID. The `role` column is present and returned in private/auth responses.

## 11. Important SQL Patterns

- Profile search uses `EXISTS` subqueries over `user_skill_offered` to combine skill filters without duplicate user rows.
- Match lists join `matches` to sender and receiver users, then batch-load skills through `fetchUsersPublicMap`.
- Review lists join the reviewer or reviewee user and paginate with `LIMIT` and `OFFSET`.
- Review statistics use `AVG(rating)` and `COUNT(*)`, then update cached columns on `users`.
- Chat history joins messages to users and orders by creation time.
- Read receipts use `INSERT ... SELECT` plus `NOT EXISTS` and a composite primary key.

## 12. Indexing

The schema indexes user email, user location, `(role, is_active)`, skill ownership/name/category/level combinations, match sender/receiver/status access patterns, message match/time and sender/time, read-receipt user/message, and review reviewee/time, reviewer/time. These indexes correspond to actual lookup, join, filter, and ordering paths. They are not performance claims with measured benchmark results.

## 13. Collaboration Flow

1. An authenticated user searches `/api/skills` or `/api/projects`.
2. The client posts `receiverId` to `/api/matches`.
3. The controller rejects self-requests, inactive users, existing pending/accepted relationships, and invalid messages.
4. MySQL inserts a pending match or reopens the user's prior rejected/cancelled request.
5. The recipient sees `/api/matches/received` and accepts or rejects only as the recipient.
6. The sender can cancel only a pending request.
7. Both participants can access an accepted match and its chat room.

The controller checks duplicates in application code and the schema prevents duplicate active relationships in either direction through the canonical generated pair key.

## 14. Review Flow

A reviewer submits `revieweeId`, `matchId`, `rating`, and an optional comment. The controller requires an accepted match, verifies the caller is one of its participants, requires the other participant as reviewee, rejects self-review, and relies on the unique review key plus an explicit check for duplicate prevention. It inserts the review, recalculates the reviewee's average and count, and returns the joined review. Deletion is restricted to the original reviewer and recalculates the reviewee's cached statistics.

## 15. Security and Error Handling

Values are parameterized through `pool.execute`; SQL identifiers and ordering choices come from fixed server-side values. Password hashes are never sent in normal auth responses. JWT verification and active-user reload protect HTTP and Socket.IO paths. Match and chat operations verify participant identity. Helmet, CORS, body-size limits, and centralized errors reduce common operational risk.

In development, the error handler includes stack traces and logs errors; production responses omit stacks and Morgan logging is disabled. Logout is stateless: it returns success and the frontend removes the token. There is no server-side token blacklist.

## 16. Performance and Scalability

The pool has a ten-connection limit. Pagination caps page size at 50. Public profile skill loading is batched by user IDs rather than one skill query per user. Match list retrieval avoids duplicate database work. Chat room loading currently performs latest-message and unread-count queries per room, so that endpoint has an N+1 pattern at larger room counts. Socket online presence is process-local and does not scale across multiple server instances without shared state. Cached user review statistics can become stale if written outside the review controller.

## 17. Project Flow

1. The client submits a project title, description, status, and comma-separated skills to `POST /api/projects`.
2. The controller validates lengths, status values, and a maximum of ten unique skill names.
3. MySQL inserts the project with `owner_id` from the verified JWT identity, then inserts project skills with a foreign key.
4. `/api/projects` supports search, status/owner filters, deterministic ordering, and pagination.
5. `PATCH` and `DELETE` first enforce the project owner; deleting a project cascades to its skills.

## 18. Current Limitations and Honest Resume Notes

- Project management covers owned project records and skill associations, but there is no project membership or invitation workflow.
- RBAC currently demonstrates one admin-only read endpoint rather than a full moderation system.
- No automated test suite is present; `server/package.json` has a placeholder test script.
- The client hardcodes the API base URL instead of using a Vite environment variable.
- Client lint still reports React 19 effect/export-rule errors in existing pages/context, although the production build passes.
- The database connection was syntax-reviewed but requires a local MySQL instance and configured credentials for live verification.
- No measured query benchmark supports a numeric performance improvement claim.

## 19. Future Improvements

Add integration tests using a disposable MySQL database, move the client API URL to an environment variable, expand admin moderation only if required, replace room-level N+1 queries with batched queries, add token revocation/rotation, and add project membership only if collaboration scope requires it.

# Interview Questions

Each question includes a short answer and a deeper follow-up with its answer.

## Basic Project

1. **Question:** What problem does SkillSync solve?  
   **Short answer:** It helps students find collaborators based on skills and learning goals.  
   **Deeper follow-up:** What happens after a candidate is found?  
   **Follow-up answer:** The user sends a request, the recipient accepts it, they can chat, and either participant can later review the other.

2. **Question:** What is the technology stack?  
   **Short answer:** React, Vite, Express, Node.js, MySQL, JWT, bcryptjs, and Socket.IO.  
   **Deeper follow-up:** Why MySQL?  
   **Follow-up answer:** The domain has clear relationships among users, skills, matches, messages, and reviews, so foreign keys and joins fit naturally.

3. **Question:** What is the main request path?  
   **Short answer:** React service to Axios to Express route to controller to parameterized MySQL query.  
   **Deeper follow-up:** Where is response mapping done?  
   **Follow-up answer:** Controllers and SQL helper functions map snake_case database rows to frontend-friendly camelCase objects.

4. **Question:** What does project management include?  
    **Short answer:** Users can create, search, inspect, update, and delete owned projects with status and skill names.  
    **Deeper follow-up:** What is intentionally out of scope?  
    **Follow-up answer:** Project membership and invitations are not implemented.

## Architecture

5. **Question:** Why separate routes and controllers?  
   **Short answer:** Routes declare the HTTP contract; controllers own validation, authorization, SQL, and response behavior.  
   **Deeper follow-up:** What would go in a service layer?  
   **Follow-up answer:** Reusable domain operations and transactions could move there as the application grows.

6. **Question:** What does `app.js` do?  
   **Short answer:** It configures middleware, health, route mounting, 404 handling, and error handling.  
   **Deeper follow-up:** What does `index.js` add?  
   **Follow-up answer:** It loads configuration, checks MySQL, creates HTTP and Socket.IO servers, and starts listening.

7. **Question:** Why use a connection pool?  
   **Short answer:** It reuses a bounded set of MySQL connections and avoids opening a new connection per request.  
   **Deeper follow-up:** What is the configured limit?  
   **Follow-up answer:** Ten connections, with queued requests enabled.

8. **Question:** How does the client share authentication behavior?  
   **Short answer:** A single Axios instance adds the bearer token and clears it on HTTP 401.  
   **Deeper follow-up:** What does the server do beyond token verification?  
   **Follow-up answer:** It reloads the active user from MySQL, so deactivation takes effect immediately.

## React

9. **Question:** How is auth state represented in React?  
   **Short answer:** `AuthContext` stores the current user and loading state and exposes login, register, and logout actions.  
   **Deeper follow-up:** How is a persisted session restored?  
   **Follow-up answer:** The provider checks local storage and calls `/auth/me` before completing initial loading.

10. **Question:** How are protected pages handled?  
    **Short answer:** Route protection checks context auth/loading state before rendering nested application routes.  
    **Deeper follow-up:** Is that sufficient security?  
    **Follow-up answer:** No. It improves UX, but backend `protect` and ownership checks are the real security boundary.

11. **Question:** How does skill search work in the UI?  
    **Short answer:** Search and filter state is sent as query parameters to `/skills`, with pagination metadata rendered by the page.  
    **Deeper follow-up:** Where are allowed categories enforced?  
    **Follow-up answer:** The backend validates categories and levels against constants.

12. **Question:** How does the UI handle async states?  
    **Short answer:** Pages maintain loading, error, and data state and render dedicated states.  
    **Deeper follow-up:** What lint issue remains?  
    **Follow-up answer:** The current React lint rules flag several fetch calls initiated inside effects; the production build still succeeds.

13. **Question:** Why use an Axios interceptor?  
    **Short answer:** It centralizes token attachment and unauthorized-session cleanup.  
    **Deeper follow-up:** What is the limitation of local storage?  
    **Follow-up answer:** A token accessible to JavaScript can be exposed by an XSS vulnerability; an HttpOnly cookie design would reduce that risk.

14. **Question:** What does React not enforce?  
    **Short answer:** React does not enforce authorization or data ownership.  
    **Deeper follow-up:** Where must those checks live?  
    **Follow-up answer:** In backend middleware and controllers, using the authenticated database identity.

## Node.js and Express

15. **Question:** How are async controller errors handled?  
    **Short answer:** The Express 5 application forwards rejected async handlers to the centralized error middleware.  
    **Deeper follow-up:** What does the error handler return?  
    **Follow-up answer:** A consistent `{ success: false, message }` response, with development-only stack information.

16. **Question:** Why use `express.json({ limit: '10kb' })`?  
    **Short answer:** It bounds request body size and reduces accidental or abusive oversized payloads.  
    **Deeper follow-up:** Is it validation by itself?  
    **Follow-up answer:** No. Controllers still validate field types, lengths, enum values, and relationships.

17. **Question:** What does Helmet provide?  
    **Short answer:** It sets common HTTP security headers.  
    **Deeper follow-up:** Does Helmet prevent SQL injection?  
    **Follow-up answer:** No; parameterized SQL and input handling address that risk.

18. **Question:** How is CORS configured?  
    **Short answer:** It allows the configured client origin, defaulting to localhost:5173, with credentials enabled.  
    **Deeper follow-up:** What should production do?  
    **Follow-up answer:** Set an explicit trusted origin and avoid broad origin reflection.

19. **Question:** What is the health endpoint useful for?  
    **Short answer:** It provides a lightweight API liveness response.  
    **Deeper follow-up:** Does it prove MySQL is healthy?  
    **Follow-up answer:** Not by itself; startup checks MySQL, but the endpoint does not run a database probe.

20. **Question:** Why keep request logic in controllers?  
    **Short answer:** This project is small enough that controllers remain understandable and close to route behavior.  
    **Deeper follow-up:** When would you refactor?  
    **Follow-up answer:** When transactions, reuse, or controller size make a domain service layer valuable.

## MySQL and SQL

21. **Question:** What enforces user identity uniqueness?  
    **Short answer:** `users.email` has a unique key, and registration also checks before insert.  
    **Deeper follow-up:** Why keep the database constraint?  
    **Follow-up answer:** It remains authoritative under concurrent requests; the controller check only improves the normal error message.

22. **Question:** Why use foreign keys?  
    **Short answer:** They prevent orphaned skills, matches, messages, receipts, and reviews.  
    **Deeper follow-up:** What happens when a user is deleted?  
    **Follow-up answer:** Related rows cascade because the schema uses `ON DELETE CASCADE`.

23. **Question:** How is SQL injection avoided?  
    **Short answer:** User values are passed as `?` parameters to `pool.execute`.  
    **Deeper follow-up:** Are all SQL fragments parameterized?  
    **Follow-up answer:** Values are; dynamic identifiers and ordering are selected from fixed internal allowlists.

24. **Question:** Why use `EXISTS` in skill search?  
    **Short answer:** It tests whether a matching skill exists without multiplying user rows through a join.  
    **Deeper follow-up:** What is still loaded afterward?  
    **Follow-up answer:** Matching profile IDs are loaded, then skills are batch-loaded for those IDs.

25. **Question:** What is a composite primary key used for?  
    **Short answer:** `message_read_by(message_id, user_id)` ensures one read receipt per user/message pair.  
    **Deeper follow-up:** Why is that better than a surrogate-only key?  
    **Follow-up answer:** The business uniqueness rule is represented directly and duplicate inserts become harmless.

26. **Question:** How are reviews aggregated?  
    **Short answer:** `AVG` and `COUNT` over a reviewee's reviews update cached columns on `users`.  
    **Deeper follow-up:** Why cache aggregates?  
    **Follow-up answer:** Profile and list reads can return rating summaries without recalculating every review each time.

27. **Question:** What indexes matter most for search?  
    **Short answer:** User location, skill name/category/level, and ownership/category/level composite indexes support filters.  
    **Deeper follow-up:** Does a `%term%` LIKE search always use an index efficiently?  
    **Follow-up answer:** Not necessarily; leading wildcards often require a different search strategy at scale.

28. **Question:** What transaction issue remains?  
    **Short answer:** Multi-step match duplicate checks and insertion are not one transaction.  
    **Deeper follow-up:** What would improve it?  
    **Follow-up answer:** A canonical pair model with a unique constraint or a transaction with locking would close concurrent opposite-direction races.

29. **Question:** What is the N+1 risk?  
    **Short answer:** Chat room listing queries latest message and unread count separately for each room.  
    **Deeper follow-up:** How would you improve it?  
    **Follow-up answer:** Use grouped subqueries or window functions to batch latest messages and unread counts.

30. **Question:** Why use InnoDB?  
    **Short answer:** It supports foreign keys and transactional behavior required by the relational model.  
    **Deeper follow-up:** What does an index not guarantee?  
    **Follow-up answer:** It does not guarantee a faster query; the query plan and data distribution still need measurement.

## Authentication, JWT, and bcrypt

31. **Question:** What is stored instead of a password?  
    **Short answer:** A bcrypt hash is stored in `users.password_hash`.  
    **Deeper follow-up:** What cost is used?  
    **Follow-up answer:** Twelve bcrypt salt rounds.

32. **Question:** What does the JWT contain?  
    **Short answer:** It contains the user ID and an expiration.  
    **Deeper follow-up:** Why reload the user from MySQL?  
    **Follow-up answer:** It validates that the account still exists and is active and supplies current role data.

33. **Question:** What happens when a JWT expires?  
    **Short answer:** `jsonwebtoken` throws a token-expired error, which becomes a 401 response.  
    **Deeper follow-up:** What does the client do?  
    **Follow-up answer:** The Axios response interceptor removes the token.

34. **Question:** Why normalize email?  
    **Short answer:** Registration and login lower-case and trim email before querying.  
    **Deeper follow-up:** What is the database role?  
    **Follow-up answer:** The unique key remains the final protection against duplicate accounts.

35. **Question:** Is logout stateful?  
    **Short answer:** No. The endpoint acknowledges logout and the client removes its token.  
    **Deeper follow-up:** What security feature is absent?  
    **Follow-up answer:** There is no token blacklist or refresh-token revocation mechanism.

36. **Question:** Why is bcrypt appropriate?  
    **Short answer:** It is a salted, intentionally expensive password hashing algorithm.  
    **Deeper follow-up:** Why not encrypt passwords?  
    **Follow-up answer:** Password verification needs one-way hashing; encryption would create a recoverable secret.

## Authorization and REST

37. **Question:** How is match ownership checked?  
    **Short answer:** Controllers compare `req.user.id` with sender or receiver IDs before viewing or changing a match.  
    **Deeper follow-up:** Who can accept?  
    **Follow-up answer:** Only the receiver, and only while the state is pending.

38. **Question:** Who can delete a review?  
    **Short answer:** Only the reviewer who created it.  
    **Deeper follow-up:** Can a user review an arbitrary account?  
    **Follow-up answer:** No; the controller requires an accepted match and the other participant as reviewee.

39. **Question:** Is there real RBAC?  
    **Short answer:** Yes, `/api/admin/users` uses `protect` and `authorize('admin')`; project ownership is separately enforced by controllers.  
    **Deeper follow-up:** What is the limitation?  
    **Follow-up answer:** The admin surface is a focused user directory rather than a full moderation system.

40. **Question:** Why are status transitions checked server-side?  
    **Short answer:** Clients cannot be trusted to enforce workflow state.  
    **Deeper follow-up:** What happens if a request is already accepted?  
    **Follow-up answer:** Accept, reject, or cancel returns a 400 instead of mutating an invalid state.

41. **Question:** Why return HTTP 409 for duplicates?  
    **Short answer:** Conflict communicates that the request is valid structurally but conflicts with current state.  
    **Deeper follow-up:** What also protects duplicate reviews?  
    **Follow-up answer:** The MySQL unique key `uq_reviews_reviewer_match`.

42. **Question:** Why use PATCH for accept/reject/cancel?  
    **Short answer:** These operations partially update the match resource's status.  
    **Deeper follow-up:** Why use PUT for profile updates?  
    **Follow-up answer:** The profile endpoint treats the submitted allowed fields as the replacement update set for those editable fields.

## Security, Performance, and Scalability

43. **Question:** What sensitive data is excluded from public profiles?  
    **Short answer:** Email, role, active flag, login time, and password hash are excluded from public profile mappings.  
    **Deeper follow-up:** Which response includes email?  
    **Follow-up answer:** Auth and the authenticated user's private profile responses.

44. **Question:** What does Socket.IO authentication do?  
    **Short answer:** It verifies the JWT and reloads an active user before connection.  
    **Deeper follow-up:** Does every event authorize access?  
    **Follow-up answer:** Join, send, and read operations validate match membership; typing events are lighter and should be hardened further for production.

45. **Question:** What is the biggest scaling concern?  
    **Short answer:** Process-local online presence and per-room chat queries do not scale cleanly across instances.  
    **Deeper follow-up:** What infrastructure would help?  
    **Follow-up answer:** Shared Socket.IO adapter/state, a load balancer with suitable session handling, and batched SQL queries.

46. **Question:** Why cap pagination?  
    **Short answer:** It prevents an unbounded result request from consuming excessive memory or database time.  
    **Deeper follow-up:** What is the maximum?  
    **Follow-up answer:** Fifty rows per request.

47. **Question:** What is the CORS production concern?  
    **Short answer:** The configured client origin must be explicit and trusted.  
    **Deeper follow-up:** Why are credentials enabled?  
    **Follow-up answer:** The configuration supports credentialed browser requests, although the current auth token is sent in an Authorization header.

48. **Question:** What security concern exists with localStorage JWTs?  
    **Short answer:** JavaScript-accessible tokens are exposed if the application suffers XSS.  
    **Deeper follow-up:** What alternative would you consider?  
    **Follow-up answer:** Short-lived access tokens with rotated refresh tokens in HttpOnly, Secure, SameSite cookies.

## Debugging and Design Decisions

49. **Question:** How would you debug a 401 from `/users/profile`?  
    **Short answer:** Check local storage, the Authorization header, JWT secret/configuration, expiration, and the active-user query.  
    **Deeper follow-up:** What should be checked before changing code?  
    **Follow-up answer:** The server logs, browser network request, token payload/expiry, and database account active flag.

50. **Question:** How would you debug a failed match insert?  
    **Short answer:** Inspect request payload, authenticated user ID, receiver state, current match statuses, and MySQL error code.  
    **Deeper follow-up:** What would a duplicate error mean?  
    **Follow-up answer:** It may indicate an existing same-direction status row or a race that the database constraint caught.

51. **Question:** Why keep cached rating columns?  
    **Short answer:** They make common profile reads inexpensive.  
    **Deeper follow-up:** What tradeoff does that create?  
    **Follow-up answer:** Writes must recalculate reliably, or cached values can drift from the reviews table.

52. **Question:** Why remove the old model files?  
    **Short answer:** They were unreferenced Mongoose code after the MySQL migration and could mislead maintainers.  
    **Deeper follow-up:** What proves they were safe to remove?  
    **Follow-up answer:** No active imports existed and Mongoose was not an installed server dependency.

53. **Question:** Why use helper functions such as `fetchUsersPublicMap`?  
    **Short answer:** They centralize public-user serialization and batch related skill loading.  
    **Deeper follow-up:** What bug can helpers prevent?  
    **Follow-up answer:** They reduce inconsistent exposure of private fields across match, review, and profile responses.

54. **Question:** What would you test first?  
    **Short answer:** Registration/login, protected access, request transitions, review authorization, and accepted-chat access.  
    **Deeper follow-up:** What test type is missing?  
    **Follow-up answer:** Automated integration tests against a real or disposable MySQL database.

55. **Question:** What does the current build validation prove?  
    **Short answer:** The client production bundle compiles, and active server JavaScript passes syntax checks.  
    **Deeper follow-up:** What does it not prove?  
    **Follow-up answer:** It does not prove live MySQL credentials, browser integration, or end-to-end behavior.

56. **Question:** How is project ownership enforced?  
    **Short answer:** The server derives `owner_id` from `req.user.id` on create and checks it before update/delete.  
    **Deeper follow-up:** Why is the frontend owner check insufficient?  
    **Follow-up answer:** A caller can bypass React and send an HTTP request directly, so the controller must enforce ownership.

57. **Question:** How are duplicate active requests prevented?  
    **Short answer:** The controller computes an unordered `minId:maxId` pair key and MySQL enforces it with a unique index for active rows.  
    **Deeper follow-up:** Why keep application checks too?  
    **Follow-up answer:** They provide clear conflict messages during normal requests, while the database constraint protects concurrent inserts.

58. **Question:** How would you improve deployment configuration?  
    **Short answer:** Use environment variables for the client API origin, database credentials, JWT secret, and allowed origin.  
    **Deeper follow-up:** What must never be committed?  
    **Follow-up answer:** Real secrets, passwords, tokens, or production credentials.

59. **Question:** What is one honest performance statement?  
    **Short answer:** The schema has indexes aligned with common joins and filters, and the API paginates results.  
    **Deeper follow-up:** Can you claim a percentage improvement?  
    **Follow-up answer:** No, not without benchmark data; the code supports an optimization approach, not a measured number.

60. **Question:** What would you tell an interviewer about the current state?  
    **Short answer:** The MySQL migration is active, the main collaboration workflow is implemented, and several production-hardening improvements remain.  
    **Deeper follow-up:** What improvements are highest priority?  
    **Follow-up answer:** Integration tests, explicit admin authorization or removal of unused RBAC scaffolding, environment-based client configuration, and transactional match consistency.
