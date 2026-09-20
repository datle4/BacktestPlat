# Codex Autonomous Development & Git Workflow

This project should be treated as a long-running software development project.

Codex is expected to implement the project from the initial setup until the MVP Definition of Done is satisfied.

Do not implement the entire project as one large change.

Development must be divided into small, independently understandable features. Each feature must have its own Git branch, commits, tests, and GitHub history.

---

## 1. General Development Mode

Work continuously through the project specification from beginning to end.

The project should be implemented incrementally.

For each feature:

```text
Understand feature
      ↓
Update local main
      ↓
Create feature branch
      ↓
Implement
      ↓
Build / Test
      ↓
Fix errors
      ↓
Commit
      ↓
Push feature branch
      ↓
Merge into main
      ↓
Push main
      ↓
Start next feature
```

Do not combine unrelated features into one branch.

Do not create one giant implementation commit.

---

# 2. Git Repository

The repository already uses GitHub.

Before development begins:

```bash
git status
git branch
git remote -v
```

Verify that:

```text
main
```

is the primary branch.

Do not rewrite Git history.

Do not use:

```bash
git push --force
```

unless explicitly instructed.

---

# 3. Branch Strategy

Every meaningful feature must be implemented in its own branch.

Use the following naming convention:

```text
feature/<feature-name>
```

Examples:

```text
feature/project-setup

feature/database-setup

feature/stock-entity

feature/historical-price-storage

feature/market-data-api

feature/market-data-provider

feature/daily-stock-scheduler

feature/backtest-request

feature/mock-quant-service

feature/backtest-engine

feature/order-execution

feature/portfolio-engine

feature/performance-metrics

feature/quant-api-integration

feature/backtest-frontend

feature/result-dashboard

feature/equity-curve

feature/trade-history

feature/docker-setup
```

For bugs discovered later:

```text
fix/<bug-name>
```

Example:

```text
fix/backtest-next-day-execution
```

For refactoring:

```text
refactor/<scope>
```

Do not use generic branch names such as:

```text
test
new
update
branch1
dev2
```

---

# 4. Starting a Feature

Before starting every new feature, return to the latest `main`.

Conceptually:

```bash
git checkout main
git pull origin main
```

Then create the feature branch:

```bash
git checkout -b feature/<feature-name>
```

Never start a new independent feature from an old feature branch.

Each feature should start from the latest stable version of `main`.

---

# 5. Feature Scope

One branch should represent one understandable unit of functionality.

Good example:

```text
feature/historical-price-storage
```

May include:

```text
StockPrice entity
StockPriceRepository
database migration/schema changes
DTOs directly required by this feature
tests for StockPrice persistence
```

Bad example:

```text
feature/backend
```

containing:

```text
database
scheduler
backtesting
AI integration
authentication
frontend
Docker
```

Keep branches small enough that their purpose can be understood from their name.

However, do not split extremely small changes into unnecessary branches.

The goal is:

```text
one meaningful feature
=
one branch
```

---

# 6. Implementation Rules

Before modifying code for a feature:

Inspect the relevant existing code first.

Understand the existing architecture and reuse existing patterns.

Do not recreate functionality that already exists.

Do not modify unrelated files unless the change is required for the feature.

Do not introduce new frameworks or infrastructure without a clear requirement from this specification.

Do not add:

```text
Redis
Kafka
RabbitMQ
Keycloak
JWT
Kubernetes
Microservices
authentication
user management
```

unless the specification is explicitly changed later.

---

# 7. Build and Test Before Commit

Before committing a feature, ensure the relevant project builds successfully.

For Spring Boot:

```bash
./mvnw test
```

or the appropriate Maven command for the repository.

For Angular:

```bash
npm run build
```

Run available tests relevant to the feature.

If tests fail because of the feature:

Fix them before committing.

Do not knowingly commit code that does not compile.

Do not knowingly push a broken feature.

---

# 8. Commit Strategy

Use clear Git commits.

Prefer Conventional Commit style.

Examples:

