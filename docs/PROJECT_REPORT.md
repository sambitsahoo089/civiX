# CiviX — Public Infrastructure Damage Reporting System
# Project Report

**Submitted by:** Sambit Sahoo (sambitsahoo089)
**Project:** Public Infrastructure Damage Reporting System — "CiviX"
**Repository:** https://github.com/sambitsahoo089/civiX
**Session:** 2026

---

# Declaration

I hereby declare that the project entitled **"CiviX — Public Infrastructure Damage Reporting System"** submitted is a record of original work carried out by me. The system described in this report is a functional web application, built, tested and deployment-verified as part of this project. This report has not been submitted elsewhere for any other degree or diploma.

---

# Abstract

Public infrastructure — roads, streetlights, water lines, footpaths and drains — degrades continuously, yet the process by which citizens report damage remains largely manual: phone calls to municipal offices, physical visits, or word of mouth. Such processes lack visual documentation, leave no accountability trail, and give citizens no way to follow the progress of a complaint. The result is slow repairs, avoidable safety hazards, and erosion of public trust.

**CiviX** is a citizen-centric web platform that addresses these gaps for Phase 1 of a larger civic-technology roadmap. Residents report infrastructure damage by submitting a geo-tagged photograph, an automatic map location, a category and a description. Reports flow into an authority dashboard where municipal staff acknowledge, assign and resolve them through a status workflow that the reporting citizen can track in real time. A distinctive second capability — **emergency reporting** — covers road/highway accidents, fire and medical emergencies: the citizen gets one-tap buttons that dial the police, ambulance or fire brigade helpline directly from the report form, and the fact that a service was informed is stamped onto the report. On the authority side, an emergency dispatch panel shows, per service, whether the citizen already called — suppressing duplicate dispatch — and lets the authority forward the complete report (photo, coordinates, address, description, reporter) to all three emergency services with one tap. Every notification is written to an auditable dispatch log.

The system is implemented as a single **Next.js 16 (App Router) + React 19** application styled with **Tailwind CSS v4**, backed by **MongoDB** through **Mongoose**, with credential authentication via **Auth.js (NextAuth v5)**, Leaflet/OpenStreetMap mapping, and a procedural three.js 3D city on the landing page. The application is fully responsive across phone, tablet, laptop and desktop form factors. Deployment targets **Render** (web service) with **MongoDB Atlas** (free-tier cluster); uploaded images are stored in **MongoDB GridFS** in production so they survive ephemeral hosting disks.

This report documents the problem analysis, requirements, architecture, data design, API design, user-interface design, implementation details, verification results, deployment procedure, and the roadmap for future phases.

**Keywords:** civic technology, GIS reporting, citizen participation, municipal workflows, Next.js, MongoDB, emergency dispatch, GridFS, responsive web.

---

# Table of Contents

1. **Introduction** — 1.1 Motivation · 1.2 Problem Statement · 1.3 Objectives · 1.4 Scope · 1.5 Report Organisation
2. **Literature Review & Existing Systems** — 2.1 Existing Approaches · 2.2 Comparative Analysis · 2.3 Lessons Carried into CiviX
3. **System Analysis** — 3.1 Feasibility Study · 3.2 Stakeholders & Personas · 3.3 High-Level User Flow
4. **Software Requirements Specification** — 4.1 Functional Requirements · 4.2 Non-Functional Requirements · 4.3 Hardware & Software Requirements
5. **Technology Stack** — 5.1 Stack Overview · 5.2 Justification of Choices · 5.3 Architecture Style
6. **System Design** — 6.1 System Architecture · 6.2 Data Flow Diagrams · 6.3 Use-Case View · 6.4 Database Design · 6.5 API Design · 6.6 Status Workflow Design · 6.7 Emergency Dispatch Design
7. **User Interface Design** — 7.1 Design System · 7.2 Page Inventory · 7.3 Responsive Strategy · 7.4 Accessibility & Motion
8. **Implementation** — 8.1 Project Structure · 8.2 Authentication & Roles · 8.3 Report Submission Pipeline · 8.4 Image Storage · 8.5 Emergency Call & Dispatch Pipeline · 8.6 Geolocation & Maps · 8.7 The 3D Hero & Visual Identity
9. **Testing & Verification** — 9.1 Test Strategy · 9.2 Functional Test Results · 9.3 Security Testing · 9.4 Responsive & Browser Verification · 9.5 Defects Found & Fixed
10. **Deployment** — 10.1 Deployment Architecture · 10.2 MongoDB Atlas Setup · 10.3 Render Web Service · 10.4 Environment Variables · 10.5 CI/CD & Operations
11. **Results & Discussion** — 11.1 Delivered Capabilities · 11.2 KPI Measurement · 11.3 Limitations
12. **Future Enhancements**
13. **Conclusion**
14. **References**

**Appendices** — A: Sample Data Schema · B: API Reference Tables · C: Environment Variables · D: Glossary

---

# Chapter 1 — Introduction

## 1.1 Motivation

Every city resident has encountered the same failure loop: a pothole opens on a commuter road, a streetlight dies over a pedestrian crossing, a water line starts leaking onto a footpath. The citizen's options are to phone a municipal office during working hours, physically visit a ward office, or hope a local representative notices. Each option fails in predictable ways:

- **No documentation.** A phone call produces no record of what was reported, when, or where.
- **No proof.** Without a geo-tagged photograph, disputes about the location or severity of damage are unresolvable.
- **No accountability.** Nobody owns the ticket, so nothing measures how long a repair took or whether it happened at all.
- **No visibility.** The citizen cannot see whether the complaint was even received, let alone progressed.

Meanwhile, genuine emergencies — a road accident, a fire, a medical crisis — add a second, more urgent failure mode: in the confusion of an emergency, a citizen may not have the correct helpline number at hand, and emergency services may be dispatched late or, worse, twice, because two agencies worked from unconnected reports.

CiviX was conceived to close both loops with a single, low-friction web platform: civic damage reporting with proof and tracking, and emergency reporting with direct one-tap helpline access and non-duplicating authority dispatch.

## 1.2 Problem Statement

> Design and implement a citizen-centric web platform that allows residents to report public infrastructure issues — such as potholes, broken streetlights, water leaks, damaged footpaths and open drains — using geo-tagged photos and location details, so that municipal authorities can track, prioritise and resolve issues efficiently; and additionally provide an emergency reporting mode for road/highway accidents, fire and medical emergencies in which citizens can inform police, ambulance and fire brigade helplines by one tap, with full de-duplication and auditability on the authority side.

## 1.3 Objectives

**Primary objectives**

