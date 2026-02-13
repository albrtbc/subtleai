# Node.js/React Application - Best Practices Checklist

A comprehensive checklist for evaluating code quality in full-stack JavaScript applications. Use this guide to audit your codebase for adherence to industry best practices.

---

## Server (Node.js/Express)

### Error Handling

- [ ] **Centralized error handler**: All errors flow through a single middleware error handler
  - ✓ Good: `app.use((err, req, res, next) => { /* handle all errors */ })`
  - ✗ Bad: Errors caught and handled randomly throughout routes

- [ ] **Error logging**: All errors are logged with proper context (timestamp, stack trace, request ID)
  - ✓ Good: `logger.error('Failed to transcribe', { jobId, userId, error: err.stack })`
  - ✗ Bad: `console.error(err)` or silent failures

- [ ] **Appropriate HTTP status codes**: Errors return correct status codes
  - ✓ Good: 400 for validation, 401 for auth, 403 for permissions, 404 for not found, 500 for server errors
  - ✗ Bad: Always returning 500 or 200

- [ ] **Error message safety**: Sensitive information not exposed in error responses
  - ✓ Good: `res.status(500).json({ error: 'Internal server error' })`
  - ✗ Bad: `res.status(500).json({ error: err.stack })`

- [ ] **Graceful degradation**: Application continues operating when non-critical errors occur
  - ✓ Good: Log failure, return error to user, continue accepting new requests
  - ✗ Bad: Entire server crashes on one bad request

- [ ] **Async/await error handling**: Try-catch blocks or `.catch()` for all async operations
  - ✓ Good: `try { const data = await asyncFunc(); } catch (err) { next(err); }`
  - ✗ Bad: `const data = await asyncFunc()` without error handling

### Input Validation

- [ ] **Schema validation**: All input validated against schema (joi, zod, yup, express-validator)
  - ✓ Good: `const schema = joi.object({ email: joi.string().email().required() })`
  - ✗ Bad: Trusting req.body directly without validation

- [ ] **Type checking**: Values are type-checked before use
  - ✓ Good: `if (typeof req.body.count !== 'number') return res.status(400).json(...)`
  - ✗ Bad: `const count = req.body.count * 2` (could be string)

- [ ] **File upload validation**: File type, size, and content validated
  - ✓ Good: `fileFilter: (req, file, cb) => { if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true) }`
  - ✗ Bad: Accepting all file types or only checking extension

- [ ] **Size limits enforced**: Request/file size limits configured
  - ✓ Good: `limits: { fileSize: 10 * 1024 * 1024 * 1024 }` and `express.json({ limit: '10mb' })`
  - ✗ Bad: No limits or extremely high limits

- [ ] **Sanitization**: User input sanitized to prevent injection attacks
  - ✓ Good: Use libraries like `xss`, `sanitize-html`, or parameterized queries
  - ✗ Bad: `query = "SELECT * FROM users WHERE id = " + req.body.id`

- [ ] **Required fields checked**: All required fields present and non-empty
  - ✓ Good: Validation schema marks fields as required
  - ✗ Bad: `const email = req.body.email` without checking if it exists

### Security

- [ ] **CORS configured properly**: CORS origin whitelist specified, not `*`
  - ✓ Good: `cors({ origin: ['http://localhost:3000', 'https://example.com'] })`
  - ✗ Bad: `cors({ origin: '*' })` or no CORS configuration

- [ ] **HTTPS in production**: App enforces HTTPS in production environments
  - ✓ Good: Check `process.env.NODE_ENV` and redirect HTTP to HTTPS
  - ✗ Bad: Application accepts HTTP requests in production

- [ ] **Authentication implemented**: Endpoints requiring auth have guards
  - ✓ Good: `const authMiddleware = (req, res, next) => { if (!req.user) return res.status(401).json(...) }`
  - ✗ Bad: Endpoints accessible without authentication

- [ ] **Authorization checks**: User permissions verified for each resource
  - ✓ Good: `if (req.user.id !== resource.userId) return res.status(403).json(...)`
  - ✗ Bad: Allowing any authenticated user to access any resource

