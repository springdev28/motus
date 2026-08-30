# Motus MVP Delivery Plan

Status: Draft v0.1  
Planning basis: Motus Product Concept & Platform Specification  
Primary audience: Product, design, and engineering

## 1. MVP outcome

The MVP should prove Motus's unique value before expanding into a full comic platform:

> A creator can assemble a short vertical-scroll comic from layered assets, add simple editable motion with visual blocks, publish it, and share a reader experience that preserves that motion.

The first validated loop is:

**Create → Preview → Publish → Read → Update**

Following, communities, discovery, and monetization should build on this loop after it is reliable.

## 2. Working assumptions

- The first editor is desktop web; the published reader is responsive.
- The only MVP format is vertical scroll.
- The MVP hierarchy is `Work → Chapter → Scene → Element`.
- A scene is a fixed composition region within a vertical chapter.
- Source projects remain editable; every publication creates an immutable revision.
- Public and private are the only initial visibility modes.
- Motion is stored as structured, versioned instructions rather than rendered video.
- Initial targets in this plan are hypotheses to validate during a private alpha.

## 3. Scope

### In scope

**Account and projects**

- Sign up, sign in, sign out, and account recovery
- Create, rename, save, load, and delete a draft work
- Minimal creator profile: display name, avatar, and published works

**Studio**

- Create chapters and vertically ordered scenes
- Upload PNG and WebP assets with transparency
- Add text and basic speech bubbles
- Move, resize, rotate, reorder, lock, hide, and change opacity
- Autosave and explicit save state
- Undo and redo for editor operations
- Preview the current scene or chapter

**Animation blocks**

- One initial event: `when scene enters viewport`
- Actions: move, scale, rotate, and change opacity
- Timing: duration, delay/wait, easing, and sequential execution
- Looping is limited to a safe, explicit preset if it can be implemented without delaying publication
- Blocks compile into a versioned animation instruction format used by preview and reader playback

**Publishing and reader**

- Title, description, cover, basic tags, language, and content rating
- Public or private visibility
- Publish a chapter and publish an updated revision
- Responsive vertical-scroll reader
- Stable share URL for public works
- Playback parity between preview and published reader
- Minimal reporting route and moderation hold for public content

### Out of scope

- Page, spread, hybrid, and motion-first formats
- Communities, community archives, chat, posts, and roles
- Following, friends, comments, notifications, and recommendations
- Advanced search and canonical tag administration
- Audio, video, camera blocks, parallax, masks, and custom logic
- Advanced keyframe timeline and block/keyframe round-trip editing
- Collaborative editing, PSD import, and responsive authoring constraints
- Fanwork relationships, monetization, advertising, and marketplaces
- Native mobile editing applications

## 4. Product success criteria

### Alpha usability targets

- At least 5 of 8 invited creators publish a two-scene motion comic without direct assistance.
- Median time from new project to first successful publication is under 30 minutes.
- At least 6 of 8 creators can revise an animation and publish an update without losing prior work.
- Preview and published playback produce the same final element state in all acceptance fixtures.

### Reliability and performance targets

- No acknowledged edit is lost during normal autosave, refresh, and reload testing.
- Published revisions are immutable and can be rolled back by an operator.
- Reader p75 Largest Contentful Paint is under 2.5 seconds on the agreed test device and network profile for the reference comic.
- Editor interactions maintain 30 frames per second or better on the agreed reference project.
- Automated tests cover serialization, animation compilation, access checks, and publication revision creation.

These targets must be revised after the reference project, target devices, and alpha cohort are defined.

## 5. Milestones and exit gates

### Milestone 0 — Product and technical decisions

Deliverables:

- Creator journey and low-fidelity editor/reader prototype
- Reference comic defining maximum MVP complexity
- Version 0 animation instruction schema
- System context diagram and data model
- Architecture decision records for rendering, persistence, authentication, and media storage
- Browser, device, accessibility, and performance support matrix

Exit gate:

- The team can describe the complete create-to-read flow, serialize it without ambiguity, and test it with one reference comic.

### Milestone 1 — Project foundation

Deliverables:

- Application shell, environments, continuous integration, and deployment path
- Authentication and minimal creator profile
- Draft work, chapter, and scene persistence
- Asset upload pipeline with validation and storage limits
- Observability baseline: errors, structured logs, and core product events

Exit gate:

- A signed-in creator can create a work, upload a safe asset, reload, and recover the same draft.

### Milestone 2 — Static comic studio

Deliverables:

- Scene canvas and vertical chapter ordering
- Element selection and transform controls
- Layer ordering, lock, hide, opacity, text, and speech bubbles
- Undo, redo, autosave state, and draft recovery

Exit gate:

- The reference comic can be recreated as a static project and survives save/load without visual or ordering drift.

### Milestone 3 — Animation system

Deliverables:

- Block editor for the MVP event, actions, and timing controls
- Deterministic compiler from blocks to animation instructions
- Shared playback runtime for studio preview and reader
- Schema migration boundary and validation errors for unsupported instructions

