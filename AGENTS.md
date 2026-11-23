# NAS Super Admin — working rules for AI agents

Read this whole file before you create or change anything in this project. It applies to every feature, fix and refactor. `CLAUDE.md` loads this same file, so Claude Code and Codex follow the same rules.

## What this project is

- **NAS Super Admin** manages companies, licenses, and platform settings for multiple customer companies.
- Angular 20, **zoneless** (`provideZonelessChangeDetection()`), standalone components, PrimeNG 20, PrimeFlex, PrimeIcons, ngx-translate 17.
- Built on the shared library **`@mohammed_a4rf/core-ui`**: design system, API wrapper, interceptors, auth guard, language, app shell, page toolbar, filter, table, dialogs and form inputs.
- Sibling projects in `C:\2B\NEW HR SYSTEM`:
  - `2b-core-ui` — the library source. Its rules are in `2b-core-ui/.claude/CLAUDE.md`.
  - `HR-front-end` — the HR app. The library code came from there, and this app follows the same conventions.

## Use `@mohammed_a4rf/core-ui` first

Before creating a service, interceptor, guard, layout, component, input, directive, pipe, validator, util, model or style, check the shared library first. Read the library docs.

| Import | What is inside | Docs |
|---|---|---|
| `@mohammed_a4rf/core-ui` | `provideCoreUi`, `CORE_UI_CONFIG`, `ApiService`, `LanguageService`, `TokenService`, `NotificationService`, interceptors, `authGuard`, `MultiTranslateLoader` | `core.md` |
| `@mohammed_a4rf/core-ui/utils` | `GlobalResponse`, `DropdownOrEnum`, `ButtonSeverity`, `BadgeSeverity`, SVG icons, date / filter / format / form-data utils, validators | `utils.md` |
| `@mohammed_a4rf/core-ui/shared` | `new-theme-page-toolbar`, `app-filter-component`, `app-reusable-table`, dialogs, `ConfirmDialogService`, form inputs, directives, pipes | `shared.md` |
| `@mohammed_a4rf/core-ui/layout` | `app-layout` (topbar + sidebar + routed page), not-found page, breadcrumb | `layout.md` |
| `@mohammed_a4rf/core-ui/styles` | SCSS design system: tokens, buttons, inputs, badges, PrimeNG overrides, page layout classes | `styles.md` |

The docs live in `node_modules/@mohammed_a4rf/core-ui/docs/` once the package is installed. They are also in the library source at `../2b-core-ui/projects/2b/core-ui/docs/`. The setup steps are in that folder's `README.md`.

Rules:

- **Never copy library code into this app.** Import it from the package path (`import { ApiService } from '@mohammed_a4rf/core-ui'`).
- **Never edit files in `node_modules/@mohammed_a4rf/core-ui`.**
- If a reusable piece needed for the current work is missing, add and export it in `2b-core-ui` by following `2b-core-ui/.claude/CLAUDE.md`. This applies when Super Admin is the first app that needs it. Consume it from the shared package once the maintainer releases it.
- Keep Super Admin routes, backend-specific services, permissions, and business rules in this app.
- The library has **no permission logic**. Actions, buttons, filter inputs and menu items are hidden only with `visible: false` or `visibleWhen(...)`.

## Keep It Simple (No Over-Engineering)

Build exactly what the task asks for, in the simplest way that fits the patterns in this file. When in doubt, write less code.

