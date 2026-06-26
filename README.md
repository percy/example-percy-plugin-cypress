# example-percy-plugin-cypress

The **"onboard & expand"** companion repo for the [Percy Visual Testing plugin](https://github.com/percy/percy-visual-testing) demo (Variant B in [example-percy-plugin/DEMO.md](https://github.com/percy/example-percy-plugin/blob/main/DEMO.md)).

It's the same **Lumina Home** store as the review-workflow repo, but built as a real app with a **Cypress** end-to-end suite — and, deliberately, **no Percy yet**. `main` is the "I have working functional tests but zero visual coverage" starting state. The demo shows the plugin going from there to full visual coverage:

- **`/percy:integrate`** detects the Cypress stack, installs `@percy/cli` + `@percy/cypress`, wires config + the support-file import, and adds the first `percySnapshot()` calls.
- **`/percy:expand-coverage cypress/e2e/catalog.cy.js`** finds the touchpoints in that spec that lack a visual checkpoint and adds more.

## Run the (functional) suite

```bash
nvm use 22
npm install        # cypress + http-server — note: no @percy/* yet
npm test           # serves site/ and runs cypress headless
```

The suite drives the static site in `site/` (served by `http-server`) and asserts page content — it passes today without any Percy involvement.

## Layout

| Path | What |
|---|---|
| `site/` | The Lumina Home static site (7 pages + `assets/site.css`) |
| `cypress/e2e/home.cy.js` | Home: hero + featured products, CTA → shop |
| `cypress/e2e/catalog.cy.js` | Shop grid → product detail → cart (the `/percy:expand-coverage` target) |
| `cypress/e2e/pages.cy.js` | About, Journal, Contact |
| `cypress/support/e2e.js` | Support file — where `/percy:integrate` adds `import '@percy/cypress'` |

## Reset between demo runs

```bash
git checkout -- . && git clean -fd   # drop integrate/expand edits
git checkout main                    # back to the no-Percy state
```
