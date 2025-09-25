# Database Design Requirements (Phase 1)

This document defines the MVP database requirements for the cognitive
journal, grounded in the v1 scope. Focus is on core entities, relations,
integrity rules, and indexes to support the structured journal, framework
library, mental model suggestions, session save & search, and basic
analytics later.

## Guiding principles

- Keep entities minimal but normalized; avoid premature denormalization.
- Enforce data integrity with FKs, UNIQUE, CHECKs, and appropriate
  ON DELETE behavior.
- Separate abstract/general mental models (principles/concepts) from
  frameworks (actionable step sequences implementing models).
- Support both system-provided content and user-defined content.
- Optimize for read paths used by: session recall, framework steps,
  model suggestions, and simple search.

## Core entities (Phase 1)

### users
Represents application users.

Fields:
- id (PK, integer, auto-increment)
- email (TEXT, UNIQUE, required)
- password_hash (TEXT, required)  // placeholder; auth impl later
- display_name (TEXT, nullable)
- created_at (DATETIME, default now)
- updated_at (DATETIME, default now)

Constraints:
- email UNIQUE
- updated_at auto-update trigger (implementation detail)

Indexes:
- UNIQUE(email)

### journal_entries
A structured journal entry authored by a user. May use a framework.

Fields:
- id (PK)
- user_id (FK -> users.id, required)
- framework_id (FK -> frameworks.id, nullable)
- title (TEXT, required)
- content (TEXT, required)  // persisted markdown/JSON/MDX string
- created_at (DATETIME, default now)
- updated_at (DATETIME, default now)

Constraints:
- FK(user_id) ON DELETE CASCADE
- FK(framework_id) ON DELETE SET NULL

Indexes:
- (user_id, created_at DESC)
- (framework_id)

### ideas
Atomic ideas captured during journaling. Optionally linked to a model.

Fields:
- id (PK)
- entry_id (FK -> journal_entries.id, required)
- model_id (FK -> mental_models.id, nullable)
- content (TEXT, required)
- text_selection (TEXT, nullable)  // snippet from entry
- file_path (TEXT, nullable)       // relative path to source file
- created_at (DATETIME, default now)

Constraints:
- FK(entry_id) ON DELETE CASCADE
- FK(model_id) ON DELETE SET NULL

Indexes:
- (entry_id, created_at DESC)
- (model_id)

### beliefs
Statements a user holds with confidence and evidence.

Fields:
- id (PK)
- user_id (FK -> users.id, required)
- belief (TEXT, required)
- confidence_level (INTEGER, required) // 0..100
- evidence (TEXT, nullable)
- created_at (DATETIME, default now)

Constraints:
- FK(user_id) ON DELETE CASCADE
- CHECK(confidence_level BETWEEN 0 AND 100)

Indexes:
- (user_id, created_at DESC)

### goals
High-level user goals.

Fields:
- id (PK)
- user_id (FK -> users.id, required)
- title (TEXT, required)
- description (TEXT, nullable)
- status (TEXT, required) // enum: planned, active, blocked, done, dropped
- target_date (DATE, nullable)
- created_at (DATETIME, default now)

Constraints:
- FK(user_id) ON DELETE CASCADE
- CHECK(status IN ('planned','active','blocked','done','dropped'))

Indexes:
- (user_id, status)
- (user_id, target_date)

### actions
Tasks tied to a goal.

Fields:
- id (PK)
- goal_id (FK -> goals.id, required)
- description (TEXT, required)
- completed (BOOLEAN, default false, required)
- due_date (DATE, nullable)
- created_at (DATETIME, default now)

Constraints:
- FK(goal_id) ON DELETE CASCADE

Indexes:
- (goal_id, completed, due_date)

## Knowledge layer: Models vs Frameworks

### mental_models (Abstract/General)
Abstract principles, concepts, heuristics. Not procedural by themselves.

Fields:
- id (PK)
- user_id (FK -> users.id, nullable) // null => system-provided model
- name (TEXT, required)
- description (TEXT, required)
- category (TEXT, nullable) // e.g., "decision", "problem-solving"
- is_system (BOOLEAN, default true when user_id is null)
- created_at (DATETIME, default now)

Constraints:
- Either is_system = true AND user_id is null, or is_system = false AND
  user_id not null.
- UNIQUE(name, COALESCE(user_id, 0)) // prevent duplicates per owner space
- FK(user_id) ON DELETE CASCADE

Indexes:
- (category)
- (is_system)
- UNIQUE(name, COALESCE(user_id, 0))

### frameworks (Concrete/Implementations)
Actionable processes (steps) that can implement/apply one or more
mental models. Used by journal entries to structure thinking.

Fields:
- id (PK)
- user_id (FK -> users.id, nullable) // null => system-provided
- name (TEXT, required)
- description (TEXT, required)
- is_system (BOOLEAN, default true when user_id is null)
- created_at (DATETIME, default now)