1. Enable easy reporting of infrastructure damage through a guided form with category, description, photograph and map location.
2. Provide geo-tagged photographic proof so the location and severity of every report is verifiable.
3. Improve transparency in issue resolution through a citizen-visible status timeline.
4. Reduce response and repair time by replacing phone/visit workflows with a structured, prioritised queue.
5. Provide an authority dashboard for triage, status updates and emergency dispatch.

**Secondary objectives**

1. Promote active citizen participation by making a report take under a minute on a phone.
2. Support emergency categories (accident, fire, medical) with one-tap calls to police, ambulance and fire brigade helplines, with the citizen's calls recorded on the report.
3. Give authorities a dispatch panel that never re-sends a service the citizen already informed, and can forward the complete report to all three services in one action.
4. Maintain a complete, auditable dispatch log of every notification (who triggered it, when, via which channel, to whom).
5. Enable data-driven decisions by exposing operational KPIs (open/resolved counts, emergency volume, dispatch backlog).
6. Design for full responsiveness — the primary reporting device is a phone.

## 1.4 Scope

**In scope (Phase 1)**

- Web-based damage reporting (mobile-first, desktop-supported).
- Image upload with browser geolocation capture and interactive map placement.
- Issue status tracking with a citizen-visible timeline of changes.
- Authority dashboard with KPIs, filtering and the full issue workflow.
- Emergency categories with helpline call buttons and authority dispatch with de-duplication.
- Citizen self-registration and credential-based login for two roles.
- Deployment-ready build for Render + MongoDB Atlas.

**Out of scope (Phase 1)**

- Native mobile applications (a responsive web app covers phones).
- Automated AI-based damage detection or auto-categorisation.
- Public heatmaps and open-data dashboards.
- Multi-city tenancy and localisation.

## 1.5 Report Organisation

Chapter 2 reviews existing approaches and the lessons carried into the design. Chapter 3 analyses feasibility and stakeholders. Chapter 4 is the software requirements specification. Chapter 5 justifies the technology stack. Chapter 6 presents architecture, data flow, database and API design. Chapter 7 covers interface design and responsive strategy. Chapter 8 walks through implementation. Chapter 9 records testing and verification results, including defects found and fixed during development. Chapter 10 is the deployment guide as executed. Chapter 11 discusses results against objectives, Chapter 12 the future roadmap, and Chapter 13 concludes.

---

# Chapter 2 — Literature Review & Existing Systems

## 2.1 Existing Approaches

**Manual channels (phone calls, physical visits).** The default in most municipalities. Zero technology barrier, but no structured data, no proof, no tracking, and a per-report handling cost that grows linearly with call volume. Complaints live in registers and memory.

**Single-purpose helplines.** Many cities run a short-code hotline. This centralises intake but converts every report into a text transcript typed by an operator; location is verbally described, not geocoded; and the citizen remains blind to progress. Emergency-specific lines (police, fire, ambulance) solve urgency but are disconnected from civic repair workflows.

**National/state grievance portals.** Government grievance portals (CPGRAMS-style systems) accept complaints as tickets with categories and attachments. They add structure and SLA targets but are usually desktop-first and identity-heavy; photo-and-map intake on a phone is often an afterthought, and status updates lag the actual work.

**Civic-tech platforms.** Systems in the SeeClickFix / FixMyStreet family popularised photo-plus-map reporting and public visibility of reports. Their lessons: the submission flow must be extremely short, the map is the strongest location input, and public status display builds trust. However, most such platforms stop at "the report is visible" and do not integrate emergency-service dispatch at all.

**Emergency dispatch systems.** Professional CAD (computer-aided dispatch) systems used by emergency services are powerful but closed: citizens reach them only through call centres. The gap CiviX targets is the *first mile* — the sixty seconds between witnessing an emergency and the right services knowing about it — including the common real-world case where a citizen has already called one service and another agency then duplicates the dispatch.

## 2.2 Comparative Analysis

| Capability | Phone/visit | Helpline | Gov. portal | Civic apps | CAD | **CiviX** |
|---|---|---|---|---|---|---|
| Geo-tagged photo proof | ✗ | ✗ | Partial | ✓ | Internal | **✓ (one-tap)** |
| Structured status workflow | ✗ | ✗ | ✓ | ✓ | Internal | **✓ citizen-visible** |
| Citizen tracking of progress | ✗ | ✗ | Partial | ✓ | ✗ | **✓ timeline** |
| Emergency one-tap helpline calls | ✗ | ✓ (voice) | ✗ | ✗ | ✗ | **✓ from the form** |
| Citizen-call recorded for authorities | n/a | ✗ | ✗ | ✗ | Partial | **✓ stamped on report** |
| Duplicate-dispatch prevention | ✗ | ✗ | ✗ | ✗ | Internal | **✓ per-service suppression** |
| Authority KPI dashboard | ✗ | ✗ | Partial | Partial | ✓ | **✓** |
| Audit log of every dispatch | ✗ | ✗ | Partial | ✗ | ✓ | **✓** |
| Works on a low-end phone browser | ✓ | ✓ | ✗ | Partial | n/a | **✓ responsive** |

## 2.3 Lessons Carried into CiviX

1. **Submission speed decides participation.** The report form is a single page with camera capture, automatic geolocation and category chips; the median fields a citizen fills manually is two (category + description).
2. **The map is stronger than an address.** Leaflet with a draggable pin plus optional address text beats free-text location entry.
3. **Trust comes from visible status.** Every status change writes a timeline entry the reporter sees, with a note written by the authority.
4. **Emergency flows must not add friction.** Calling a service must be one tap from the very form the citizen is already filling; and the fact of the call must flow to authorities automatically.
5. **De-duplication is a feature, not a detail.** The authority panel suppresses forward buttons for services the citizen already informed — preventing the most common real-world dispatch failure.
6. **Every dispatch must be auditable.** Each call/forward writes an immutable log entry with recipients, message and per-channel status.

---

# Chapter 3 — System Analysis

## 3.1 Feasibility Study

**Technical feasibility.** The entire system is implementable with mature, free, open-source technologies: Next.js (React) for the app, MongoDB for data, Auth.js for login, Leaflet/OpenStreetMap for maps (no paid map API key), three.js for the landing hero. Browsers on even budget Android phones provide `navigator.geolocation`, camera capture via `<input type="file" accept="image/*" capture="environment">`, and `tel:` links for dialling. A free MongoDB Atlas M0 cluster comfortably holds the workload of a city pilot. Verdict: **feasible**.