- Do only what was asked. No extra features, options, inputs, outputs or "nice to have" behaviour that the task, the design or the API does not need.
- Do not build for the future. No abstractions, generic helpers, base classes, factories, facades, wrappers or config objects "in case we need it later". Add one only when a second real use exists now.
- Prefer what `@mohammed_a4rf/core-ui` and this app already have over writing new code. Do not create a shared component, service or util for something used once.
- Keep code where it is used: a helper used by one component stays a private method in that component.
- No barrel `index.ts` files, and no file whose only job is to re-export or wrap other files.
- No extra layers between a component and its feature service (no repository, store, adapter or mapper).
- No state management libraries. Do not add RxJS pipelines, signals or computed values when a plain property or one subscription does the job.
- Do not refactor, rename or reformat code the task does not touch.
- Keep types readable. Write interfaces out plainly (optional fields with `?`) instead of `Omit` / `Pick` / `Partial`. `Record` is fine for key → value maps.
- Use a plain object instead of a `Map` when the keys are strings or numbers and order does not matter.
- No defensive code for cases that cannot happen: no extra null checks on required API fields, no try/catch around code that cannot throw, no fallback values the API never needs.
- If a simple solution and a "more flexible" one both work, choose the simple one. If you think a bigger design is really needed, say so and ask first.

## Project Shape

```text
src/app/
  core/        app-wide infrastructure of THIS app only (shell, auth pages, route constants)
  feature/     business domains and screens
  shared/      reusable, business-neutral UI used by more than one feature of this app
  app.routes.ts
  app.config.ts
public/
  assets/i18n/en.json, assets/i18n/ar.json   app translations (MultiTranslateLoader reads assets/i18n/{lang}.json)
```

### `core`

- The shell component that renders `<app-layout>` with the sidebar menu and the user.
- The login page and the auth service that calls the login endpoint.
- App route constants (`AppRoutes`, an `as const` object).

Do not put feature business rules in `core`. Do not rebuild in `core` anything the library already gives (API wrapper, interceptors, guard, token, language, toast, layout).

### `feature`

Each feature owns its routes, components, services and models:

```text
src/app/feature/manage-companies/
  components/
    companies-list/
      company-form/          form or dialog content lives inside the page that owns it
  models/
    company.interface.ts
  services/
    company.service.ts
  manage-companies.routes.ts
```

- Keep a component inside the feature when only that feature uses it.
- Do not split a page into child components that are used once and have no state, API calls or dialogs of their own. Write that code in the page component.
- Keep a separate component when it has its own state and behaviour, when it is dialog content opened through `ConfirmDialogService`, or when more than one page uses it.
- A side panel's `p-drawer` lives in the page that opens it, never inside the panel's content component. The content component takes inputs and emits events (`saved`, `discarded`), not a `visible` / `visibleChange` pair.
- Add a `config/<feature>.config.ts` only for a big feature with many pages that share links and constants. A small feature keeps them in its components.

### `shared`

Use this folder for Super Admin-specific code shared by more than one feature. Put business-neutral building blocks in `@mohammed_a4rf/core-ui`. Keep code tied to one feature inside that feature.

## Routing And Breadcrumbs

- `app.routes.ts` only wires top-level routes (login, the shell with `authGuard`, not-found) and lazy-loads each feature's route file. Feature route tables live in `feature/<name>/<name>.routes.ts`.

```ts
{
  path: AppRoutes.Companies,
  loadChildren: () => import('./feature/manage-companies/manage-companies.routes').then((m) => m.manageCompaniesRoutes),
}
```

- Every page sets `data: { breadcrumb: 'breadcrumb.companies.list' }`. The page toolbar and the browser title read it. The key must exist in both translation files.
- Sidebar entries go in the shell's `menuGroups` (`SidebarGroupLink[]`). Labels are translation keys.

## Standard List Page

Any screen with a searchable or filterable table uses this structure. Do not build custom tables, pagination, loading blocks or empty states.

```html
<new-theme-page-toolbar [actions]="actions"></new-theme-page-toolbar>

<div class="newTheme-layout">
  <div class="content-container">
    <div class="filter-container">
      <app-filter-component [filterConfig]="filterConfig" (filterChange)="getSelectedFilters($event)"></app-filter-component>
    </div>
    <div class="table-container p-2">
      <app-reusable-table
        [emptyState]="emptyState"
        [skeletonConfig]="skeletonConfig"
        [loading]="loading()"
        [data]="items()"
        [tableConfig]="tableConfig"
        [rowActions]="rowActions"
        [menuActions]="menuActions"
        [totalRecords]="totalRecords()"
        (sortChange)="onSort($event)"
        (pageChange)="onPageChange($event)">
      </app-reusable-table>
    </div>
  </div>
</div>
```