- [ ] **Secrets management**: No secrets in code, using environment variables
  - ✓ Good: `const apiKey = process.env.GROQ_API_KEY`
  - ✗ Bad: `const apiKey = 'sk-1234567890'` or `.env` committed to git

- [ ] **SQL injection prevention**: Using parameterized queries or ORM
  - ✓ Good: `db.query('SELECT * FROM users WHERE id = ?', [userId])`
  - ✗ Bad: `db.query('SELECT * FROM users WHERE id = ' + userId)`

- [ ] **Rate limiting**: Endpoints rate-limited to prevent abuse
  - ✓ Good: `const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })`
  - ✗ Bad: No rate limiting on public endpoints

- [ ] **Helmet.js or similar**: Security headers configured
  - ✓ Good: `const helmet = require('helmet'); app.use(helmet());`
  - ✗ Bad: No security headers

- [ ] **CSRF protection**: CSRF tokens used for state-changing requests
  - ✓ Good: Form includes CSRF token, verified on POST/PUT/DELETE
  - ✗ Bad: No CSRF protection

### Logging

- [ ] **Structured logging**: Logs use structured format (JSON preferred)
  - ✓ Good: `logger.info('User login', { userId, timestamp: new Date(), ip: req.ip })`
  - ✗ Bad: `console.log('login at ' + new Date())`

- [ ] **Log levels used correctly**: debug, info, warn, error levels used appropriately
  - ✓ Good: `logger.debug('Parsed token'), logger.error('DB connection failed')`
  - ✗ Bad: All logs at same level

- [ ] **Sensitive data not logged**: Passwords, tokens, API keys not included in logs
  - ✓ Good: `logger.info('API called', { endpoint, userId })` (no password)
  - ✗ Bad: `logger.info('Login attempt', { username, password })`

- [ ] **Request tracing**: Requests tracked with unique IDs through logs
  - ✓ Good: Middleware adds `req.id = generateId()`, all logs include it
  - ✗ Bad: Can't correlate logs across multiple services/processes

- [ ] **Error context captured**: Error logs include relevant context
  - ✓ Good: `logger.error('Transcription failed', { jobId, fileSize, error: err.message })`
  - ✗ Bad: `logger.error(err)`

### Environment Configuration

- [ ] **`.env.example` file exists**: Template for environment variables documented
  - ✓ Good: Repository includes `.env.example` with all required variables
  - ✗ Bad: No documentation of required environment variables

- [ ] **Environment variables validated on startup**: App fails fast if required vars missing
  - ✓ Good: `if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required')`
  - ✗ Bad: Missing env vars cause failures later in the app lifecycle

- [ ] **Separate configs for environments**: Different settings for dev/test/production
  - ✓ Good: `const config = require('./config')[process.env.NODE_ENV]`
  - ✗ Bad: Hard-coded values that differ per environment

- [ ] **Port configurable**: Port read from environment variable with fallback
  - ✓ Good: `const PORT = process.env.PORT || 3001`
  - ✗ Bad: `const PORT = 3001` (hard-coded)

- [ ] **Secrets not in version control**: `.env` file in `.gitignore`
  - ✓ Good: `.gitignore` contains `.env`, only `.env.example` in repo
  - ✗ Bad: `.env` file committed with real secrets

### Code Structure

- [ ] **Routes separated from logic**: Business logic in services, routes handle HTTP
  - ✓ Good: `router.post('/', upload.single('file'), validate(), transcribeController.create)`
  - ✗ Bad: Complex logic directly in route handlers

- [ ] **Controllers organize endpoints**: Related endpoints grouped in controller files
  - ✓ Good: `controllers/transcribeController.js` contains all transcribe operations
  - ✗ Bad: Random route files with no organization

- [ ] **Services contain business logic**: Reusable business logic in service classes
  - ✓ Good: `services/transcriptionService.js` handles transcription regardless of HTTP
  - ✗ Bad: All logic in route handlers

- [ ] **Middleware organized**: Custom middleware in dedicated `middleware/` directory
  - ✓ Good: `middleware/upload.js`, `middleware/auth.js`, `middleware/errorHandler.js`
  - ✗ Bad: Middleware defined inline in routes