**Economic feasibility.** Development used no paid services. Deployment runs on Render's free web-service tier and Atlas's free M0 tier — effectively **₹0/month at pilot scale**. The only escalation paths (more Atlas storage, paid Render instances, an email/SMS provider) are optional and scale with adoption. Verdict: **feasible**.

**Operational feasibility.** The citizen flow requires no training — it mirrors familiar consumer apps (photo + map + submit). The authority flow mirrors a standard ticketing dashboard. The project assumptions state a dedicated administrative team is available to manage and review content. Verdict: **feasible**.

**Schedule feasibility.** Phase 1 was deliberately scoped (no native apps, no AI) to fit an academic timeline. The delivered system matches that scope exactly, with the emergency-dispatch feature fully implemented. Verdict: **feasible**.

## 3.2 Stakeholders & Personas

| Stakeholder | Interest | CiviX feature serving them |
|---|---|---|
| **Citizen (reporter)** | Quick reporting, visible progress, safety | One-minute form, camera+GPS capture, status timeline, emergency call buttons |
| **Municipal authority** | Triage, prioritisation, accountability | Dashboard with KPIs, filters, status workflow, emergency dispatch panel |
| **Emergency services** | Fast, complete, non-duplicate information | Forwarded report includes photo, coordinates, address, description; de-duplication |
| **City administration** | Data-driven decisions, public trust | KPIs (open/resolved/emergency/dispatch backlog), audit logs |
| **Public works crews** (implicit) | Clear task list | Status notes and category filters on the dashboard |

**Persona — Rina, 34, commuter (citizen).** Notices a deepening pothole on her ride to work. Opens CiviX, taps *Report an issue*, picks *Potholes*, snaps one photo, submits. Geolocation and map pin are automatic. Two minutes later she shares the ticket in her neighbourhood group; that evening the timeline already shows *Acknowledged: logged in the repair queue.*

**Persona — Municipal engineer (authority).** Starts the day on the dashboard: 7 open, 4 emergency, 1 awaiting dispatch. A red banner identifies exactly which emergency still needs forwarding. Opens the accident report, sees the citizen already dialled Ambulance and Police from the form — those rows show *Citizen informed this service* with no button — and forwards the report to the remaining service with one tap. The full report goes out; the dispatch log records it.

## 3.3 High-Level User Flow

```
Citizen                    Platform                     Authority
  │  login / register          │                            │
  │──────────────────────────▶│                            │
  │  report issue (photo+GPS)  │                            │
  │  [emergency? tap helpline] │  store report + proofs     │
  │──────────────────────────▶│──────────────────────────▶ │
  │                            │  triage & assign           │
  │                            │◀────────────────────────── │
  │  track status timeline     │  status updates + notes    │
  │◀──────────────────────────│◀──────────────────────────  │
  │  (later) inform a service  │  dispatch log entry        │
  │──────────────────────────▶│                            │
  │                            │  forward to all services   │
  │                            │──────────────────────────▶ │ (helpline)
```

---

# Chapter 4 — Software Requirements Specification

## 4.1 Functional Requirements

**Authentication & users**

- **FR-1** The system shall register citizens with name, email, password; passwords stored as bcrypt hashes.
- **FR-2** The system shall authenticate users by credentials and issue JWT sessions (Auth.js).
- **FR-3** The system shall support two roles — `CITIZEN` and `AUTHORITY` — with route-level guards.
- **FR-4** Unauthenticated access to `/reports`, `/reports/new`, `/admin` shall redirect to `/login`.

**Reporting**

- **FR-5** The system shall accept a new report containing: category, description, photograph, latitude, longitude, and (optional) address.
- **FR-6** The system shall capture the browser's geolocation automatically and allow fine-tuning by dragging a map pin (Leaflet).
- **FR-7** The system shall accept images up to 5 MB in JPEG/PNG/WebP/GIF/HEIC/AVIF and reject other files with a clear message.
- **FR-8** The system shall store the uploaded image (local disk in dev; GridFS in production; Vercel Blob if configured) and reference it from the issue.
- **FR-9** Each report shall receive a unique identifier and a `REPORTED` status entry on creation.

**Emergency reporting**

- **FR-10** The categories *Road/highway accident*, *Fire/smoke* and *Medical emergency* shall be flagged emergency and unlock the emergency call panel.
- **FR-11** The emergency call panel shall present one-tap `tel:` buttons for the services relevant to the category (accident → police, ambulance, fire; fire → fire, ambulance, police; medical → ambulance, police).
- **FR-12** Tapping a service shall record `{service, by: CITIZEN, method: CALL, at}` in the issue's `notifiedServices` and write a `CITIZEN_CALL` entry to the alert log.
- **FR-13** The citizen shall be able to inform a service later from the issue page (post-report notification).
- **FR-14** Duplicate taps for the same service by the same actor shall be ignored gracefully.

**Authority workflow**

- **FR-15** The authority dashboard shall display KPIs: open, resolved, rejected, total, emergency count, and emergencies awaiting dispatch.
- **FR-16** The authority shall filter issues by status and category and open any issue's detail view.
- **FR-17** The authority shall move an issue through the workflow `REPORTED → ACKNOWLEDGED → IN_PROGRESS → RESOLVED` (or `REJECTED`) with a note per change.
- **FR-18** Each status change shall write a `StatusChange` record shown on the citizen-visible timeline.
- **FR-19** On an emergency issue, the authority shall see per-service state: *citizen informed (time)* or a **Forward** button — no button for services already informed by the citizen.
- **FR-20** Forwarding shall transmit the complete report (identifier, category, status, reporter, address, coordinates, map link, photo link, description) to the helpline phone and email for all services, mark them forwarded, and write an `AUTHORITY_FORWARD` log entry.
- **FR-21** A "forward to all remaining services" action shall dispatch once to each service not yet informed, and be idempotent on repeat.

**Tracking & transparency**

- **FR-22** The reporting citizen shall see the real-time status and full timeline of their reports.
- **FR-23** The issue page shall display the helpline dispatch log (who informed/forwarded which service, when, channel status).

**Robustness & UX**

- **FR-24** All forms shall validate client- and server-side with human-readable errors.
- **FR-25** The UI shall be fully responsive from 360 px phones to desktops.

## 4.2 Non-Functional Requirements