```text
feat: add stock entity and repository

feat: add historical stock price API

feat: add daily market data scheduler

feat: implement backtest execution engine

feat: integrate quant signal API

feat: add backtest result dashboard

fix: prevent duplicate daily stock prices

fix: execute signals at next trading day open

refactor: separate portfolio logic from backtest service
```

Avoid commit messages such as:

```text
update

fix

test

changes

done

final
```

A branch may contain multiple commits if the implementation naturally has multiple steps.

Do not create meaningless commits after every tiny line change.

---

# 9. Push Every Feature Branch

Once the feature:

```text
compiles
passes relevant tests
works as expected
```

push the branch to GitHub.

Example:

```bash
git push -u origin feature/historical-price-storage
```

The remote branch must be preserved on GitHub so that the development history can be inspected later.

Do not delete remote feature branches automatically.

They may be useful for reviewing the project's development process.

---

# 10. Merge Strategy

After a feature branch has been successfully implemented, tested, committed, and pushed, merge it into `main`.

Preferred workflow:

```text
feature branch
     ↓
GitHub
     ↓
merge into main
     ↓
main becomes new stable baseline
```

If GitHub CLI or GitHub integration is available, creating a Pull Request is preferred.

Example conceptual flow:

```text
feature/backtest-engine
        ↓
Pull Request
        ↓
main
```

The Pull Request title should clearly describe the feature.

Example:

```text
Implement backtest execution engine
```

The Pull Request description should briefly state:

```text
what was implemented
important architectural decisions
tests performed
important limitations
```

After the feature is merged:

```bash
git checkout main
git pull origin main
```

Then start the next feature from the updated `main`.

---

# 11. Dependency Rule

Some features depend on previous features.

For example:

```text
Stock storage
      ↓
Historical data API
      ↓
Quant integration
      ↓
Backtest engine
      ↓
Result dashboard
```

Therefore, features should generally be completed and merged sequentially.

Do NOT create all feature branches from the initial empty project.

Later features should use the stable code produced by earlier features.

---

# 12. Recommended Feature Order

Use approximately this development order:

```text
feature/project-setup

        ↓

feature/database-setup

        ↓

feature/stock-storage

        ↓

feature/historical-price-storage

        ↓

feature/historical-price-api

        ↓

feature/market-data-provider

        ↓

feature/daily-market-data-scheduler

        ↓

feature/frontend-backtest-form

        ↓

feature/mock-quant-service

        ↓

feature/backtest-domain

        ↓

feature/order-execution

        ↓

feature/portfolio-engine

        ↓

feature/backtest-engine

        ↓

feature/performance-metrics

        ↓

feature/backtest-result-api

        ↓

feature/result-dashboard

        ↓

feature/equity-curve

        ↓

feature/trade-history

        ↓

feature/quant-api-integration

        ↓

feature/docker-setup

        ↓

final testing and cleanup
```

The exact boundaries may be adjusted when necessary, but keep the same incremental philosophy.

---

# 13. Mock AI First

Do not wait for the real Quant model before building the platform.

Initially implement:

```text
QuantSignalProvider
```

with:

```text
MockQuantSignalProvider
```

The mock provider should return deterministic signals that make backtesting easy to verify.

Example:

```text
2025-01-10 BUY

2025-02-10 SELL

2025-03-05 BUY

2025-04-01 SELL
```

This allows the complete application to be developed independently from the real AI.

Later create:

```text
HttpQuantSignalProvider
```

which calls the Python Quant service.

The Backtest Engine must not require major changes when switching from the mock provider to the real Quant provider.

---

# 14. Architecture Boundary

Maintain the following responsibility boundary throughout development:

```text
Market Data
     ↓
Quant Model
     ↓
BUY / SELL / HOLD
     ↓
Backtest Engine
     ↓
Order Execution
     ↓
Portfolio
     ↓
Performance Metrics
```

The Quant model is responsible for deciding:

```text
BUY
SELL
HOLD
```

The Spring Boot backend is responsible for:

```text
execution date

execution price

quantity

available cash

positions

fees

trade records

portfolio value
```

Do not move order execution logic into the AI service.

---

