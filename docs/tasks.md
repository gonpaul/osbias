# Qualia AI Journal - Development Roadmap

## Phase 1: Core Data Models & Database (Week 1-2) ✅ COMPLETED
- [x] Create database migrations for core entities:
  - [x] `users` table (id, name, email, password_hash, created_at, updated_at)
  - [x] `frameworks` table (id, name, description, concepts, user_id, is_system, created_at, updated_at)
  - [x] `framework_steps` table (id, framework_id, step_order, title, description, created_at, updated_at)
  - [x] `journal_entries` table (id, title, content, user_id, framework_id, created_at, updated_at)
  - [x] `ideas` table (id, content, entry_id, framework_id, text_selection, file_path, created_at)
  - [x] `beliefs` table (id, belief, confidence_level, evidence, user_id, created_at)
  - [x] `goals` table (id, title, description, status, user_id, target_date, created_at)
  - [x] `actions` table (id, goal_id, description, completed, due_date, created_at)
- [x] Create TypeScript models for all entities
- [x] Set up database relationships and foreign keys
- [x] Create seed data for testing
- [x] Set up Swagger/OpenAPI documentation:
  - [x] Configure Swagger JSDoc for API documentation
  - [x] Create Swagger UI page for API testing
  - [x] Document all API endpoints with JSDoc comments
  - [x] Define API schemas for all entities
  - [x] Add API versioning and server configuration
- [x] Create complete API endpoints (15+ endpoints) with full CRUD operations
- [x] Implement comprehensive test suite with cleanup functionality
- [x] Fix Next.js 15+ compatibility issues (await params)

## Phase 2: Authentication & User Management (Week 2-3)
- [x] Implement user authentication system
- [x] Add user registration/login pages
- [x] Create user profile management
- [x] Add session management with Redux
- [x] Implement protected routes
- [x] Add user preferences and settings
- [x] Add JWT authentication to Swagger documentation
- [x] Add user roles and authorization
  - [x] Add `users.role` column (default: `user`)
  - [x] Include `role` in JWT payload
  - [x] Create `authz` helpers: `requireAuth`, `requireRole`,
        `assertOwner`
  - [x] Enforce ownership on user-scoped APIs (filter by `user_id`)
  - [x] Allow only `admin` to modify system data (`is_system = true`)
  - [x] Seed an initial admin user
  - [x] Document role requirements in Swagger
- [x] protect routes
  - [x] protect users route to be accessible only by user himself and admin
  - [x] right now framework steps can be fetch for any framework, even if its personal
  - [x] personal entries operations and operations on their ideas are protected

## Phase 3: Core Editor Functionality (Week 3-4)
- [x] Implement rich text editor with markdown support
- [x] Add auto-save functionality for journal entries
- [x] Create entry CRUD operations (Create, Read, Update, Delete) - API Complete
- [ ] Add entry search and filtering
- [ ] Implement entry templates system
- [ ] Add entry categorization and tagging
- [ ] optional: make vim mode and implement it

## Phase 4: AI Integration & Smart Features (Week 4-6)
- [ ] Integrate AI service (OpenAI/Anthropic) for:
  - [ ] Bias detection in entries
  - [ ] Content paraphrasing and improvement
  - [ ] Framework suggestions
  - [ ] Idea generation and expansion
  - [ ] Content validation and fact-checking
- [ ] Implement real-time AI chat functionality
- [ ] Add AI-powered content analysis
- [ ] Create AI feedback system for writing quality

## Phase 5: Frameworks System (Week 6-7)
- [ ] Create frameworks library page
- [ ] Implement framework suggestion engine
- [ ] Add framework application tracking
- [ ] Create framework effectiveness metrics
- [ ] Build framework recommendation system
- [ ] Add custom framework creation

## Phase 6: Belief System & Goal Tracking (Week 7-8)
- [ ] Build belief system page with:
  - [ ] Belief tracking and confidence levels
  - [ ] Evidence collection and management
  - [ ] Belief change tracking over time
  - [ ] Belief conflict detection
- [ ] Create goal-action page with:
  - [ ] Goal setting and tracking
  - [ ] Action item management
  - [ ] Progress visualization
  - [ ] Goal achievement analytics

## Phase 7: Graph View & Analytics (Week 8-9)
- [ ] Implement graph visualization of:
  - [ ] Entry connections and relationships
  - [ ] Framework applications
  - [ ] Belief evolution over time
  - [ ] Goal-action networks
- [ ] Add interactive graph navigation
- [ ] Create analytics dashboard
- [ ] Implement data export functionality

## Phase 8: File System & Organization (Week 9-10)
- [ ] Replace mock file system with real implementation
- [ ] Add file upload and management
- [ ] Implement folder organization
- [ ] Add file search and indexing
- [ ] Create file-idea linking system
- [ ] Add file versioning