| ID | Category | Requirement | Implementation |
|---|---|---|---|
| NFR-1 | Performance | Warm page loads ≤ 0.5 s locally; submit→confirm < 2 s | Production build; indexed hot queries |
| NFR-2 | Scalability | Handle a city pilot (10k issues/yr) on free tiers | MongoDB M0 (512 MB) sufficient; stateless app |
| NFR-3 | Security | Passwords never stored in clear; role-guarded routes; no secrets in repo | bcrypt(10), Auth.js JWT, `.env` git-ignored |
| NFR-4 | Privacy | Location stored only for reported issues; minimal user data | Only email+name+hash per user |
| NFR-5 | Availability | Survives DB outages and reconnects | Retry-on-connect fix in the DB layer (verified) |
| NFR-6 | Usability | Report in < 1 minute on a phone; 44 px touch targets | Mobile-first CSS, sticky submit bar |
| NFR-7 | Accessibility | Reduced-motion support; semantic controls | `prefers-reduced-motion` disables animation |
| NFR-8 | Maintainability | Single-language JS codebase, documented modules | JSDoc, README, this report |
| NFR-9 | Portability | Deploys to Render/Vercel/AWS with only env changes | Config via env vars only |
| NFR-10 | Auditability | Every emergency notification logged immutably | `alertlogs` collection, per-channel status |

## 4.3 Hardware & Software Requirements

**Development machine (used):** Windows 10/11 PC, 8 GB RAM, Node.js ≥ 20.9 (v24 used), npm ≥ 10, Git; a browser with geolocation permission.

**Server (production):** any host running Node 20+ with 512 MB RAM — Render free tier (512 MB) suffices; MongoDB Atlas M0 (512 MB, shared) as the database.

**Client:** any modern browser (Chrome/Edge/Firefox/Safari, last ~3 years) on phone/tablet/desktop; geolocation and camera permissions enhance the flow, with graceful degradation when denied.

---

# Chapter 5 — Technology Stack

## 5.1 Stack Overview

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) + React | 16.3.4 / 19.2.8 |
| Language | JavaScript (ESM app + CommonJS scripts) | ES2022 |
| Styling | Tailwind CSS | 4.x |
| Database | MongoDB (Mongoose ODM) | 9.10.1 |
| Auth | Auth.js / NextAuth v5 (credentials, JWT) | 5.0.0-beta.32 |
| Maps | Leaflet + OpenStreetMap tiles | 1.9.4 |
| 3D/graphics | three.js (procedural low-poly city) | 0.186 |
| Uploads | Local disk (dev) / MongoDB GridFS / Vercel Blob | — |
| Password hashing | bcryptjs | 3.0.3 |
| Dev DB | mongodb-memory-server (real `mongod` binaries) | 11.2.0 |
| Hosting | Render (web service) | free tier |
| DB hosting | MongoDB Atlas M0 | free tier |

## 5.2 Justification of Choices

- **Next.js over separate SPA + API.** One codebase, one deploy, server-side routing, built-in API routes for the backend — the correct scale for a Phase 1 pilot, and it deploys identically to Render, Vercel or AWS.
- **MongoDB over relational.** Issues are document-shaped (nested `notifiedServices`, arrays of timeline changes); schema flexibility suits a Phase 1 product still evolving; Atlas provides a genuinely free managed cluster; GridFS solves production image storage without a second service.
- **Mongoose** for schema validation, hooks and indexing discipline at the data edge.
- **Auth.js v5** for standard credential auth with JWT sessions — no session store to operate, route guards are middleware-simple, and switching to OAuth later is configuration, not code.
- **Leaflet + OpenStreetMap** because they are free and keyless — no billing account, no quota anxiety, works on every phone browser.
- **Tailwind CSS v4** for a compact, consistent design system without a heavy component-library dependency.
- **three.js** for a memorable, on-brand landing hero rendered procedurally (no 3D asset licensing), with an SVG fallback when WebGL is unavailable.
- **mongodb-memory-server in dev** so a developer gets *real* MongoDB semantics locally with one command — no Docker, no services to install.

## 5.3 Architecture Style

A **modular monolith**: one Next.js application containing UI (App Router pages), backend (route handlers under `app/api/*`), and domain logic (`lib/*`) with clean separation — pages never touch Mongoose directly; they call route handlers, which call `lib` services, which talk to the database through a single connection module with retry-safe caching.

---

# Chapter 6 — System Design

## 6.1 System Architecture

```
+----------------------------- Browser (citizen / authority) -----------------------------+
|  React UI (App Router pages & client components)                                        |
|  forms, dashboards, timelines, map (Leaflet), 3D hero (three.js)                        |
+---------------+---------------------------------------------------------+---------------+
                | fetch (JSON / multipart)                                | <img src>
+---------------v---------------------------------------------------------v---------------+
| Next.js server (Render)                                                                  |
|  +-- API route handlers (app/api/*) ------------------------------------------------+   |
|  |  auth (login/register) - reports CRUD - status - notify - forward - files (GridFS)|   |
|  +----------------+-------------------------------------------+--------------------+   |
|                   |                                           |                        |
|   lib/auth (session, roles)                 lib/alerts (dispatch)                     |
|   lib/storage (disk | GridFS | Blob)        lib/services (helplines, categories)      |
|                                                                                         |
|  +-- lib/db: single Mongoose connection, retry-safe cache, dbName from env ---------+   |
+-----------------------------------------------------------------------------------------+
                  | mongodb+srv
        +---------v----------+                 +------------------------------+
        | MongoDB Atlas      |                 | External (optional)          |
        |  users             |                 |  Resend (alert email)        |
        |  issues            |                 |  SMS gateway webhook         |
        |  statuschanges     |                 |  Vercel Blob (images)        |
        |  alertlogs         |                 +------------------------------+
        |  uploads (GridFS)  |
        +--------------------+
```

## 6.2 Data Flow Diagrams

**DFD Level 0 (context).** Citizen → *reports, informs services* → CiviX → *timeline, status, dispatch log* → Citizen. CiviX → *structured reports, dispatch notices* → Authority. Authority → *status updates, forwards* → CiviX → *helpline phone/email* → Emergency services.

**DFD Level 1 (report lifecycle).**

```
[Citizen] --(report: photo, GPS, category, desc)--> (1.0 Submit report)
(1.0) --> store image --> [D1 issues]
(1.0) --(helpline taps)--> (2.0 Notify) --> [D2 alertlogs]
[Authority] --(status + note)--> (3.0 Update status) --> [D3 statuschanges] + [D1 issues.status]
(3.0) --(visibility)--> [Citizen timeline]
[Authority] --(forward)--> (4.0 Dispatch) --(skip informed services)--> [D2 alertlogs]
(4.0) --(report payload)--> (Emergency services: phone / email)
```

## 6.3 Use-Case View

Actors: **Guest**, **Citizen**, **Authority**.

