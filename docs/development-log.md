# Development log

## Project setup
Branch: `feature/project-setup`

- Reused the existing Java 21 / Spring Boot 4 and React / TypeScript foundation.
- Replaced obsolete project documentation and CI checks referring to missing files.
- Saved the requested workflow in `docs/workflow.md`; created the MVP status checklist.
- Validation: Maven tests, frontend lint, unit tests and production build.
- Limitations: business features follow in separate branches; no authentication in MVP.

## Database setup
Branch: `feature/database-setup`

- Added PostgreSQL Docker service with persistent storage and healthcheck, JDBC, Flyway, and environment configuration.
- Files: `compose.yaml`, `backend/pom.xml`, application and test YAML, CI PostgreSQL service.
- Tests: Spring context and actual SQL connection on H2 and Docker PostgreSQL.
- Decision: port 55432 avoids the existing local PostgreSQL container; tests can target either database.
- Limitations: local development database credentials; business migrations follow with each feature.