# 15. Backtest Correctness

Avoid look-ahead bias.

If a signal is generated using the closing data of trading day `T`:

```text
Signal:
Day T

Execution:
Next available trading day OPEN
```

Do not execute at the closing price of Day T.

The next trading day must be determined from actual available market data rather than simply doing:

```text
date + 1 day
```

because weekends and market holidays exist.

For example:

```text
Friday signal
     ↓
Monday open execution
```

if Monday is the next trading session.

---

# 16. Database Integrity

Historical price records must not be duplicated.

Use a database constraint equivalent to:

```text
stock_id + trading_date UNIQUE
```

Scheduled data ingestion must be idempotent.

Running the scheduler multiple times for the same trading date must not create duplicate prices.

---

# 17. Error Handling

Handle expected failures cleanly.

Examples:

```text
stock does not exist

invalid backtest date range

historical data unavailable

AI service unavailable

AI response invalid

not enough historical data

no next trading day exists

database failure
```

Do not silently ignore failures.

Return understandable API errors.

Log technical details on the backend.

---

# 18. Development Log

Maintain a project development file:

```text
docs/development-log.md
```

After completing each feature, append a short entry containing:

```text
feature name

branch name

what was implemented

important files

important design decisions

tests performed

known limitations
```

Example:

```text
## Historical Price Storage

Branch:
feature/historical-price-storage

Implemented:
- StockPrice entity
- StockPriceRepository
- unique stock/date constraint

Tests:
- application build
- repository persistence test

Notes:
Stock prices currently support daily OHLCV data only.
```

This file should provide a readable history of how the system was built.

---

# 19. Project Status

Maintain:

```text
docs/project-status.md
```

Use simple states:

```text
TODO
IN PROGRESS
DONE
```

Example:

```text
[DONE] Project setup

[DONE] Database setup

[DONE] Stock storage

[IN PROGRESS] Historical price ingestion

[TODO] Backtest engine

[TODO] Quant API integration

[TODO] Result dashboard
```

Update this file after each completed feature.

This allows development to resume correctly even if the Codex session changes.

---

# 20. README

Keep the root:

```text
README.md
```

updated as the application evolves.

By project completion, README should contain:

```text
project purpose

architecture

technology stack

local setup

database setup

backend startup

frontend startup

environment variables

Quant API configuration

how to run a backtest

Docker instructions

API overview
```

Do not wait until the very end to reconstruct important setup information from memory.

---

# 21. Final Integration Testing

After all required features have been merged, create:

```text
test/final-integration
```

or an equivalent final testing branch.

Run the full application flow:

```text
Historical data exists
      ↓
Open frontend
      ↓
Select stock
      ↓
Select backtest dates
      ↓
Enter initial capital
      ↓
Run backtest
      ↓
Quant service produces signals
      ↓
Backend executes trades
      ↓
Portfolio is calculated
      ↓
Metrics are generated
      ↓
Frontend displays results
```

Verify the complete MVP Definition of Done.

Fix any integration problems in dedicated:

```text
fix/*
```

branches.

---

# 22. Completion Criteria

Do not consider the project complete simply because all planned source files exist.

The project is complete only when:

```text
backend builds successfully

frontend builds successfully

database setup works

historical stock data can be stored

daily updating works

a backtest can be started from the frontend

historical data reaches the Quant provider

signals are processed chronologically

trades are simulated

portfolio values are calculated

performance metrics are generated

equity curve is displayed

trade history is displayed

real Quant API can replace the mock provider

README contains working setup instructions
```

The final repository should have a clean Git history showing how the project evolved feature by feature.

---

# 23. Final Codex Behaviour

You are responsible for driving the implementation forward.

Do not stop after creating an architecture or TODO list.

Do not only generate pseudocode.

Implement working code.

When one feature is complete:

```text
test it
commit it
push its branch
merge it
update documentation
continue to the next feature
```

Continue until the MVP Definition of Done is satisfied.

At all times prioritize:

```text
correctness
simplicity
maintainability
clear Git history
working software
```

over unnecessary architectural complexity.