- Guest: Register, Login, View landing/help pages.
- Citizen: Submit report *(extends: tap emergency helpline)*, Track own reports (timeline), Inform a service later.
- Authority: View dashboard KPIs, Filter/open issues, Update status with note, Forward emergency *(includes: view citizen-informed state, skip informed services)*, View dispatch log.

Key scenarios (from verification runs in Chapter 9):

- **Submit report (extension: emergency).** Citizen picks *Fire/smoke* → emergency panel appears → taps *Call Fire brigade* (dialler opens; tap recorded) → submits → report stored with `notifiedServices=[FIRE]`, alert-log entry written, dashboard shows the other two services as awaiting dispatch.
- **Forward emergency.** Authority opens the report → sees Fire marked *citizen informed* (no button) → taps *Forward to Police* → full payload dispatched to helpline phone + email → row flips to *forwarded by authority* → log entry written; pressing again returns `alreadyForwarded: true` (idempotent, no duplicate).

## 6.4 Database Design

Four collections (Mongoose models in `lib/models.js`) plus a GridFS bucket.

**users**

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | display name |
| `email` | String | **unique index** |
| `passwordHash` | String | bcrypt, cost 10 |
| `role` | String | `CITIZEN` \| `AUTHORITY` |

**issues**

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | ticket identifier |
| `category` | String | POTHOLES, STREETLIGHT, WATER_LEAK, FOOTPATH, OPEN_DRAIN, ACCIDENT, FIRE, MEDICAL, OTHER |
| `emergency` | Boolean | true for ACCIDENT / FIRE / MEDICAL |
| `description` | String | free text, required |
| `latitude` / `longitude` | Double | device GPS or map pin |
| `address` | String | optional human-readable location |
| `imageUrl` | String | `/uploads/…` (dev) · `/api/files/<gridfs-id>` (prod) · blob URL |
| `status` | String | REPORTED / ACKNOWLEDGED / IN_PROGRESS / RESOLVED / REJECTED |
| `reporter` | ObjectId → users | |
| `resolvedAt` | Date | stamped when status becomes RESOLVED |
| `notifiedServices[]` | `{service, by, method, at}` | citizen calls and authority forwards, append-only |
| `createdAt` | Date | queried with `status` for the dashboard queue |

**statuschanges** — `{issue→issues, fromStatus, toStatus, note, changedBy→users, createdAt}` — the citizen-visible timeline.

**alertlogs** — `{issue→issues, kind: CITIZEN_CALL|AUTHORITY_FORWARD, services[], triggeredBy, phone, email, channels:[{channel: SMS|EMAIL, status: SENT|SKIPPED|FAILED, detail}], message, createdBy→users, createdAt}` — the dispatch audit trail.

**uploads (GridFS bucket `uploads`)** — chunked file storage with `contentType` and original-name metadata for production images, streamed via `/api/files/[id]`.

**Relationships:** `users 1—* issues` (as reporter) · `issues 1—* statuschanges` · `issues 1—* alertlogs`. The append-only `notifiedServices` subdocuments hold the hot per-service state the dispatch panel renders without a join.

## 6.5 API Design

All endpoints return JSON; errors use `{error}` with an appropriate HTTP status. Full tables in Appendix B.

| Method & path | Role | Purpose |
|---|---|---|
| `POST /api/register` | public | citizen self-registration |
| `POST /api/auth/...` (Auth.js) | public | login / logout / session |
| `GET /api/reports` | citizen (own) / authority (all) | list with filters |
| `POST /api/reports` | citizen | create report (multipart) |
| `GET /api/reports/:id` | owner / authority | detail incl. timeline + log |
| `POST /api/reports/:id/status` | authority | workflow transition + note |
| `POST /api/reports/:id/notify` | owner / authority | record a helpline call |
| `POST /api/reports/:id/forward` | authority | dispatch to helplines (idempotent) |
| `GET /api/files/:id` | public | stream GridFS image |

## 6.6 Status Workflow Design

```
             +---------------- REJECTED (terminal)
             |
REPORTED --> ACKNOWLEDGED --> IN_PROGRESS --> RESOLVED (terminal; sets resolvedAt)
  (create)     logged in       crew assigned
               queue
```

Rules: transitions are forward-only except `→ REJECTED` from any state (with a reason); `RESOLVED` stamps `resolvedAt` — the clock for the resolution-time KPI; every transition requires a note, which is what makes the citizen-visible timeline trustworthy. Every transition writes a `StatusChange` row.

## 6.7 Emergency Dispatch Design

Per-service state lives on the issue (`notifiedServices`):

```
              citizen taps helpline (report form or issue page)
                                    |
   [no entry] -----------> INFORMED_BY_CITIZEN {by: CITIZEN, method: CALL, at}
      |                              |  authority panel: "Citizen informed this service - no action"
      |                              x  forward button SUPPRESSED for this service
      |
      +---- authority taps Forward ----> FORWARDED_BY_AUTHORITY {by: AUTHORITY, at}
                 payload: id, category, status, reporter, address, lat/lng,
                 map link, photo link, description
                 -> helpline PHONE + EMAIL (per-channel status recorded in alertlogs)
```

**De-duplication rules.** (1) A service already informed by the citizen never renders a forward button. (2) Repeat forwards return `alreadyForwarded: true` with no side effects. (3) "Forward to all remaining services" iterates only uninformed/unforwarded services. (4) Non-emergency categories reject notify/forward calls outright with a clear error.

---

# Chapter 7 — User Interface Design

## 7.1 Design System

- **Palette.** Navy (`#0f172a` family) surfaces and text, slate greys for structure, a single civic accent (safety orange/amber) for primary actions, and a dedicated **red emergency gradient** reserved for ACCIDENT/FIRE/MEDICAL surfaces — the two report classes can never be visually confused.
- **Type.** System font stack for zero-latency first paint; hierarchy via the Tailwind scale.
- **Components.** Category chips with per-category colour and emoji; status pills (REPORTED grey → ACKNOWLEDGED blue → IN_PROGRESS amber → RESOLVED green / REJECTED red); KPI cards; timeline rail; per-service dispatch rows; a shared `Logo` component (map-pin over roads + rail mark with an orange check) used in the navbar, login card and favicon.
- **Landing hero.** Dark layered gradient, animated gradient headline, procedural three.js low-poly city block with a pulsing red issue marker; drag-to-orbit and cursor parallax; SVG fallback without WebGL.

## 7.2 Page Inventory

