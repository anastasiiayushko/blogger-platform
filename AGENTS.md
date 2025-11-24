# Repository Guidelines

## Architectural Overview
- NestJS modular monolith: `src/main.ts` boots `AppModule`, which composes feature modules under `src/modules/*` (bloggers-platform, user-accounts, notifications, testing). Each module keeps its own `api/`, `application/`, `domain/`, and `infrastructure/` slices so controllers only delegate to use cases.
- CQRS-first design: `CoreModule` globally imports `@nestjs/cqrs` so every feature splits command handlers (`application/usecases`) from query handlers (`application/query-usecases`). Repositories also come in command/query pairs to keep writes isolated from read-model projections.
- Layered persistence: Entities extend `src/core/base-orm-entity/base-orm-entity.ts` for UUID PKs plus audit columns. `TypeOrmModule.forFeature` registers feature entities, and `TypeOrmModule.forRootAsync` (AppModule) wires PostgreSQL with the `SnakeNamingStrategy` and env-driven credentials.
- Cross-cutting services live in `src/core`: `CoreConfig`, `ThrottlerConfig`, and `DatabaseConfig` feed configuration to modules; global exception filters (`AllExceptionsFilter`, `DomainExceptionsFilter`) and the `ThrottlerGuard` are registered via `APP_FILTER`/`APP_GUARD`.
- HTTP stack setup happens in `src/setup`: `appSetup` applies global validation pipes (`pipesSetup`), sets the `/api` prefix, enables Swagger, and configures cookies/CORS in `main.ts`.
- Notifications are event-driven through `NotificationsModule`, which currently bootstraps `@nestjs-modules/mailer`. Replace hardcoded SMTP credentials with env-driven config before production.
- The read-model Testing API (`testing/testing.controller.ts`) exists solely for e2e resets. Keep it disabled or guarded outside automated test suites.

## Project Structure & Module Organization
- `src/app.module.ts` is the integration point: import new feature modules there, never inject controllers/services across modules directly.
- Feature folders mirror the DDD/CQRS naming (e.g., `blogs/application/usecases/create-blog.usecases.ts`, `blogs/infrastructure/blog.repository.ts`). Keep DTOs colocated with the layer they serve.
- Shared infrastructure (guards, interceptors, pipes, DTO templates, config helpers) belongs in `src/core`. Cross-cutting bootstrapping utilities stay in `src/setup`. Database migrations live in `migrations/`, and compiled assets go to `dist/`.
- Tests mirror source layout: colocate Jest unit specs next to the code (`*.spec.ts`). E2E suites live in `test/`, and coverage artifacts belong in `coverage/`.

## Configuration & Environment Management
- `src/dynamic-config-module.ts` centralizes env resolution. It loads, in order: `ENV_FILE_PATH`, `.env.${NODE_ENV}.local`, `.env.${NODE_ENV}`, and `.env.development`. Always set `NODE_ENV` and `ENV_FILE_PATH` in local shells.
- Config providers (CoreConfig, DatabaseConfig, UserAccountConfig, etc.) validate their inputs via `class-validator`. Prefer adding new settings to typed config classes instead of reaching into `ConfigService` directly.
- Database CLI commands reuse `typeorm.config.ts`, which shares the same env resolution as the app. Update this file whenever connection requirements change so both runtime and migrations stay in sync.
- Never commit real credentials—wire Mailer, JWT secrets, and OAuth keys through env variables and config factories. Use `.env.example` files when onboarding new variables.

## Build, Test, and Development Commands
- `yarn start:dev` – preferred local workflow; runs Nest in watch mode with testing safeguards.
- `yarn start`, `yarn start:debug`, `yarn start:prod` – default, inspector, and production builds respectively.
- `yarn build` – outputs transpiled bundles to `dist/`. Run before publishing migrations or deploying.
- `yarn lint` + `yarn format` – must both pass before committing. CI enforces ESLint/Prettier compliance.
- Database helpers: `yarn migration:generate -d typeorm.config.ts`, `yarn migration:run`, `yarn migration:revert`. Always inspect generated SQL into `migrations/` and verify `yarn build` afterward.

## Coding Style & Naming Conventions
- TypeScript everywhere; strict typing, 2-space indentation, and semicolons per Prettier defaults.
- Follow Nest standards: `feature.module.ts`, `feature.controller.ts`, `feature.service.ts`, `*.usecase.ts`, `*.query-repository.ts`, `*.entity.ts`, and `*.spec.ts`.
- Classes use PascalCase, providers/variables camelCase, constants UPPER_SNAKE_CASE. Avoid default exports.
- Prefer constructor injection and extend shared guards/pipes in `src/core` rather than duplicating logic. Keep controllers thin—business logic belongs in use cases.
- When adding query repositories, extend `BaseQueryRepository` to inherit common paging shapes.

## Testing Guidelines
- Jest drives all testing. Use descriptive names (`<Feature> / <Scenario> / <Expectation>`).
- Mock external collaborators via Nest module overrides instead of manual stubs. For CQRS handlers, test command/query handlers at the application layer and repository behavior with integration specs when touching SQL.
- Maintain ≥80% statement coverage (`yarn test:cov`). Attach coverage diffs or screenshots to PRs touching risky modules.
- The `/testing/all-data` endpoint truncates Postgres tables for e2e suites; never expose it beyond automated environments.

## Commit & Pull Request Practices
- Keep commits short and imperative (e.g., `add post rate limiter`, `run 23rd migration`). Separate unrelated concerns.
- Every PR should:
  - Link to the tracking ticket and summarize scope.
  - Call out migrations or config additions explicitly.
  - List verification commands (lint/test/run) and include Swagger/response screenshots for contract changes.
  - Request a second reviewer when touching shared modules (`src/core`, auth, database configs).

## Release & Migration Notes
- Connection settings live in `DatabaseConfig` + `.env`. Never hardcode credentials.
- Before cutting a release branch, run `yarn migration:run` locally and ensure `yarn build` and smoke tests pass to avoid drift between TypeORM metadata and PostgreSQL.
- Document any manual steps (seed scripts, feature flags, config toggles) in the PR description and update onboarding docs when new env vars or external services are introduced.