- `new-theme-page-toolbar`: pass only `actions` (or `buttons`). Do not pass `breadcrumbItems` or `toolbarType`; breadcrumbs come from the route.
- Row menus: `menuActions` show only behind a `show-menu` row action, so pass both `rowActions = [{ action: 'show-menu' }]` and `menuActions`.
- Write a one- or two-line column or action callback (`valueFormatter`, `badgeColorField`, `visibleWhen`) as an arrow function in the config, not as a class method.
- A client-side export on a server-side table requests all rows that match the current filters (`pageNumber: 1`, `pageSize: totalRecords || 1000000`), not only the loaded page.
- Do not clear the table selection or hide the floating bar after an action succeeds. A delete removes only the deleted rows.

## Signals And Zoneless

The app is zoneless: change detection runs only after a signal change, a template event, an input change, an `async` pipe value or `markForCheck()`.

- Template state that changes after async work (HTTP, timers, router events, `valueChanges`) is a **signal**: `items = signal<Company[]>([])`, `loading = signal(true)`, `totalRecords = signal(0)`.
- Pass the value in templates (`[loading]="loading()"`), never the signal object (`[loading]="loading"`).
- Stable configuration (`filterConfig`, `tableConfig`, `actions`, `menuActions`, `emptyState`, `skeletonConfig`) stays as plain properties set in the class, not object literals in the template.
- No `NgZone`, no `zone.js`, no `setTimeout` to "wake up" change detection.

## API Pattern And Error Handling

All HTTP calls go through `ApiService` from `@mohammed_a4rf/core-ui`. Components never build API URLs.

### One service per main endpoint

The first segment of the URL decides the service. Each main endpoint has exactly one service, and no two services call the same main endpoint.

```ts
@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);
  private readonly endPoint = 'Company';

  private readonly licenses = 'Licenses';

  // ==========================================================================
  // Companies list and form
  // ==========================================================================

  getCompanies(body: CompanyFilter): Observable<GlobalResponse<Company[]>> {
    return this.api.post<GlobalResponse<Company[]>>(this.endPoint, body);
  }

  // ==========================================================================
  // Licenses (company details page)
  // ==========================================================================

  getLicenses(companyId: number): Observable<GlobalResponse<CompanyLicense[]>> {
    return this.api.get<GlobalResponse<CompanyLicense[]>>(`${this.endPoint}/${companyId}/${this.licenses}`);
  }

  // ==========================================================================
  // Lookups (dropdowns and enums used by the company forms)
  // ==========================================================================

  getStatuses(): Observable<GlobalResponse<DropdownOrEnum[]>> {
    return this.api.getEnum('GetCompanyStatus');
  }
}
```

- Return `Observable<GlobalResponse<T>>` directly. No `*Res` type aliases, and do not copy the wrapper's fields into feature interfaces.
- Do not add an abstract CRUD base class for services to extend.
- Build multipart bodies with `objectToFormData(...)` from `@mohammed_a4rf/core-ui/utils`; never hand-build `FormData`.
- If a service calls a different API server, pass that server's root as the `baseUrl` argument, and make sure the same root is listed in `additionalApiUrls` in `provideCoreUi` so it gets the token and the toasts.

### Toasts and errors

- Success and error toasts are shown by the library interceptors. **Do not** show generic success or error messages in components or services.
- The backend can return HTTP 200 with an error in the body. Every success handler checks `isApiError(res)` (from `@mohammed_a4rf/core-ui/utils`) and stops if it is an error:

```ts
this.companyService.getCompanies(payload).subscribe({
  next: (res) => {
    if (isApiError(res)) return;
    this.items.set(res.data);
    this.totalRecords.set(res.totalItems ?? 0);
  },
  error: () => this.loading.set(false),
});
```

### Models