| Route | Access | Purpose |
|---|---|---|
| `/` | public | landing: hero, how-it-works, stats, CTA |
| `/login` · `/register` | public | auth; login shows project-description card (left column ≥ 768 px, below the form on phones) |
| `/reports` | citizen | "my reports" list with status pills |
| `/reports/new` | citizen | report form + map + emergency panel |
| `/reports/[id]` | owner / authority | issue detail: photo, map, timeline, dispatch log, actions |
| `/admin` | authority | KPI dashboard, filters, emergency banner |
| `/help` | public | FAQ and helplines |

## 7.3 Responsive Strategy

Mobile-first Tailwind breakpoints; verified layouts at 360 px (phone), 768–1024 px (tablet) and 1440 px (desktop):

- **Phone:** single column; hamburger drawer navigation; the report form's submit bar sticks to the viewport bottom; login order is **form first, then description** (description follows the form in DOM order).
- **Tablet/desktop:** two-column login (description left, form right); dashboard KPIs in a multi-up grid; issue lists render as cards rather than wide tables.
- All interactive targets ≥ 44 px; the map and 3D scene re-frame adaptively per viewport.

## 7.4 Accessibility & Motion

`prefers-reduced-motion` disables the siren pulse, gradient animation and floating cards. Semantic buttons and labels throughout; colour is never the only signal (status always pairs text + icon + colour). Focus outlines preserved on custom widgets.

---

# Chapter 8 — Implementation

## 8.1 Project Structure

```
civiX/
|-- app/                    App Router: pages, layouts, API route handlers
|   |-- api/                auth, reports, register, files/[id]
|   |-- admin/ login/ register/ reports/ help/
|   |-- layout.js           root layout: navbar, footer, logo defs
|   `-- icon.svg            favicon
|-- components/             Navbar, MobileNav, ReportForm, MapView, IssueCard,
|                           AlertDispatchPanel, EmergencyCallPanel, Hero3D, Logo, ...
|-- lib/                    db.js, models.js, auth.js, storage.js, alerts.js,
|                           services.js (categories, helplines), utils
|-- scripts/                mongo-server.js (dev mongod), seed.js
|-- public/uploads/         dev-only image store (git-ignored)
|-- render.yaml             Render blueprint
`-- README.md               quickstart + deployment guide
```

## 8.2 Authentication & Roles

Auth.js v5 credentials provider; bcrypt hashes (cost 10) compared at sign-in; JWT session strategy so no server-side session store is needed; `AUTH_TRUST_HOST=true` for behind-proxy deployment. Role checks happen at two levels: page-level guards redirect unauthenticated users away from `/reports*` and `/admin`, and **every API handler re-verifies session and role server-side** — page guards are never the only gate. The authority account cannot be self-registered; it exists only via seeding.

## 8.3 Report Submission Pipeline

`POST /api/reports` (multipart): validate session → validate fields and category → `saveImage()` (mode chosen by environment: dev disk / GridFS / Blob) → `Issue.create` with `status: REPORTED` and a first `StatusChange` ("Issue reported by citizen") → return the new id; the client redirects to the issue page. Coordinates are re-validated server-side; malformed submissions are rejected with human-readable errors.

## 8.4 Image Storage (Local, GridFS, Blob)

`lib/storage.js` selects automatically:

1. `BLOB_READ_WRITE_TOKEN` present → **Vercel Blob** (serverless hosts).
2. `NODE_ENV=production` → **MongoDB GridFS** bucket `uploads`; the issue stores `/api/files/<id>`; a route handler streams bytes back with long-lived cache headers.
3. Otherwise → **local disk** `public/uploads` (development).

GridFS was chosen for Render because its free-tier disk is ephemeral: local writes would vanish on every deploy, while GridFS images live in the database, survive deploys, and need no additional service.

## 8.5 Emergency Call & Dispatch Pipeline

