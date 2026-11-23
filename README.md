# NAS Super Admin

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.43.

## Shared design system

NAS serves multiple customer companies. Use the NAS name and customer-neutral copy in shared designs, and provide both Arabic and English for interface and accessibility text.

Check `@mohammed_a4rf/core-ui` first for reusable controls, styles, validators, and other building blocks. If one is missing, add and export it in the shared library. Super Admin keeps its own routes, permissions, and business rules.

Wrap labeled controls in `.our-field` and use the library’s `app-required-field` and `app-form-error` for required markers and validation. See [AGENTS.md](AGENTS.md) for the full project rules.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