Exit gate:

- Golden fixtures produce deterministic playback in preview and reader, including refresh and repeat playback.

### Milestone 4 — Publication and reader

Deliverables:

- Metadata, cover, visibility, and content rating workflow
- Immutable publication revisions and stable public URLs
- Responsive reader with viewport-triggered playback
- Update publication flow and operator rollback
- Minimum public-content reporting and moderation hold

Exit gate:

- A creator can publish, share, update, and recover the reference comic while private content remains inaccessible to unauthorized users.

### Milestone 5 — Private alpha

Deliverables:

- Accessibility pass for keyboard operation, focus, labels, contrast, and reduced motion
- Performance and failure-recovery testing against the reference project
- Security review of authentication, authorization, uploads, and published assets
- Usability sessions with the initial creator cohort
- Prioritized alpha findings and go/no-go decision for public beta

Exit gate:

- Product and reliability targets are met or have explicit owners and accepted exceptions.

## 6. Core domain model

| Entity | MVP responsibility |
| --- | --- |
| User | Authentication identity and ownership boundary |
| Profile | Public creator identity |
| Work | Editable project and publication metadata |
| Chapter | Ordered container of scenes |
| Scene | Fixed composition region in a vertical chapter |
| Element | Renderable object with transform and layer properties |
| Asset | Validated uploaded media and derived variants |
| AnimationScript | Versioned animation program attached to an element |
| AnimationBlock | Editable event, action, or timing node |
| PublicationRevision | Immutable reader-ready snapshot |
| AccessRule | Visibility decision for a work or revision |
| ContentReport | Minimum public-content reporting record |

The detailed schema must define IDs, ownership, cardinality, ordering, lifecycle state, timestamps, soft deletion, publication snapshot behavior, and authorization rules before implementation begins.

## 7. Animation contract to specify

The version 0 instruction format must answer:

- How events, actions, delays, easing, and ordering are represented
- Which coordinate system and units are canonical
- Whether values are absolute, relative, or both
- How parallel and sequential execution compose
- How invalid cycles, negative durations, and unsupported blocks fail
- What final state remains after playback
- How repeated viewport entry behaves
- How reduced-motion preferences affect playback
- How schemas are versioned and migrated
- How preview and reader prove they use equivalent runtime semantics

Golden JSON fixtures and expected frame/state outputs should be committed before the animation UI is considered complete.

## 8. Minimum trust, safety, and security requirements

- Enforce authorization on every draft, asset, and publication read or mutation.
- Treat private publication and asset URLs as inaccessible without authorization, not merely hidden from navigation.
- Validate file type, decoded content, dimensions, and size; scan uploads before publication.
- Define content-rating behavior and prevent adult-rated content from being shown without the required age policy.
- Provide reporting, moderation hold, audit records, and an operator escalation path before public uploads are enabled.
- Define copyright/takedown handling before enabling fanworks or a public catalog.
- Apply rate limits to authentication, uploads, publication, and public reader endpoints.
- Establish retention and deletion behavior for drafts, assets, reports, and publication revisions.
- Record security-relevant events without logging private comic content or credentials.

## 9. Main risks

| Risk | Early mitigation |
| --- | --- |
| Editor scope overwhelms the first release | Keep one format, one trigger, four actions, and one runtime |
| Preview differs from published playback | Share the schema, compiler, fixtures, and runtime semantics |
| Text and asset rendering varies by browser | Define a support matrix and reference fixtures early |
| Autosave corrupts or overwrites work | Use revisions, idempotent writes, conflict detection, and recovery tests |
| Public user-generated content launches without controls | Start with a private alpha and require minimum reporting/moderation gates |
| Animation schema becomes impossible to evolve | Version every script and test migrations from the first schema |
| Private works leak through asset delivery | Design authorization and signed delivery at the storage boundary |

## 10. Decisions required before scaffolding

1. Which rendering approach best supports selection, transforms, text, and deterministic playback: DOM/SVG, Canvas 2D, or a retained-mode/WebGL library?
2. What are the reference scene dimensions, maximum scene count, element count, and asset budget?
3. Which browsers and devices define the editor and reader support matrix?
4. Is public publishing included in the first alpha, or should all sharing be invitation-only?
5. Which authentication, relational database, object storage, and deployment services will be used?
6. What is the exact behavior when a scene leaves and re-enters the viewport?
7. Does MVP looping belong in the initial animation contract or the next iteration?
8. What minimum age and content-rating policy applies to the alpha cohort?

## 11. Immediate planning backlog

1. Create the reference two-scene comic and measurable playback fixtures.
2. Wireframe the create, studio, publish, and reader flows.
3. Write the version 0 animation schema with examples and validation rules.
4. Produce the system architecture and detailed relational data model.
5. Resolve the eight decisions above as short architecture/product decision records.
6. Convert Milestones 1–5 into epics and acceptance-tested stories.
7. Scaffold the application only after the Milestone 0 exit gate passes.
