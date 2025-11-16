# Contributing to CantonDEX

## Development Process

### 1. Create Feature Branch

```bash
git checkout -b feature/EPIC-XX-short-description
# Example: feature/EPIC-02-matching-engine
```

### 2. Make Changes

- Follow code style guidelines
- Write tests for new features
- Add documentation
- Create ADR if major architectural decision

### 3. Commit Changes

```bash
git add .
git commit -m "EPIC-XX: Title

Description of changes:
- Bullet point 1
- Bullet point 2

Fixes #issue-number (if applicable)"
```

### 4. Create Pull Request

- Fill out PR template completely
- Link to related issues
- Assign reviewers
- Ensure CI/CD passes

### 5. Code Review

- Address reviewer comments
- Make requested changes
- Request re-review

### 6. Merge to Main

- Ensure all CI/CD checks pass
- At least 2 approvals required
- Squash commits before merge (if desired)

---

## Code Style

### Python

```bash
# Format with Black
black . --line-length 100

# Lint with Pylint
pylint src/ tests/

# Type checking with Mypy
mypy src/
```

### Rust

```bash
# Format with Rustfmt
cargo fmt

# Lint with Clippy
cargo clippy -- -D warnings
```

### TypeScript/JavaScript

```bash
# Format with Prettier
npx prettier --write .

# Lint with ESLint
npm run lint
```

### Daml

```bash
# Format with Daml
daml format

# Type check
daml build
```

---

## Testing Requirements

### Unit Tests
- Minimum 80% code coverage
- Run locally before committing
- Use appropriate test frameworks

### Integration Tests
- Test component interactions
- Use Docker Compose for dependencies
- Run in CI/CD pipeline

### Performance Tests
- Benchmark critical paths (matching engine, settlement)
- Compare against targets
- Document results

```bash
# Run all tests
./scripts/test.sh

# Run specific tests
pytest tests/test_settlement.py -v

# Check coverage
pytest --cov=src tests/
```

---

## Security Guidelines

### 1. Encryption

- Use AES-256 for data at rest
- Use TLS 1.3 for data in transit
- Never hardcode secrets
- Store secrets in Vault/environment variables

### 2. Authentication

- Always validate JWT tokens
- Use RBAC for authorization
- Check party ownership before allowing access
- Log authentication failures

### 3. Audit Trail

- Log all state-changing operations
- Include: timestamp, actor, action, before/after state
- Use salted hashes for audit log integrity
- Retain logs per regulatory requirements

### 4. Data Protection

- Apply GDPR principles (minimization, purpose limitation, etc.)
- Implement data retention policies
- Support right-to-forget (via salted hash redaction)
- Encrypt PII at rest and in transit

---

## Documentation

### Code Comments
- Explain WHY, not WHAT (code shows what)
- Comment complex algorithms
- Add examples for non-obvious behavior

### Architecture Decision Records (ADRs)

Template:
```
# ADR-XXX: Title

Status: PENDING_DECISION (or ACCEPTED / REJECTED / SUPERSEDED)

## Context
What problem are we solving?

## Decision
What did we decide?

## Consequences
What are the positive + negative impacts?

## Alternatives Considered
What other options did we evaluate?
```

Location: `docs/adr/ADR-XXX-Title.md`

### API Documentation
- Use OpenAPI 3.0 format
- Include examples for each endpoint
- Document error codes and responses
- Generate from code using automated tools

---

## Commit Message Convention

```
TYPE: Subject (max 50 chars)

Detailed body (wrap at 72 chars):
- Explain the problem being solved
- Describe the solution
- List any side effects or implications

Fixes #issue-number (if closing issue)
Related-To: #other-issue-number
```

### Types
- `EPIC-XX`: Major feature/epic
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test additions/updates
- `docs`: Documentation only
- `chore`: Build, deps, etc.

---

## CI/CD Pipeline

### Automated Checks

1. **Build & Compile**
   - Daml: `daml build`
   - Rust: `cargo build --release`
   - Python: `python -m py_compile`
   - TypeScript: `tsc --noEmit`

2. **Linting & Format**
   - Static analysis (Checkmarx, pylint, clippy)
   - Format checking (Black, Rustfmt, Prettier)
   - Type checking (Mypy, Typescript, Daml-LF)

3. **Testing**
   - Unit tests (>80% coverage)
   - Integration tests
   - Security tests (SAST, dependency scan)
   - Container image scanning (Trivy)

4. **Quality Gates**
   - No high/critical security issues
   - Coverage must not decrease
   - All linting issues resolved
   - Performance benchmarks within bounds

---

## Performance Targets

| Component | Target | Method |
|-----------|--------|--------|
| Order Processing | <1ms P99 | Rust benchmarks |
| Settlement | <2s | Integration test timing |
| API Response | <50ms P95 | Load test results |
| Compilation | <5min | Build timing |
| Test Suite | <10min | CI/CD timing |

---

## Questions?

- Open an issue for discussions
- Ask in #dev-discussion Slack channel
- Reach out to maintainers

---

**Contributing Version**: 1.0.0
**Last Updated**: 2025-11-16