- [ ] **Dependency injection or clear module exports**: Dependencies injected or clearly imported
  - ✓ Good: `const transcribeService = require('../services/transcribeService')`
  - ✗ Bad: Global variables or circular dependencies

- [ ] **Constants centralized**: Magic numbers/strings in constants file
  - ✓ Good: `const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024` in `constants.js`
  - ✗ Bad: Magic numbers scattered throughout code

- [ ] **Database queries isolated**: Database logic in dedicated data access layer
  - ✓ Good: `const user = await userRepository.findById(userId)`
  - ✗ Bad: Raw SQL/queries in service functions

- [ ] **No callback hell**: Async operations use async/await or promises
  - ✓ Good: `const data = await asyncFunc(); const result = await processData(data);`
  - ✗ Bad: Nested callbacks three levels deep

- [ ] **Module size reasonable**: Files have clear single responsibility (< 300 lines typical)
  - ✓ Good: Controllers 50-150 lines, Services 100-200 lines
  - ✗ Bad: 1000+ line files mixing concerns

### API Design

- [ ] **RESTful conventions**: Endpoints follow REST principles
  - ✓ Good: `POST /api/transcriptions`, `GET /api/transcriptions/:id`, `DELETE /api/transcriptions/:id`
  - ✗ Bad: `/api/createTranscription`, `/api/getTranscription?id=1`, `/api/doDelete`

- [ ] **Consistent response format**: All endpoints return responses in same format
  - ✓ Good: `{ success: boolean, data?: T, error?: string }`
  - ✗ Bad: Some endpoints return `{ result }`, others `{ data }`, others bare objects

- [ ] **Status codes consistent**: Same status code used for same types of errors
  - ✓ Good: Always 400 for validation, always 401 for missing auth
  - ✗ Bad: Sometimes 400 for validation, sometimes 422

- [ ] **Pagination implemented**: Large data sets paginated with limit/offset or cursor
  - ✓ Good: `GET /api/jobs?limit=20&offset=0` returns `{ data: [...], total: 150 }`
  - ✗ Bad: No pagination, endpoint returns all 10,000 records

- [ ] **API versioning considered**: Version in URL or header if breaking changes possible
  - ✓ Good: `/api/v1/transcribe` or header `Accept: application/vnd.example.v1+json`
  - ✗ Bad: No versioning, breaking changes crash old clients

---

## Client (React)

### React Patterns & Hooks

- [ ] **Functional components used**: No legacy class components (unless wrapping libraries)
  - ✓ Good: `const MyComponent = () => { return <div>...</div>; }`
  - ✗ Bad: `class MyComponent extends React.Component { ... }`

- [ ] **Hooks dependency arrays correct**: Dependencies accurate, no missing/extra dependencies
  - ✓ Good: `useEffect(() => { setName(firstName + lastName); }, [firstName, lastName])`
  - ✗ Bad: `useEffect(() => { setName(firstName + lastName); }, [])` (missing lastName)

- [ ] **Custom hooks for reusable logic**: Shared logic extracted to custom hooks
  - ✓ Good: `const { jobs, addJobs, removeJob } = useJobQueue()`
  - ✗ Bad: Duplicated state management logic in multiple components

- [ ] **useCallback used appropriately**: Functions memoized when passed as dependencies
  - ✓ Good: `const handleClick = useCallback(() => { ... }, [dep1, dep2])`
  - ✗ Bad: `const handleClick = () => { ... }` passed as prop every render

- [ ] **useMemo used appropriately**: Expensive computations memoized
  - ✓ Good: `const filteredList = useMemo(() => list.filter(...), [list])`
  - ✗ Bad: `const filteredList = list.filter(...)` recalculated every render

- [ ] **useRef used correctly**: Refs only for persistent mutable values, not state
  - ✓ Good: `const inputRef = useRef(null)` for DOM access, `const countRef = useRef(0)` for persistent value
  - ✗ Bad: `const count = useRef(0)` for mutable counter (should use useState)

- [ ] **No state in closures**: State not captured in closures from previous renders
  - ✓ Good: Use refs or current state in handlers, or proper useCallback dependencies
  - ✗ Bad: Handler created once uses stale state from initial render