- One model file per service, named after the main endpoint (`company.interface.ts`), with the same section comments as the service.
- Interfaces a component needs (filters, query shapes, form tabs) go in the model file, not in the component file.
- Use `GlobalResponse`, `DropdownOrEnum`, `ButtonSeverity` and `BadgeSeverity` from `@mohammed_a4rf/core-ui/utils`; never redeclare them.

### Backend enums

- Load every backend enum with `ApiService.getEnum(name)` in the feature service's `Lookups` section. No TypeScript `enum`, no hard-coded option list, no label map.
- Show the backend `name` as the label; do not translate it.
- When code must branch on a value, compare the **backend id** from one `as const` object in the model file, never the list index or the name:

```ts
/** Ids of `Enums/GetCompanyStatus`. */
export const COMPANY_STATUS = { Active: 1, Suspended: 2 } as const;
export type CompanyStatus = (typeof COMPANY_STATUS)[keyof typeof COMPANY_STATUS];
```

- Front-end-only values (view modes, tab ids) are also `as const` objects, never TypeScript `enum`s.

## Class Layout

Every property goes above the first method. Order the class top to bottom:

1. Injected dependencies (`private readonly x = inject(X)`), then `destroyRef` / `destroy$`.
2. `@Input()`s / `input()`s, then `@Output()`s / `output()`s, then view and content queries.
3. Constants and configuration (`readonly` values, `filterConfig`, `tableConfig`, toolbar actions, menu items, empty states).
4. State: signals and properties the template reads, then forms (`form!: FormGroup`).
5. Private state.
6. Constructor (only if it does more than inject), then lifecycle hooks in Angular order.
7. Public methods in the order the page uses them; template-only helpers last.
8. Private methods.

Use `inject()`, not constructor parameters. Keep `ngOnInit` to a list of named calls: `initForm()`, `loadX()`, `listenToX()`. No subscriptions or API logic written inline in `ngOnInit`.

## Forms

- Reactive forms only, built with the injected `FormBuilder` inside `initForm()`, typed as plain `FormGroup` / `FormArray` / `FormControl`.
- No `new FormGroup(...)`, no forms in property initializers, no typed form aliases.
- Read controls with `form.get('name')`, not `form.controls['name']`.
- Wrap each labeled form control in `.our-field`. Use `.bold-label` for bold labels and `class="our-field bold-label"` in dialogs and side panels.
- Use `pInputText` for ordinary text, email, number, and password fields. Use the library’s published controls for dropdowns, calendars, and other inputs it already supplies.
- Show field validation with `app-form-error`, mark required labels with `app-required-field`, and use `.field-hint` for help text.
- Use the library inputs before creating new ones: `our-custom-dropdown`, `our-custom-multi-select`, `app-calendar-input`, `app-fixed-panel-select`, and the `[trimInput]`, `[onlyNumbers]` and `[preventInvalidNumberKeys]` directives.
- Use the library validators (`@mohammed_a4rf/core-ui/utils`) before writing one. A Super Admin-only rule goes in the feature's `validators/<area>.validators.ts`, never inside a component.
- Use built-in validators for single fields. To make fields required only while a switch is on, `disable()` / `enable()` them instead of writing a custom validator.
- Start new controls empty (`null` / `''`). No default values the spec or API does not give.
- A dropdown that depends on another dropdown loads its options only after the parent has a value, in a `listenToXChange()` method using `valueChanges` + `switchMap`. It resets the child value and options on each change. Never load it on init.
- A form that saves its own data owns the register/edit call and emits `saved`.

## Styling

- Use PrimeNG 20 components and names: `p-select`, `p-drawer`, `p-datepicker`, `p-popover`, `p-toggleswitch`, `p-textarea`, `p-accordion-panel`.
- Use PrimeFlex classes for layout and spacing (`flex align-items-center justify-content-between gap-2`).
- Use design tokens from `@mohammed_a4rf/core-ui/styles` (`var(--Colors-Essential-Text)`, `var(--Spacing-...)`, `var(--Border-Radius-...)`), with no fallback values in `var()`. Never hard-code a colour that has a token.
- Directional icons (arrows, chevrons) get `class="rtl-flip"` in the template. Never flip icons for Arabic in SCSS.
- Do not add a new library when PrimeNG, Angular CDK or `@mohammed_a4rf/core-ui` already covers the need. Ask before adding any dependency.