## Phase 9: WatchDog & Monitoring (Week 10-11)
- [ ] Implement real idea tracking system
- [ ] Add idea categorization and tagging
- [ ] Create idea follow-up system
- [ ] Add idea impact measurement
- [ ] Implement idea-to-action conversion
- [ ] Add idea sharing and collaboration

## Phase 10: Publishing & Sharing (Week 11-12)
- [ ] Create publishing system for entries
- [ ] Add sharing functionality
- [ ] Implement privacy controls
- [ ] Create public/private entry modes
- [ ] Add export options (PDF, Markdown, etc.)
- [ ] Implement entry templates for publishing

## Phase 11: Advanced Features (Week 12-14)
- [ ] Add collaborative features
- [ ] Implement real-time synchronization
- [ ] Create mobile-responsive design
- [ ] Add keyboard shortcuts and power-user features
- [ ] Implement advanced search with filters
- [ ] Add data backup and restore
 - [ ] App shell warmup (preload authenticated layout assets post-login)

## Phase 12: Testing & Optimization (Week 14-15)
- [ ] Write comprehensive unit tests
- [ ] Add integration tests
- [ ] Implement end-to-end testing
- [ ] Performance optimization
- [ ] Security audit and fixes
- [ ] User acceptance testing

## Phase 13: Deployment & Launch (Week 15-16)
- [ ] Set up production database
- [ ] Configure CI/CD pipeline
  - [ ] Lint (ESLint) and format validation
  - [ ] Type-check (tsc --noEmit)
  - [ ] Build (Next.js)
  - [ ] Run unit tests (Jest/Vitest)
  - [ ] Run Playwright e2e tests (headless), with dev server
  - [ ] Run DB migrations in CI (dry-run and apply in staging)
  - [ ] Validate Swagger generation (spec builds without errors)
  - [ ] Cache pnpm and Playwright browsers for speed
  - [ ] Artifact build outputs for deployment
- [ ] Landing page (marketing)
  - [ ] Clear value proposition, hero, primary CTA (Sign up)
  - [ ] Feature highlights (editor, frameworks, AI assist)
  - [ ] Screenshots/demo GIFs
  - [ ] Pricing/roadmap link (optional)
  - [ ] Docs/help and privacy/terms links
  - [ ] SEO: meta tags, OG/Twitter cards, sitemap, robots
  - [ ] Analytics: enable page analytics + events (signup click, conversion)
  - [ ] Accessibility pass (contrast, landmarks, keyboard nav)
- [ ] Client warmup & perceived performance
  - [ ] Preconnect/dns-prefetch to critical origins (fonts, API)
  - [ ] Preload critical fonts and above-the-fold CSS
  - [ ] Prefetch logged-in shell resources post-auth (Next prefetch)
  - [ ] Cache-control for static assets (immutable), ISR for landing content
  - [ ] Keep-alive/health ping after deploy to reduce cold starts
  - [ ] Lazy-load non-critical routes/widgets; code-split heavy modules
  - [ ] Measure FCP/LCP/TTI; budget and fix regressions
- [ ] Deploy to production environment
- [ ] Set up monitoring and logging
- [ ] Create user documentation
- [ ] Launch and user onboarding

## Technical Debt & Improvements
- [x] Replace mock data with real API calls - API Complete
- [x] Implement proper error handling - Complete
- [ ] Add loading states and user feedback
- [ ] Optimize bundle size and performance
- [ ] Add accessibility features
- [x] Implement proper TypeScript types throughout - Complete
- [ ] Add comprehensive logging system
- [ ] Create admin dashboard for system management
- [ ] Apply authorization checks across all endpoints (audit pass)

## Priority Order:
1. **High Priority**: Phases 1-4 (Core functionality)
2. **Medium Priority**: Phases 5-8 (Advanced features)
3. **Low Priority**: Phases 9-13 (Polish and deployment)

## Estimated Timeline: 16 weeks (4 months)
## Team Size: 1-2 developers
## Key Technologies: Next.js, TypeScript, SQLite, Redux, AI APIs

---

## Changelog

### Phase 1 Completion (January 2025)
- ✅ **Completed**: Full database schema with simplified architecture
- ✅ **Completed**: 15+ API endpoints with complete CRUD operations
- ✅ **Completed**: Comprehensive Swagger documentation
- ✅ **Completed**: Test suite with cleanup functionality
- ✅ **Completed**: Next.js 15+ compatibility fixes
- 🔄 **Changed**: Removed complex mental models system in favor of simplified frameworks
- 🔄 **Changed**: Direct framework-to-idea relationships for better usability
- 🔄 **Changed**: JSON concepts field for flexible framework tagging
- 📝 **Note**: Phase 1 foundation is production-ready and battle-tested