- [ ] **Effect cleanup**: Components with subscriptions/timers clean up in useEffect
  - ✓ Good: `useEffect(() => { const sub = stream.subscribe(...); return () => sub.unsubscribe(); }, [])`
  - ✗ Bad: No cleanup, memory leaks from multiple subscriptions

### State Management

- [ ] **Minimal state**: Only data that changes is in state, derived data computed
  - ✓ Good: Store `firstName` and `lastName`, compute `fullName` on render
  - ✗ Bad: Store `firstName`, `lastName`, and `fullName` all in state

- [ ] **State structure flat or normalized**: Not deeply nested state
  - ✓ Good: `{ userId: 1, userName: 'John' }` or `{ users: { 1: { name: 'John' } } }`
  - ✗ Bad: `{ user: { name: { first: 'John', last: 'Doe' }, meta: { ... } } }` (hard to update)

- [ ] **State mutations prevented**: State never mutated directly
  - ✓ Good: `setItems([...items, newItem])` or `setUser({ ...user, name: 'Jane' })`
  - ✗ Bad: `items.push(newItem); setItems(items)` or `user.name = 'Jane'`

- [ ] **Prop drilling avoided**: Props not passed through many levels unnecessarily
  - ✓ Good: Use Context, custom hooks, or state management library for shared state
  - ✗ Bad: Pass `user` through 5 intermediate components that don't use it

- [ ] **Context used appropriately**: Global state in Context (theme, auth, settings)
  - ✓ Good: `useContext(ThemeContext)` for theme, custom hook `useAuth()` for auth
  - ✗ Bad: All app state in one Context causing full re-renders

- [ ] **Local state preferred**: State kept at lowest level needed
  - ✓ Good: Form input state in form component, not passed up
  - ✗ Bad: Every piece of state at top-level App component

### Component Organization

- [ ] **Single responsibility**: Each component has one clear purpose
  - ✓ Good: `<FileJobList>` displays jobs, `<JobItem>` displays single job
  - ✗ Bad: One huge component handling forms, lists, modals, and navigation

- [ ] **Props shape documented**: Prop types defined with PropTypes or TypeScript
  - ✓ Good: `Component.propTypes = { user: PropTypes.shape({ id: PropTypes.number }), onDelete: PropTypes.func }` or TypeScript interfaces
  - ✗ Bad: No documentation of what props component expects

- [ ] **Smart/dumb components separated** (optional but recommended): Container components fetch data, presentational components render UI
  - ✓ Good: `<UserListContainer>` fetches data, passes to `<UserList>`
  - ✗ Bad: All components handle their own data fetching

- [ ] **Component composition over inheritance**: Props and children used for flexibility
  - ✓ Good: `<Card><Header /><Body /><Footer /></Card>`
  - ✗ Bad: `<Card type="withHeader" ...props />`

- [ ] **Folder structure clear**: Related files grouped (component, styles, hooks, tests)
  - ✓ Good: `components/User/User.jsx`, `components/User/User.css`, `components/User/__tests__`
  - ✗ Bad: All components in one flat `components/` directory

### Error Handling

- [ ] **Error boundaries implemented**: Error boundaries catch component errors
  - ✓ Good: `<ErrorBoundary><App /></ErrorBoundary>` catches child errors
  - ✗ Bad: No error boundary, one bad component crashes entire app

- [ ] **API errors handled**: Network/API failures handled gracefully with user feedback
  - ✓ Good: `catch (err) { setError(err.message); showToast('Failed to load'); }`
  - ✗ Bad: Silent failures or unhandled promise rejections

- [ ] **Loading states managed**: Loading indicators shown during async operations
  - ✓ Good: `{ isLoading ? <Spinner /> : <Content /> }`
  - ✗ Bad: No indication that request is pending

- [ ] **Empty states handled**: Components handle empty data gracefully
  - ✓ Good: `{ items.length === 0 ? <EmptyState /> : <List items={items} /> }`
  - ✗ Bad: Shows broken UI when data is empty