## Branding and translations

- Use **NAS** as the product name in both languages. Use customer-neutral copy, branding, and examples. Use the supplied NAS logo mark and word mark in `public/images/` for product branding. Treat company names, logos, and other customer-specific details as data supplied by the active company or environment.
- Translate user-facing and accessibility text, including button labels, tooltips, empty states, and validation. Use translation keys: `{{ 'companies.title' | translate }}`, `[placeholder]="'companies.search' | translate"`.
- Add every new key to **both** `en.json` and `ar.json` of this app.
- Super Admin loads only its own dictionaries under `public/assets/i18n/`. Maintain the keys used by shared components (`general.*`, `add_feature_column.*`, `sidebar.*`) in both app dictionaries when upgrading core-ui.
- Arabic is right-to-left; check the layout in both languages.
- Send the selected language to the API and display its localized messages. Keep names, codes, and other customer data supplied by the API.

## Configuration And Secrets

- API roots and media URL come from the environment / runtime config and are passed to `provideCoreUi(...)`. Never hard-code a server URL in a service or component.
- **Never put secrets in frontend code** (API keys, passwords, tokens). Everything in this app ships to the browser. If a feature needs a secret, the call must go through the backend.

## Adding A New Feature — Checklist

1. Check the `@mohammed_a4rf/core-ui` docs for what you can reuse.
2. Create `src/app/feature/manage-<name>/` with `components/`, `models/`, `services/` and `manage-<name>.routes.ts`.
3. Lazy-load it from `app.routes.ts` under the shell route. Add the path to `AppRoutes`.
4. Add `data.breadcrumb` to every route and a sidebar entry in the shell menu.
5. One service per main endpoint, using `ApiService`, with section comments and a `Lookups` section.
6. One model file per service.
7. List pages: `new-theme-page-toolbar` + `app-filter-component` + `app-reusable-table` with signals for state.
8. Use `FormBuilder` in `initForm()`, library controls and validation, and an `.our-field` wrapper for every labeled control.
9. Check `isApiError(res)` in every success handler. No manual success/error toasts.
10. Translations in both `en.json` and `ar.json`.
11. Run the checks below.

## Do Not Do This

- Do not over-engineer (see Keep It Simple).
- Do not copy code from `@mohammed_a4rf/core-ui` or `HR-front-end` into this app; import it from the library.
- Do not import anything from `HR-front-end` or from `../2b-core-ui/projects/...` source paths.
- Do not put HR business rules or HR endpoints in this app.
- Do not create custom table, pagination, loading or empty-state wrappers.
- Do not define feature route tables in `app.routes.ts`.
- Do not pass signal objects to inputs that expect values.
- Do not ignore `isApiError(res)` because the HTTP status is 200.
- Do not let two services call the same main endpoint.
- Do not write a TypeScript `enum`, hard-coded option list or label map for a backend enum.
- Do not hardcode user-facing text.
- Do not use `NgZone` or `zone.js`.
- Do not declare properties between methods.
- Do not put secrets or server URLs in components or services.
- Do not commit, push, publish or add a dependency unless I ask.

## Verification Before Finishing

Run these from the `super-admin` folder and report the results honestly, including any errors:

```powershell
npx tsc -p tsconfig.app.json --noEmit
```

```powershell
npx ng build
```

Then check:

- Every new visible string has a key in both `en.json` and `ar.json`.
- No copied library code and no forbidden imports:

```powershell
rg "HR-front-end|2b-core-ui/projects|NgZone|zone.js|HREndpoints|HRRoutes" src
```

At the end, give a short summary: the files you changed or created, one line on each, and anything you were unsure about or skipped.
