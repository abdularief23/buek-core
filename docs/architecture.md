# Buek Core Architecture

Buek Core is a reusable AI platform. The platform separates shared AI capabilities from
industry-specific knowledge so each vertical can be added as a domain module.

## Folder Structure

```text
apps/
  web/
  api/
domains/
  manufacturing/
packages/
  ai-core/
  agents/
  knowledge/
  memory/
  prompts/
  shared-types/
  tools/
  ui/
  workflows/
docs/
docker/
```

## Apps

### `apps/web`

React, TypeScript, Vite, and Tailwind CSS application. It is the user-facing shell for demos and
future AI worker interfaces. It depends on shared UI components and talks to the API over HTTP.

### `apps/api`

Node.js, Express, TypeScript, Prisma API. It owns runtime composition: it loads the AI Core,
discovers installed domain modules, registers them, and exposes platform endpoints.

## Domain Modules

### `domains/manufacturing`

The first production vertical. Manufacturing exports a `DomainModule` with its own knowledge,
tools, prompts, workflows, and agent configuration. It does not modify or live inside AI Core.

Future verticals such as website builder, customer support, sales, HR, maintenance, and business
operations should follow this shape.

## Packages

### `packages/ai-core`

Reusable AI platform core. It provides the domain module registry and OpenAI Responses client
factory. It must not contain manufacturing-specific knowledge.

### `packages/agents`

Agent system layer. It discovers installed domain modules and installs them into the core registry.
This is where future OpenAI Agents SDK integration can be added.

### `packages/memory`

Reusable memory abstraction for conversation or worker state. The current implementation is an
in-memory foundation that can be replaced by durable storage later.

### `packages/knowledge`

RAG-ready knowledge index abstraction. Domain modules contribute knowledge sources; retrieval and
embedding pipelines can be added behind this package.

### `packages/tools`

Tool registry abstraction. Domain modules declare tool definitions here without forcing AI Core to
know industry implementation details.

### `packages/workflows`

Workflow registry abstraction. Domain modules can declare reusable workflows composed of named
steps.

### `packages/prompts`

Prompt library abstraction. Shared prompts and domain prompts can be registered without coupling
prompt text to API routes.

### `packages/shared-types`

Shared TypeScript contracts for domain modules, knowledge, tools, prompts, workflows, agents, and
registry snapshots. This keeps boundaries explicit.

### `packages/ui`

Shared React UI primitives used by frontend apps.

## Supporting Folders

### `docs`

Architecture and project documentation.

### `docker`

Dockerfiles and Nginx configuration used by Docker Compose.

## Clean Architecture Boundaries

- AI Core owns platform-level contracts and registry behavior.
- Agent System composes the core with installed domain modules.
- Domain modules own industry knowledge and configuration.
- Apps consume packages but should not contain reusable platform logic.
- Manufacturing is a plugin, not a dependency of AI Core.

## Hackathon Focus

The foundation is intentionally small. The next useful demo milestone is:

1. API receives a question.
2. Manufacturing module is discovered and registered.
3. AI answer is grounded in Manufacturing knowledge.
4. Demo is deployed behind `core.buekwebsite.com`.