Constraints:
- Either is_system = true AND user_id is null, or is_system = false AND
  user_id not null.
- UNIQUE(name, COALESCE(user_id, 0))
- FK(user_id) ON DELETE CASCADE

Indexes:
- (is_system)
- UNIQUE(name, COALESCE(user_id, 0))

### framework_steps
Ordered steps belonging to a framework.

Fields:
- id (PK)
- framework_id (FK -> frameworks.id, required)
- step_order (INTEGER, required, 1-based contiguous within framework)
- title (TEXT, required)
- description (TEXT, nullable)
- created_at (DATETIME, default now)

Constraints:
- FK(framework_id) ON DELETE CASCADE
- UNIQUE(framework_id, step_order)
- CHECK(step_order >= 1)

Indexes:
- (framework_id, step_order)

### framework_models (join: frameworks <-> mental_models)
Many-to-many mapping of which mental models a framework implements or
draws from.

Fields:
- framework_id (FK -> frameworks.id, required)
- model_id (FK -> mental_models.id, required)
- role (TEXT, nullable) // e.g., "primary", "supporting"

Constraints:
- PK(framework_id, model_id)
- FK(framework_id) ON DELETE CASCADE
- FK(model_id) ON DELETE CASCADE
- CHECK(role IN ('primary','supporting') OR role IS NULL)

Indexes:
- (model_id, framework_id)

### similar_frameworks (self-referential)
Optional similarity graph between frameworks.

Fields:
- framework_id_a (FK -> frameworks.id, required)
- framework_id_b (FK -> frameworks.id, required)
- similarity_note (TEXT, nullable) // explanation/rationale
- created_at (DATETIME, default now)

Constraints:
- PK(framework_id_a, framework_id_b)
- FK(framework_id_a) ON DELETE CASCADE
- FK(framework_id_b) ON DELETE CASCADE
- CHECK(framework_id_a <> framework_id_b)
- Enforce canonical ordering so each pair stored once:
  framework_id_a < framework_id_b

Indexes:
- (framework_id_b, framework_id_a)

## Relationships summary and conditions

- users 1—N journal_entries
  - FK: journal_entries.user_id -> users.id
  - On delete user: CASCADE entries

- users 1—N beliefs, goals, mental_models (user-defined),
  frameworks (user-defined)
  - On delete user: CASCADE owned content

- goals 1—N actions
  - On delete goal: CASCADE actions

- journal_entries N—1 frameworks (optional)
  - On delete framework: SET NULL on entries

- journal_entries 1—N ideas
  - On delete entry: CASCADE ideas

- ideas N—1 mental_models (optional)
  - On delete model: SET NULL on ideas

- frameworks N—N mental_models via framework_models
  - On delete any side: CASCADE link rows

- frameworks N—N frameworks via similar_frameworks
  - Symmetric relation stored once with a<b invariant

## Data lifecycle and integrity

- Timestamps:
  - created_at defaults to current timestamp on insert.
  - updated_at maintained via triggers on tables that need it
    (users, journal_entries). Others can omit until needed.

- Ownership and visibility:
  - System-provided items: is_system = true AND user_id IS NULL.
  - User-defined items: is_system = false AND user_id NOT NULL.
  - Unique names enforced per ownership scope.

- Step order:
  - framework_steps.step_order starts at 1 and is UNIQUE per framework.
  - Application logic maintains contiguity when inserting/deleting.

- Similar frameworks:
  - Application must always write ordered pairs (min(id) as a).
  - DB CHECK ensures a != b; canonical ordering enforced by app and a
    partial UNIQUE if supported.

## Indexing plan (v1)

- journal_entries: (user_id, created_at DESC), (framework_id)
- ideas: (entry_id, created_at DESC), (model_id)
- beliefs: (user_id, created_at DESC)
- goals: (user_id, status), (user_id, target_date)
- actions: (goal_id, completed, due_date)
- mental_models: UNIQUE(name, COALESCE(user_id, 0)), (category), (is_system)
- frameworks: UNIQUE(name, COALESCE(user_id, 0)), (is_system)
- framework_steps: (framework_id, step_order)
- framework_models: (model_id, framework_id)
- similar_frameworks: (framework_id_b, framework_id_a)

## Seed data (Phase 1)

- System mental_models (examples):
  - First Principles, Inversion, OODA Loop, MECE.
- System frameworks with steps:
  - First Principles Decomposition
  - OODA Loop (Observe, Orient, Decide, Act)
- framework_models mappings for the above.
- A few similar_frameworks pairs:
  - OODA Loop ~ PDCA (if PDCA added later)

## Out of scope (later phases)

- File storage and versioning (Phase 8).
- Real-time collaboration metadata.
- Advanced analytics tables.
- Audit logs and event sourcing.


## updates
1. get rid of mental models because it'll be less confusing
2. add concepts (or tags) added to each framework