**Citizen call.** `EmergencyCallPanel` renders `tel:` anchors, one per relevant service. Tapping opens the dialler (so the call lands in the phone's call log) and posts to `/api/reports/:id/notify`, appending `{service, by: CITIZEN, method: CALL, at}` to `notifiedServices` and writing a `CITIZEN_CALL` alert-log entry. Repeats are ignored; non-emergency categories are rejected server-side.

**Authority forward.** `AlertDispatchPanel` renders per-service rows: informed services show *"Citizen informed this service on …"* with **no button**; others show *Forward*. `POST /api/reports/:id/forward` composes the complete report payload via `lib/services.js`; `lib/alerts.js` delivers SMS/email when providers are configured, or records `SKIPPED` channels otherwise (nothing is silently lost); all targeted services are marked forwarded; an `AUTHORITY_FORWARD` row is written to the log. A repeat forward returns `alreadyForwarded: true` with no duplicate dispatch.

**Helplines.** Phase 1 uses one shared phone (`8895465904`) and email (`comedydedanadan089@gmail.com`) for all three services, centralised in `lib/services.js` for later per-service replacement.

## 8.6 Geolocation & Maps

The form calls `navigator.geolocation.getCurrentPosition` on load; on success it fills latitude/longitude and renders a Leaflet map with a draggable pin and an accuracy circle; on refusal the map still allows manual pin placement. Address text is optional and free-form. The issue page reuses `MapView` read-only.

## 8.7 The 3D Hero & Visual Identity

`Hero3D` builds a procedural low-poly city block (roads with dashed centre lines, lit windows, a rail track) with a pulsing red issue marker, drag-to-orbit and cursor parallax, framed adaptively per viewport. It degrades to a static SVG city when WebGL is unavailable, and the whole animation stack honours `prefers-reduced-motion`.

---

# Chapter 9 — Testing & Verification

## 9.1 Test Strategy

Manual, scenario-driven testing against a **production build** (the same artefact deployed), plus scripted end-to-end HTTP flows for authentication and dispatch idempotency, and in-browser verification through an embedded preview (real clicks, real typing) at phone and desktop viewports.

## 9.2 Functional Test Results

| # | Scenario | Expected | Result |
|---|---|---|---|
| T-01 | Citizen register → login | session cookie, redirect to /reports | ✅ Pass |
| T-02 | Authority login | redirect to /admin, KPIs visible | ✅ Pass |
| T-03 | Guest opens /admin | redirect to /login | ✅ Pass |
| T-04 | Submit report (pothole, photo, GPS) | issue created, timeline has REPORTED | ✅ Pass |
| T-05 | Submit with 2 helpline taps | `emergency:true`, `notifiedServices:[FIRE,POLICE]` | ✅ Pass |
| T-06 | Emergency panel contents per category | accident→3 services, fire→3, medical→2 | ✅ Pass |
| T-07 | Fire report where citizen informed Fire | Fire row: "Citizen informed…", **no button**; others show Forward | ✅ Pass |
| T-08 | Click "Forward to Police" in browser | rows flip to "Forwarded by authority", 0 buttons remain | ✅ Pass (after fix D-4) |
| T-09 | Forward payload | phone 8895465904 + email for all three services | ✅ Pass |
| T-10 | Forward twice | second returns `alreadyForwarded: true`, no duplicate log | ✅ Pass |
| T-11 | Duplicate citizen tap of same service | no duplicate entry | ✅ Pass |
| T-12 | Notify on non-emergency issue | rejected with clear error | ✅ Pass |
| T-13 | Status transition with note | timeline entry visible to citizen | ✅ Pass |
| T-14 | Image > 5 MB | rejected with message | ✅ Pass |
| T-15 | Geolocation denied | map pin placement still works | ✅ Pass |

## 9.3 Security Testing

- Route guard: `/admin` unauthenticated → 307 to login; citizens cannot open another citizen's report.
- Password storage verified as bcrypt hashes in the database (never plaintext).
- Secrets: `.env*` git-ignored; the repository was scanned before push — no credentials committed.
- Server-side role re-verification on every mutating API call (not just page guards).

## 9.4 Responsive & Browser Verification

Verified at 360 / 463 / 490 px (phone), 768 / 1024 px (tablet) and 1440 px (desktop): mobile nav drawer, stacked hero, login column order switching at the `md` breakpoint, dashboard KPI grid reflow, sticky submit bar. Browser console clean (zero errors) across all pages.

## 9.5 Defects Found & Fixed

| ID | Defect | Root cause | Fix |
|---|---|---|---|
| D-1 | After any DB outage, every request failed until server restart | rejected connection promise cached permanently | retry-safe caching in `lib/db.js`; verified the running server self-reconnected |
| D-2 | Login failed with `error=Configuration` while the site loaded | dev database down / wrong port (27017 vs 5434 confusion) | documented in run-doc troubleshooting; DB-layer retry masks transient blips |
| D-3 | Logo mark invisible at tablet+ breakpoints | duplicate SVG gradient ids; first `<defs>` inside a `display:none` subtree | single shared `<LogoDefs/>` mounted once in the root layout |
| D-4 | Admin forward buttons stayed visible after dispatch | API response omitted `at` for newly forwarded entries | route returns stored records; panel re-renders from them |
| D-5 | Hero gradient showed a hard vertical seam | linear-gradient animation seam | layered radial glows |
| D-6 | WiredTiger crash of the dev database | DB files inside a cloud-synced (OneDrive) folder | dev data dir moved outside synced folders |
| D-7 | Scripted form fill wiped before submit | interactions landed before React hydration | test scripts wait for hydration markers (test-infra fix) |

---

# Chapter 10 — Deployment

## 10.1 Deployment Architecture

A single **Render Web Service** (Node runtime, free tier) serves the built Next.js application — frontend and API routes together — connected to **MongoDB Atlas M0** via `mongodb+srv`. Images persist in GridFS inside Atlas; optional external providers (Resend email, SMS webhook, Vercel Blob) are activated purely by environment variables. The repository lives at `https://github.com/sambitsahoo089/civiX` and a `render.yaml` blueprint encodes the service configuration for one-click provisioning.

## 10.2 MongoDB Atlas Setup

1. Create account → **Build a Database** → **M0 (Free)** — region Mumbai (ap-south-1).
2. **Database Access** → add user `civix_admin` with an autogenerated password, role *Read and write to any database*.
3. **Network Access** → *Allow access from anywhere* (`0.0.0.0/0`) — required because Render's free tier has no fixed egress IPs.
4. **Connect → Drivers** → copy the SRV string and insert the database name before the `?`:
   `mongodb+srv://civix_admin:<password>@civix-cluster.xxxxx.mongodb.net/civix?retryWrites=true&w=majority`
5. Optional pre-seed from a local machine:
   `MONGODB_URI="…" MONGODB_DB=civix SEED_FORCE=true npm run db:seed` — the seed refuses to run against a production database without the explicit `SEED_FORCE` flag.

## 10.3 Render Web Service

1. Sign in at render.com with GitHub → **New +** → **Web Service** → connect the `civiX` repository.
2. Configuration: Runtime **Node**, Region **Singapore**, Branch **main**, Build Command `npm ci && npm run build`, Start Command `npm run start`, Health Check Path `/`, Instance Type **Free**.
3. Add the environment variables from §10.4.
4. **Create Web Service** — the first build takes ~5–10 minutes; the service goes live at `https://civix-xxxx.onrender.com`. Every subsequent `git push` to `main` auto-deploys.

## 10.4 Environment Variables

| Key | Value | Notes |
|---|---|---|
| `MONGODB_URI` | Atlas SRV string incl. `/civix` | from §10.2 step 4 |
| `MONGODB_DB` | `civix` | database name |
| `AUTH_SECRET` | long random string | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | `true` | behind Render's proxy |
| `NODE_ENV` | `production` | selects GridFS image storage |
| `RESEND_API_KEY` *(optional)* | Resend API key | makes alert emails actually send |
| `ALERT_SMS_WEBHOOK_URL` *(optional)* | webhook URL | makes alert SMS actually send |
| `BLOB_READ_WRITE_TOKEN` *(optional)* | Vercel Blob token | overrides GridFS for image storage |

## 10.5 CI/CD & Operations

- **Continuous deployment:** push-to-`main` auto-deploys; `render.yaml` provisions identically-configured services.
- **Health & logs:** `GET /` is the health check; build and runtime logs are in Render's *Events*/*Logs* tabs.
- **Cold starts:** the free tier sleeps after ~15 min idle; the first request afterwards takes ~30–60 s. A free uptime monitor mitigates this.
- **Backups:** Atlas M0 includes basic snapshots; GridFS images are covered since they live in the same cluster.
- **Known trade-off:** the ephemeral free-tier disk is exactly why image storage was moved to GridFS in production (§8.4).

---

# Chapter 11 — Results & Discussion

## 11.1 Delivered Capabilities vs Objectives

| Objective (Chapter 1) | Delivered |
|---|---|
| Easy reporting | one-page form, camera capture, auto-GPS, map pin; median manual input: category + description |
| Geo-tagged proof | GPS coordinates + photograph on every issue; map on the detail page |
| Transparency | citizen-visible timeline of every status change with authority notes |
| Reduced repair time | structured queue with status/owner discipline replaces phone registers |
| Authority dashboard | KPIs (open/resolved/rejected/total/emergency/awaiting dispatch), filters, workflow |
| Emergency one-tap calls | `tel:` buttons per category; calls recorded on the report |
| Non-duplicating dispatch | per-service suppression; idempotent forward; audit log |
| Responsive design | verified phone → desktop layouts (Chapter 9) |
| Deployment-ready | pushed to GitHub; Atlas + Render procedure documented and scripted (`render.yaml`) |

Verification highlights (Chapter 9): citizen submission with two helpline taps stored correctly; a fire report with citizen-informed Fire brigade showed **no button** for Fire while the other services remained forwardable; repeat forward was a no-op; guest access to `/admin` was blocked; browser console clean on every page.

## 11.2 KPI Measurement

The schema natively supports the PRD's KPIs: **average resolution time** (`resolvedAt − createdAt`), **number of issues resolved** (`status = RESOLVED`), **repeated-issue rate** (same category within a radius — queryable), and **citizen satisfaction** is a Phase 2 addition (rating at resolution). The dashboard currently exposes the counts; time-series charts are Phase 2.

## 11.3 Limitations

- **Notification delivery is pluggable, not yet live:** without `RESEND_API_KEY` / `ALERT_SMS_WEBHOOK_URL`, dispatches are recorded as `SKIPPED` (fully auditable) rather than transmitted — an intentional Phase 1 behaviour so nothing is silently dropped.
- **Free-tier cold starts** on Render (sleep after idle).
- **Authority provisioning** is via seeding, not yet an admin workflow.
- **No public heatmap / open data** yet (Phase 2 per the PRD).
- **Single-language UI** (localisation is Phase 2).

---

# Chapter 12 — Future Enhancements

1. **Public heatmap** of open issues as an OSM overlay to drive civic participation.
2. **Native mobile app** with background location and push notifications.
3. **AI auto-categorisation** and duplicate detection from photo + text.
4. **Live notification providers:** Resend email, SMS gateway (Twilio/MSG91), WhatsApp Business API for status updates.
5. **SLA engine:** per-category deadlines, escalation and breach alerts on the dashboard.
6. **Citizen satisfaction rating** at RESOLVED — completes the KPI set.
7. **Multi-city tenancy** with ward-level role assignment and crew mobile views.
8. **OAuth login** (Google) and OTP phone login for low-friction onboarding.
9. **Offline-first submission** (service-worker queue) for low-network areas.
10. **Open-data export** (anonymised CSV/API) for researchers and journalists.

---

# Chapter 13 — Conclusion

CiviX demonstrates that the two hardest problems in civic reporting — **proof** and **follow-through** — can be solved with a carefully scoped web platform: geotagged photographic evidence removes ambiguity; a citizen-visible status timeline creates accountability; and the emergency mode adds genuine life-safety value by putting helpline access one tap away from the moment of reporting, while the authority-side dispatch panel eliminates the most common real-world failure — duplicate or missed agency notification — with simple, auditable per-service state.

The system is fully implemented and verified: both roles authenticate, reports flow end-to-end with photo and location proof, the workflow writes a trustworthy timeline, emergency calls and forwards behave exactly as specified with de-duplication, and the codebase builds cleanly and deploys to a zero-cost stack (Render + MongoDB Atlas). The architecture leaves clean seams for every Phase 2 ambition — heatmaps, AI categorisation, live notification providers and mobile apps — without rework.

---

# Chapter 14 — References

1. Next.js Documentation — https://nextjs.org/docs
2. React Documentation — https://react.dev
3. MongoDB Manual & GridFS — https://www.mongodb.com/docs/manual/
4. Mongoose ODM — https://mongoosejs.com/docs/
5. Auth.js (NextAuth v5) — https://authjs.dev
6. Tailwind CSS — https://tailwindcss.com/docs
7. Leaflet — https://leafletjs.com
8. OpenStreetMap — https://www.openstreetmap.org
9. three.js — https://threejs.org/docs
10. Render Documentation — https://render.com/docs
11. MongoDB Atlas Documentation — https://www.mongodb.com/docs/atlas/
12. MDN Web APIs: Geolocation — https://developer.mozilla.org/docs/Web/API/Geolocation_API
13. Provos, N. & Mazières, D. — *A Future-Adaptable Password Scheme (bcrypt)*, USENIX ATC 1999.
14. CPGRAMS — Government of India Public Grievance Portal — https://pgportal.gov.in

---

# Appendix A — Sample Data Schema (Seed)

Nine sample issues span every category and status (REPORTED, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, REJECTED), including three emergencies: an accident (no services informed), a fire (citizen informed Fire brigade), and a medical emergency (citizen informed Ambulance + Police). Seeding is idempotent and production-guarded (`SEED_FORCE` required outside development). Sample photographs are generated as category-coloured SVG placeholders at seed time.

# Appendix B — API Reference (Abridged)

| Endpoint | Body / Params | Success | Errors |
|---|---|---|---|
| `POST /api/register` | `{name, email, password}` | `{ok: true}` | 409 email taken · 400 validation |
| `POST /api/reports` | multipart: `category, description, photo, latitude, longitude, address?, notifiedServices?` | `{id}` | 400 validation/size · 401 unauthenticated |
| `POST /api/reports/:id/status` | `{toStatus, note}` | `{ok, change}` | 403 non-authority · 400 bad transition |
| `POST /api/reports/:id/notify` | `{service}` | `{ok, notified}` | 400 non-emergency · 401/403 |
| `POST /api/reports/:id/forward` | `{services?}` (default: all remaining) | `{ok, alreadyForwarded?, channels, recipients}` | 403 non-authority · 400 none remaining |
| `GET /api/files/:id` | — | image bytes (immutable cache) | 404 unknown id · 400 malformed id |

# Appendix C — Environment Variables (Local Development)

| Key | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:5434/?directConnection=true` | dev mongod started by `npm run db:start` |
| `MONGODB_DB` | `civix` | database name |
| `AUTH_SECRET` | set in `.env` | session signing |
| `AUTH_TRUST_HOST` | `true` | local proxy tolerance |
| `MONGO_DATA_DIR` | outside the repo | keeps WiredTiger off cloud-synced folders |

# Appendix D — Glossary

**Geo-tagging** — attaching geographic coordinates to a submission. · **GridFS** — MongoDB's specification for storing files larger than the document size limit by chunking them. · **SRV connection string** — Atlas's DNS-based `mongodb+srv://` connection format. · **Cold start** — the latency of waking a slept free-tier instance. · **Idempotency** — repeating an operation produces no additional effect. · **CAD** — Computer-Aided Dispatch, the systems used by emergency services. · **KPI** — Key Performance Indicator.

---

*End of report — CiviX: Public Infrastructure Damage Reporting System · © 2026 sambitsahoo089*