- [ ] **Input errors validated**: Form input validated with clear error messages
  - ✓ Good: `{ errors.email && <span className="error">{errors.email}</span> }`
  - ✗ Bad: No validation feedback to user

### Accessibility (a11y)

- [ ] **Semantic HTML used**: Proper HTML elements for structure (button, nav, main, etc.)
  - ✓ Good: `<button onClick={...}>Click</button>`, `<nav>`, `<main>`, `<article>`
  - ✗ Bad: `<div onClick={...}>Click</div>`, `<div>` for everything

- [ ] **ARIA labels provided**: Interactive elements have accessible labels
  - ✓ Good: `<button aria-label="Close"><Icon /></button>` or `<label htmlFor="email">Email</label>`
  - ✗ Bad: Icon-only buttons without labels, inputs without associated labels

- [ ] **Keyboard navigation supported**: All interactive elements accessible via keyboard
  - ✓ Good: Buttons have tab stops, modals trap focus, ESC closes
  - ✗ Bad: Keyboard users can't access dropdown menu or close modal

- [ ] **Color not only indicator**: Information conveyed by color also conveyed by text/icon
  - ✓ Good: `<div style={{color: 'red'}}>Error: {errorMessage}</div>`
  - ✗ Bad: Just red background with no text (colorblind users can't see error)

- [ ] **Contrast sufficient**: Text has sufficient contrast with background
  - ✓ Good: Black text on white (contrast ratio > 4.5:1)
  - ✗ Bad: Gray text on light gray (hard to read)

- [ ] **Focus visible**: Focused elements have visible focus indicator
  - ✓ Good: `input:focus { outline: 2px solid blue; }`
  - ✗ Bad: `input { outline: none; }` and no focus styling

- [ ] **Images have alt text**: All images have descriptive alt attributes
  - ✓ Good: `<img alt="User avatar for John Doe" src="..." />`
  - ✗ Bad: `<img alt="image" src="..." />` or `<img src="..." />`

- [ ] **Form labels connected**: Form inputs have associated labels
  - ✓ Good: `<label htmlFor="email"><input id="email" /></label>`
  - ✗ Bad: `<label>Email</label><input />` (not connected)

### Performance

- [ ] **Code splitting implemented**: Large bundles split into chunks loaded on demand
  - ✓ Good: `const LazyComponent = React.lazy(() => import('./Heavy'))`
  - ✗ Bad: Entire app bundled in single JS file

- [ ] **Images optimized**: Images resized, compressed, lazy-loaded
  - ✓ Good: `<img src="small.jpg" loading="lazy" />`, using WebP with fallbacks
  - ✗ Bad: 5MB PNG loaded on initial page load

- [ ] **Unnecessary re-renders prevented**: Components don't re-render when props/state unchanged
  - ✓ Good: `React.memo()`, `useMemo()`, `useCallback()` used where appropriate
  - ✗ Bad: All children re-render when parent state changes

- [ ] **Bundle size monitored**: No unused dependencies, watch for size increases
  - ✓ Good: Use `webpack-bundle-analyzer`, run regularly
  - ✗ Bad: Dependencies added and never removed, bundle grows indefinitely

- [ ] **Virtual scrolling for long lists**: Lists with 1000+ items use virtualization
  - ✓ Good: `react-window` or `react-virtual` for long lists
  - ✗ Bad: Rendering 1000 DOM nodes even though only 10 visible

- [ ] **Network requests batched**: Multiple requests combined when possible
  - ✓ Good: Single endpoint fetches multiple data types, or GraphQL batch queries
  - ✗ Bad: 10 separate API calls on component mount

- [ ] **Caching implemented**: Responses cached to avoid duplicate requests
  - ✓ Good: Store API responses in state, use React Query cache
  - ✗ Bad: New request every time component mounts

- [ ] **Long tasks broken up**: Heavy computations don't block UI
  - ✓ Good: Use `requestIdleCallback()`, web workers, or break into chunks
  - ✗ Bad: Sorting 100,000 items blocks interaction for seconds

### Styling & CSS

- [ ] **No inline styles for static content**: Static styles in CSS or CSS-in-JS
  - ✓ Good: CSS modules or Tailwind classes
  - ✗ Bad: `style={{ color: 'red', fontSize: '16px' }}` for static content

- [ ] **Responsive design**: Layout adapts to different screen sizes
  - ✓ Good: CSS Grid/Flexbox, media queries, mobile-first approach
  - ✗ Bad: Fixed widths, horizontal scroll on mobile

- [ ] **Consistent spacing and sizing**: Design system used for spacing/colors/typography
  - ✓ Good: Spacing in multiples of 4px or 8px, colors from palette
  - ✗ Bad: Random margins/padding everywhere

- [ ] **CSS class naming clear**: Classes describe purpose, not appearance
  - ✓ Good: `class="card-header"`, `class="button--primary"`
  - ✗ Bad: `class="red-box"`, `class="big-text"`

---

## Testing

### Unit Tests

- [ ] **Critical functions tested**: Business logic has test coverage
  - ✓ Good: `describe('parseEmail', () => { test('valid email', ...); test('invalid email', ...); })`
  - ✗ Bad: No tests for utility functions

- [ ] **Edge cases covered**: Tests include boundary conditions and error cases
  - ✓ Good: Tests for empty string, null, undefined, very large numbers, etc.
  - ✗ Bad: Only happy path tested

- [ ] **Mocks used appropriately**: External dependencies mocked in unit tests
  - ✓ Good: `jest.mock('../services/api'); api.get.mockResolvedValue(...)`
  - ✗ Bad: Unit tests making real HTTP requests

- [ ] **Assertions clear**: Each test has clear assertions about behavior
  - ✓ Good: `expect(result).toEqual({ id: 1, name: 'John' })`
  - ✗ Bad: `expect(result).toBeTruthy()` (doesn't verify correct result)

- [ ] **Test isolation**: Tests don't depend on each other
  - ✓ Good: Each test sets up required state independently
  - ✗ Bad: Test depends on previous test running, order matters

### Component Tests

- [ ] **Component rendering tested**: Components render without crashing
  - ✓ Good: `render(<UserCard user={user} />); expect(screen.getByText(user.name)).toBeInTheDocument()`
  - ✗ Bad: No component tests

- [ ] **User interactions tested**: Clicks, form submissions handled correctly
  - ✓ Good: `userEvent.click(button); expect(mockFn).toHaveBeenCalled()`
  - ✗ Bad: Only testing render, not interactions

- [ ] **Props variations tested**: Components tested with different prop combinations
  - ✓ Good: Test with `user={null}`, `user={fullUser}`, `onDelete={mockFn}`, etc.
  - ✗ Bad: Only tested with one set of props

- [ ] **Accessibility tested**: Components tested for keyboard/screen reader compatibility
  - ✓ Good: `expect(screen.getByLabelText('Email')).toBeInTheDocument()`
  - ✗ Bad: No a11y assertions

### Integration Tests

- [ ] **User flows tested**: End-to-end user actions verified
  - ✓ Good: Test login > navigate > submit form > verify result
  - ✗ Bad: Only individual component tests

- [ ] **API interactions tested**: API calls return expected data flow through app
  - ✓ Good: Mock API, verify component renders correct data
  - ✗ Bad: Never test how app responds to API data

- [ ] **Error scenarios tested**: API errors handled appropriately
  - ✓ Good: Test 404, 500, network timeout responses
  - ✗ Bad: Only test happy path

### Test Quality

- [ ] **Descriptive test names**: Test names explain what is being tested
  - ✓ Good: `test('should show error message when password is empty')`
  - ✗ Bad: `test('validation')` or `test('test 1')`

- [ ] **No flaky tests**: Tests pass/fail consistently
  - ✓ Good: Tests use synchronous assertions or proper async/await
  - ✗ Bad: Test sometimes passes, sometimes fails due to timing issues

- [ ] **Fast test suite**: Tests run in reasonable time (< 30 seconds for unit tests)
  - ✓ Good: Mock external services, use in-memory databases
  - ✗ Bad: Each test hits real API and database

- [ ] **Coverage target met**: Code coverage target (60-80%) met
  - ✓ Good: `npm test -- --coverage` shows ~75% coverage
  - ✗ Bad: Coverage below 50% or code is untestable

---

## Documentation

### Code Documentation

- [ ] **README exists and complete**: Project README documents setup and usage
  - ✓ Good: README covers installation, running, testing, deployment steps
  - ✗ Bad: No README or generic "Getting Started" with no real instructions

- [ ] **Setup instructions clear**: New developers can run project locally in < 30 minutes
  - ✓ Good: `git clone`, `npm install`, `npm run dev` works
  - ✗ Bad: "Ask someone who's been here a while"

- [ ] **API documentation**: All endpoints documented with parameters and responses
  - ✓ Good: Swagger/OpenAPI docs or detailed README section
  - ✗ Bad: No documentation, must read code to understand endpoints

- [ ] **Function documentation**: Complex functions have comments explaining purpose
  - ✓ Good: JSDoc comments for functions: `/** @param {string} email - User email */`
  - ✗ Bad: No comments at all or cryptic one-liners

- [ ] **Complex logic explained**: Non-obvious code has explanatory comments
  - ✓ Good: `// Process queue serially to prevent duplicate transcriptions`
  - ✗ Bad: Dense code with no explanation of why

- [ ] **Architecture documented**: System design and data flow documented
  - ✓ Good: `ARCHITECTURE.md` or section in README explaining components
  - ✗ Bad: Only code exists, must reverse-engineer design

- [ ] **Deployment documented**: How to deploy to production is documented
  - ✓ Good: Docker setup, environment variables, deployment steps clear
  - ✗ Bad: "Deploy using magic" or no instructions

### Code Clarity

- [ ] **Variable names descriptive**: Variables named clearly, not abbreviated
  - ✓ Good: `const userId = req.params.id`, `const isLoading = true`
  - ✗ Bad: `const u = req.params.id`, `const l = true`

- [ ] **Function names descriptive**: Functions named after their action
  - ✓ Good: `validateEmail()`, `calculateTotal()`, `fetchUserProfile()`
  - ✗ Bad: `process()`, `handle()`, `do()`

- [ ] **No dead code**: Unused variables, functions, imports removed
  - ✓ Good: All imports used, all functions called
  - ✗ Bad: Old commented code, unused helper functions

- [ ] **Consistent naming conventions**: Naming conventions consistent throughout codebase
  - ✓ Good: camelCase for variables/functions, PascalCase for components/classes
  - ✗ Bad: Mix of snake_case, camelCase, PascalCase

---

## General Patterns & Best Practices

### Development Workflow

- [ ] **Version control used**: Git for all code changes
  - ✓ Good: Clear commit messages, logical commits, main branch protected
  - ✗ Bad: Commits like "fix", "updates", no message

- [ ] **Branches for features**: Features developed on separate branches
  - ✓ Good: `feature/add-user-profile`, `fix/login-bug`
  - ✗ Bad: Everything on main branch

- [ ] **Code review process**: Pull requests reviewed before merge
  - ✓ Good: Required reviews, tests pass, linting passes before merge
  - ✗ Bad: Anyone can push to main directly

- [ ] **CI/CD pipeline**: Automated tests/linting/deployment
  - ✓ Good: GitHub Actions/GitLab CI runs tests on every PR
  - ✗ Bad: Manual testing and deployment

### Dependencies

- [ ] **Dependencies pinned**: Lock file committed, versions not bleeding
  - ✓ Good: `package-lock.json` or `yarn.lock` in repo
  - ✗ Bad: `"express": "*"` or lock file not committed

- [ ] **Minimal dependencies**: No unnecessary packages bloating bundle
  - ✓ Good: Only packages actually used, considered size before adding
  - ✗ Bad: 200 packages, many unused

- [ ] **Dependencies up to date**: Security patches applied regularly
  - ✓ Good: `npm audit` clean, dependencies updated within 3 months
  - ✗ Bad: Using 2-year-old versions with known vulnerabilities

- [ ] **Dependency vulnerabilities checked**: `npm audit` passing or vulnerabilities documented
  - ✓ Good: `npm audit` shows no issues
  - ✗ Bad: `npm audit` shows high-severity vulnerabilities ignored

### Linting & Formatting

- [ ] **Linter configured**: ESLint or similar checking code quality
  - ✓ Good: `.eslintrc` present, rules enforced
  - ✗ Bad: No linting, warnings ignored

- [ ] **Code formatter used**: Prettier or similar for consistent formatting
  - ✓ Good: All code auto-formatted, tests verify format
  - ✗ Bad: Inconsistent indentation and spacing

- [ ] **Type checking considered**: TypeScript or JSDoc types for safety
  - ✓ Good: TypeScript in use with strict mode or JSDoc `@param` annotations
  - ✗ Bad: No type information, hard to understand function signatures

- [ ] **Pre-commit hooks**: Linting/formatting runs before commit
  - ✓ Good: `husky` + `lint-staged` prevents bad commits
  - ✗ Bad: Can commit code that fails linting

### Monitoring & Debugging

- [ ] **Error tracking**: Errors reported to tracking service (Sentry, etc.)
  - ✓ Good: Production errors logged and alerted
  - ✗ Bad: Users report bugs, developers find out through complaints

- [ ] **Performance monitoring**: Performance metrics tracked
  - ✓ Good: API response times logged, Frontend Core Web Vitals monitored
  - ✗ Bad: No insight into performance issues until user complains

- [ ] **Debug mode available**: Easy way to enable verbose logging in development
  - ✓ Good: `DEBUG=app:* npm run dev` shows detailed logs
  - ✗ Bad: Must edit code to add console.logs

### Scalability & Maintainability

- [ ] **Stateless servers**: Servers don't keep state, scale horizontally
  - ✓ Good: No in-memory caches, no session data on server
  - ✗ Bad: Server stores user sessions in memory, can't scale

- [ ] **Database migrations tracked**: Schema changes versioned
  - ✓ Good: Migration files in version control, applied in order
  - ✗ Bad: Manual SQL changes, no way to reproduce schema

- [ ] **Configuration externalized**: Hardcoded values moved to config
  - ✓ Good: Database URL, API endpoints from config/env
  - ✗ Bad: `const dbUrl = 'postgres://localhost:5432/prod'`

- [ ] **Logging level configurable**: Can adjust verbosity without code changes
  - ✓ Good: `LOG_LEVEL=debug npm start`
  - ✗ Bad: Must edit code to change log verbosity

---

## Quick Audit Checklist

Use this condensed version for quick code reviews:

### High Priority (Must Have)

- [ ] Error handling middleware on server
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Secrets in environment variables, not code
- [ ] Hooks dependency arrays correct
- [ ] No infinite loops or memory leaks
- [ ] Loading/error states in UI
- [ ] No hardcoded API URLs/ports
- [ ] Tests run and pass
- [ ] README with setup instructions

### Medium Priority (Should Have)

- [ ] Structured logging with context
- [ ] Rate limiting on public endpoints
- [ ] Error boundaries in React
- [ ] Semantic HTML and ARIA labels
- [ ] PropTypes or TypeScript
- [ ] CSS organized and responsive
- [ ] Code splitting for large bundles
- [ ] Accessibility tests included
- [ ] API responses consistent format
- [ ] Dead code removed

### Lower Priority (Nice to Have)

- [ ] Security headers (Helmet)
- [ ] CSRF protection
- [ ] Distributed tracing
- [ ] Schema validation
- [ ] Component storybook
- [ ] Performance metrics tracked
- [ ] Database migrations managed
- [ ] Docker setup
- [ ] GraphQL instead of REST
- [ ] Monorepo tooling (Lerna, pnpm)

---

## Usage Tips

1. **For code reviews**: Go through relevant sections and check items as you review
2. **For audit**: Rate each section Green/Yellow/Red (all pass / some pass / many fail)
3. **For new projects**: Use as setup guide before writing code
4. **For improvements**: Prioritize by section, fix High Priority items first
5. **For onboarding**: Share with new team members to explain standards

---

## Related Resources

- ESLint Rules: https://eslint.org/docs/rules/
- React Docs: https://react.dev
- Express.js Security: https://expressjs.com/en/advanced/best-practice-security.html
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Web Accessibility: https://www.w3.org/WAI/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
