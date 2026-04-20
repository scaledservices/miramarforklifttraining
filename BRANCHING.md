# Branch Strategy & Version Control

## Branch Model

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Production-ready code | Production (forkliftcertified.training) |
| `staging` | Pre-release testing | Staging environment |
| `feature/*` | New features | — |
| `fix/*` | Bug fixes | — |
| `release/*` | Release preparation | — |

## Workflow

1. Create a feature branch from `main`:
   ```
   git checkout -b feature/add-crane-training main
   ```

2. Develop and commit with conventional messages (see below).

3. Push and open a Pull Request to `main`.

4. After review and approval, merge via squash merge.

5. Tag releases on `main` after merging.

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, dependency updates |
| `perf` | Performance improvement |
| `security` | Security fix or hardening |

### Scopes

Use the affected area: `auth`, `lms`, `checkout`, `admin`, `seo`, `email`, `pdf`, `api`, `ui`, `db`, `config`.

### Examples

```
feat(lms): add quiz retry with cooldown timer
fix(checkout): prevent double-charge on rapid submit
refactor(config): extract brand values to config/brand.ts
docs: update deployment checklist for custom domain
security(auth): add CSRF state validation to OAuth flow
```

## Version Tagging

Use semantic versioning: `vMAJOR.MINOR.PATCH`

| Version | Meaning |
|---------|---------|
| `v1.0.0` | First production release |
| `v1.1.0` | New feature added |
| `v1.0.1` | Bug fix release |

Tag a release:
```bash
git tag -a v1.0.0 -m "Production launch: forklift training platform"
git push origin v1.0.0
```

## Rollback Strategy

### Quick Rollback (Replit)
Replit maintains automatic checkpoints. Use the Replit dashboard to revert to a previous checkpoint if a deployment causes issues.

### Git Rollback
```bash
# Revert the last merge commit
git revert -m 1 HEAD
git push origin main

# Or reset to a known-good tag
git reset --hard v1.0.0
git push --force origin main  # Use with extreme caution
```

### Database Rollback
Migrations are forward-only SQL files in `migrations/`. If a migration causes issues:
1. Write a compensating migration that reverses the changes.
2. Never delete or edit existing migration files.

## For Future Platform Clones

When creating a new training platform (e.g., crane operator training):

1. Fork this repository on GitHub.
2. Update `config/brand.ts`, `config/industry.ts`, and `config/theme.ts`.
3. Replace assets in `client/public/images/` and `server/assets/`.
4. Re-seed the database with new course content.
5. Deploy to a new Replit project with its own domain.

See the brand configuration files (`config/brand.ts`, `config/industry.ts`, `config/theme.ts`) for the full list of values to change. A `CONFIG_GUIDE.md` will be created as part of the brand configuration refactor task.
