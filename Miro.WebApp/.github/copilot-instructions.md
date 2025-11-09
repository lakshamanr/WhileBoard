# Copilot Instructions for Miro.WebApp

## Project Overview
- This is an Angular 20+ web application, generated with Angular CLI, structured for collaborative whiteboarding.
- Main features are split into authentication (`auth`), board collaboration (`board`), and shared services (`shared/services`).
- Real-time board updates are handled via SignalR (`SignalrService`).

## Architecture & Data Flow
- Routing is modular: `app.routes.ts` defines lazy-loaded modules for `auth` and `board`.
- `auth` module manages login and registration, with its own routing (`auth-routing.module.ts`).
- `board` module provides a collaborative canvas using `fabric.js`, with real-time sync via SignalR.
- SignalR events (`SendElement`, `ReceiveElement`) propagate board changes to all clients.
- Board state is managed locally with undo/redo and autosave (see `BoardComponent`).

## Developer Workflows
- **Start dev server:** `ng serve` or `npm start` (see tasks)
- **Run unit tests:** `ng test` or `npm test`
- **Build:** `ng build`
- **E2E tests:** `ng e2e` (framework not included by default)
- **Debug:** Use browser dev tools; inspect SignalR traffic for board sync issues.

## Key Patterns & Conventions
- **Routing:** Use lazy loading for major modules. Default route redirects to `auth`.
- **Services:** Shared services (e.g., SignalR) are provided in root and injected where needed.
- **Board Sync:** All board changes (add/modify) are sent to server via SignalR and received by all clients.
- **State Management:** Board history is tracked for undo/redo; autosave runs every 30s.
- **Component Structure:** UI logic is in components, business logic in services.
- **Export:** Board can be exported as JPG or PDF (see `BoardComponent`).

## External Dependencies
- `@microsoft/signalr` for real-time communication
- `fabric` for canvas manipulation
- `jsPDF`, `html2canvas` for export features

## Important Files
- `src/app/app.routes.ts`: Main routing config
- `src/app/app.config.ts`: Angular app config/providers
- `src/app/board/board.component.ts`: Board logic and SignalR integration
- `src/app/shared/services/signalr.service.ts`: SignalR service
- `src/app/auth/auth-routing.module.ts`: Auth routing

## Example: Board Sync
```typescript
// Send element to server
this.signalrService.sendElement(opt.target.toObject(), this.boardId);
// Listen for elements from server
this.signalrService.addElementListener((element) => { ... });
```

## Conventions
- Prefer Angular CLI for scaffolding and builds
- Use modular routing and lazy loading
- Inject shared services via constructor
- Keep business logic in services, UI logic in components

---
_If any section is unclear or missing, please provide feedback for improvement._
