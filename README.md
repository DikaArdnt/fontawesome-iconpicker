# Font Awesome Icon Picker

A lightweight Font Awesome icon picker focused on production performance, low DOM usage, and efficient multi-instance behavior on desktop and mobile.

## Highlights

- Lazy icon rendering: no icon grid is created during normal initialization.
- Shared floating popover for many `.icon-picker` instances.
- Shared normalized icon metadata instead of per-instance copies.
- One cached request for identical `iconsUrl` sources.
- In-memory token search with configurable debounce.
- O(1) icon validation through a lookup map.
- Event delegation instead of one handler per icon.
- One global resize/orientation/outside-click listener set.
- DOM cleanup after the floating picker closes.
- Compact icon formats for smaller metadata payloads.
- Lightweight positioning adapter for production builds.

## Modern UI

The picker ships with a responsive interface designed for desktop, touch devices, and Bootstrap 5.3 color modes:

- CSS Grid icon layout instead of legacy floats.
- 42px desktop icon targets and 40px mobile targets.
- Six columns on desktop and five columns on small screens.
- Responsive popover width that stays inside the mobile viewport.
- Modern search field, focus states, selected states, buttons, radius, and elevation.
- Reduced-motion support through `prefers-reduced-motion`.
- Thin contained scrolling for the icon grid.
- Bootstrap 5.3-aware colors through Bootstrap CSS variables.
- Built-in light/dark support through `data-bs-theme`.
- Standalone fallback colors when Bootstrap is not present.
- High-contrast icon glyphs in dark mode using `--bs-emphasis-color`.
- A hardened dark search field that stays dark in normal, hover, focus, active, readonly, disabled, and WebKit autofill states.

When Bootstrap 5.3 is present, the picker consumes Bootstrap color variables such as `--bs-body-bg`, `--bs-body-color`, `--bs-emphasis-color`, `--bs-tertiary-bg`, `--bs-secondary-bg`, `--bs-border-color`, `--bs-primary`, and `--bs-primary-bg-subtle`.

The picker also exposes its own CSS variables for project-level customization:

```css
.iconpicker,
.iconpicker-popover.popover {
  --iconpicker-primary: var(--bs-primary, #0d6efd);
  --iconpicker-primary-soft: var(--bs-primary-bg-subtle, #cfe2ff);
  --iconpicker-primary-ring: rgba(var(--bs-primary-rgb, 13, 110, 253), .25);
  --iconpicker-surface: var(--bs-body-bg, #ffffff);
  --iconpicker-surface-subtle: var(--bs-tertiary-bg, #f8f9fa);
  --iconpicker-surface-hover: var(--bs-secondary-bg, #e9ecef);
  --iconpicker-border: var(--bs-border-color, #dee2e6);
  --iconpicker-border-strong: var(--bs-border-color, #adb5bd);
  --iconpicker-text: var(--bs-body-color, #212529);
  --iconpicker-icon-color: var(--bs-emphasis-color, #212529);
  --iconpicker-text-muted: var(--bs-secondary-color, #6c757d);
}
```
### Bootstrap 5.3 color modes

Use Bootstrap 5.3's `data-bs-theme` attribute. No separate dark-mode stylesheet is required.

Global dark mode:

```html
<html data-bs-theme="dark">
```
Global light mode:

```html
<html data-bs-theme="light">
```
For floating/shared popovers, the active picker's nearest `data-bs-theme` value is mirrored onto the floating popover when necessary. This allows a picker inside a scoped dark container to keep the correct theme even when the shared popover is attached elsewhere in the DOM.

## Build

```bash
npm install
npm run build
```
Main outputs:

- `dist/js/fontawesome-iconpicker.min.js`
- `dist/js/fontawesome-iconpicker.js`
- `dist/css/fontawesome-iconpicker.min.css`
- `dist/js/fontawesome-iconpicker.compat.min.js` (optional compatibility build)

The theme source is intentionally a single LESS entry file. No extra dark-mode CSS file needs to be loaded after the compiled icon picker stylesheet.

## Recommended production setup

Bootstrap 5.3 is recommended when you want automatic light/dark color-mode integration. Load Bootstrap before the icon picker stylesheet so the picker can consume Bootstrap CSS variables.

```html
<html data-bs-theme="dark">
<head>
  <link rel="stylesheet" href="/assets/bootstrap.min.css">
  <link rel="stylesheet" href="/assets/fontawesome-iconpicker.min.css">
</head>
<body>
  <div class="input-group">
    <input
      type="text"
      class="form-control icon-picker"
      name="icon"
      placeholder="Choose an icon"
    >
    <span class="input-group-text">
      <i class="fa-solid fa-icons"></i>
    </span>
  </div>
  <script src="/assets/jquery.min.js"></script>
  <script src="/assets/fontawesome-iconpicker.min.js"></script>
  <script>
    $('.icon-picker').iconpicker({
      iconsUrl: '/assets/fontawesome-icons.json',
      maxResults: 100,
      searchDebounce: 120
    });
  </script>
</body>
</html>
```
Switching the Bootstrap color mode is enough to update the picker:

```js
document.documentElement.setAttribute('data-bs-theme', 'light');
document.documentElement.setAttribute('data-bs-theme', 'dark');
```
Bootstrap is not strictly required for the picker to render because the theme includes fallback values, but Bootstrap 5.3 provides the intended color-mode integration.

With `iconsUrl`, metadata is loaded only when a picker actually needs it. Pickers using the same URL share one request/cache entry.

## Many pickers on one page

```html
<input class="icon-picker" name="icon_1">
<input class="icon-picker" name="icon_2">
<input class="icon-picker" name="icon_3">
<input class="icon-picker" name="icon_4">
<input class="icon-picker" name="icon_5">
```

```js
$('.icon-picker').iconpicker({
  iconsUrl: '/assets/fontawesome-icons.json',
  maxResults: 100,
  searchDebounce: 120
});
```
For normal non-inline pickers:

- initialization does not create one popover per input;
- only one floating popover exists at a time;
- only the active picker has a rendered icon grid;
- identical icon metadata is shared;
- identical `iconsUrl` values share a request;
- global window/document listeners are installed only once;
- rendered icon nodes are cleared when the shared popover is released.

Set `sharedPopover: false` only when independent simultaneous floating popovers are actually required. `placement: 'inline'` always owns its own UI.

## Mobile recommendation

The default is intentionally conservative:

```js
$('.icon-picker').iconpicker({
  sharedPopover: true,
  cacheIcons: true,
  renderOnInit: false,
  clearOnHide: true,
  maxResults: 100,
  searchDebounce: 120
});
```
For lower-end devices, consider:

```js
maxResults: 80,
searchDebounce: 150
```
Rendering fewer icons is usually more valuable than showing hundreds at once, because users can search by icon name or alias.

## Generate a Font Awesome icon pack

The icon metadata generator is available at `scripts/build-icons.mjs`.

By default it:

- uses Font Awesome version `7.x`;
- downloads `metadata/icons.json` from the Font Awesome GitHub repository;
- includes the `solid`, `regular`, and `brands` styles when they are available in the metadata;
- omits search aliases;
- writes JSON to `dist/icons/fontawesome-icons.json`.

Basic usage:

```bash
node scripts/build-icons.mjs
```
> **CLI syntax:** options with values must use `--name=value`. For example, use `--styles=solid,regular`, not `--styles solid,regular`. Boolean flags such as `--search` and `--pro` can be passed without a value, or explicitly as `--search=true` / `--pro=true`.

### Generator flags

| Flag | Default | Description |
| --- | --- | --- |
| `--version=<version>` | `7.x` | Font Awesome Git ref/version used to build the default metadata URL. Has no effect when `--input` is used, and is effectively bypassed when a custom `--source` is supplied. |
| `--input=<path>` | empty | Read metadata from a local JSON file instead of downloading it. When set, this takes precedence over `--source`. |
| `--source=<url>` | Font Awesome GitHub metadata URL | Custom remote `icons.json` source. The default is `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/<version>/metadata/icons.json`. |
| `--styles=<list>` | `solid,regular,brands` | Comma-separated styles to include. Values are trimmed and matched case-insensitively after normalization to lowercase. |
| `--search[=true]` | disabled | Include Font Awesome search terms. Icons with search terms are emitted as compact tuples such as `['fa-solid fa-house', 'home main building']`; icons without terms remain strings. |
| `--pro[=true]` | disabled | Include Font Awesome Pro styles. If an icon has no `pro` field, the script falls back to its normal `styles` metadata. |
| `--format=<format>` | `json` | Output format. Use `js` to generate a browser script; all other values follow the JSON output branch. |
| `--output=<path>` | format-dependent | Output file. Defaults to `dist/icons/fontawesome-icons.json`, or `dist/icons/fontawesome-icons.js` when `--format=js`. Parent directories are created automatically. |

### Common examples

Generate the default JSON pack:

```bash
node scripts/build-icons.mjs
```
Generate only icons exposed as pro metadata:

```bash
node scripts/build-icons.mjs --pro
```
Include search aliases:

```bash
node scripts/build-icons.mjs --search
```
Generate pro icons with search aliases:

```bash
node scripts/build-icons.mjs --pro --search
```
Limit the generated styles:

```bash
node scripts/build-icons.mjs --styles=solid --output=dist/icons/fa-solid.json
```
Generate multiple selected styles:

```bash
node scripts/build-icons.mjs --styles=solid,regular --output=dist/icons/fa-core.json
```
Use a specific Font Awesome Git ref/version:

```bash
node scripts/build-icons.mjs --version=7.x
```
Use a custom remote metadata source:

```bash
node scripts/build-icons.mjs --source=https://example.com/fontawesome/icons.json
```
Use local metadata, which is useful for offline or reproducible CI builds:

```bash
node scripts/build-icons.mjs --input=./metadata/icons.json --styles=solid,regular --pro
```
Generate a browser-ready JavaScript pack:

```bash
node scripts/build-icons.mjs --format=js
```
Default JavaScript output:

```text
dist/icons/fontawesome-icons.js
```
The JavaScript format assigns the generated list to `window.FontAwesomeIconPickerIcons`. If jQuery Icon Picker is already available and exposes `$.iconpicker.setIcons`, the generated script also registers the icon list automatically.

Generate JavaScript to a custom path:

```bash
node scripts/build-icons.mjs --format=js --pro --search --output=dist/icons/fa-icons.min-data.js
```
### npm shortcuts

If your `package.json` exposes the existing project shortcuts, they can still be used:

```bash
npm run build:icons
npm run build:icons:search
```
The exact behavior of those shortcuts depends on the arguments configured in `package.json`; the CLI flags above are the source of truth for `scripts/build-icons.mjs`.

### Output shape

Without `--search`, entries are compact strings:

```json
["fa-solid fa-house","fa-regular fa-star"]
```
With `--search`, entries that have search terms become compact tuples:

```json
["fa-regular fa-star",["fa-solid fa-house","home main building"]]
```
This format is directly supported by the picker and keeps generated metadata smaller than a verbose object-per-icon structure.

> **TLS note:** the generator currently sets `NODE_TLS_REJECT_UNAUTHORIZED=0`, which disables TLS certificate verification for the Node.js process. This can be convenient for local development with self-signed certificates, but it should be removed or guarded before using the script in environments where normal TLS verification is required.

## Custom whitelist

The smallest production setup is a limited icon list:

```js
$('.icon-picker').iconpicker({
  icons: [
    'fa-solid fa-house',
    'fa-solid fa-user',
    'fa-solid fa-gear',
    'fa-regular fa-star'
  ],
  maxResults: 100
});
```
## Supported icon formats

Simple string:

```js
'fa-solid fa-house'
```
Compact tuple with search terms:

```js
['fa-solid fa-house', 'home main building']
```
Legacy object format:

```js
{
  title: 'fa-solid fa-house',
  searchTerms: ['home', 'main', 'building']
}
```
## Options

| Option                |                                      Default | Description                                                                                               |
| --------------------- | -------------------------------------------: | --------------------------------------------------------------------------------------------------------- |
| `title`               |                                      `false` | Popover title. Set to a string to display a custom title.                                                 |
| `selected`            |                                      `false` | Initially selected icon. Set to an icon class/name supported by the picker.                               |
| `defaultValue`        |                                      `false` | Default icon value used when no current value is available.                                               |
| `placement`           |                                   `"bottom"` | Popover placement relative to the input or component.                                                     |
| `collision`           |                                     `"none"` | Controls collision handling when the popover approaches viewport boundaries.                              |
| `animation`           |                                       `true` | Enables popover animation when opening or closing.                                                        |
| `hideOnSelect`        |                                      `false` | Automatically close the picker after an icon is selected.                                                 |
| `showFooter`          |                                      `false` | Show the picker footer containing action buttons.                                                         |
| `searchInFooter`      |                                      `false` | Place the search input inside the footer instead of the main picker area.                                 |
| `mustAccept`          |                                      `false` | Require the user to explicitly confirm the selected icon using the Accept button.                         |
| `selectedCustomClass` |                               `"bg-primary"` | CSS class applied to the currently selected icon item.                                                    |
| `icons`               |                                         `[]` | Array of icons available to the picker.                                                                   |
| `iconsUrl`            |                                      `false` | URL of a JSON icon pack to load lazily. Set to `false` to use locally supplied icons.                     |
| `iconsDataKey`        |                                    `"icons"` | Object key containing the icon list when the JSON response uses a structure such as `{ "icons": [...] }`. |
| `maxResults`          |                                        `100` | Maximum number of icons rendered at once. Set to `0` for unlimited results.                               |
| `searchDebounce`      |                                        `120` | Delay, in milliseconds, before applying a search query after user input.                                  |
| `renderOnInit`        |                                      `false` | Render the icon grid during initialization. Keeping this disabled defers rendering until needed.          |
| `sharedPopover`       |                                       `true` | Reuse a single floating popover across non-inline icon picker instances.                                  |
| `clearOnHide`         |                                       `true` | Remove rendered icon elements when a private picker is closed to reduce retained DOM nodes.               |
| `cacheIcons`          |                                       `true` | Cache normalized icon metadata and reuse identical icon-pack URL requests across instances.               |
| `fullClassFormatter`  |          `function(value) { return value; }` | Function used to format or transform the full icon class before it is applied.                            |
| `input`               |                  `"input,.iconpicker-input"` | Selector used to locate the input element associated with the icon picker.                                |
| `inputSearch`         |                                      `false` | Optional external search input or selector. Set to `false` to use the built-in search field.              |
| `container`           |                                      `false` | Container where the picker popover is appended. Set to `false` to use the default container behavior.     |
| `component`           | `".input-group-text,.input-group-addon,.iconpicker-component"` | Selector for the component element that triggers or displays the icon picker.                             |

## Performance Options

The following options are specifically useful for controlling icon loading, rendering, caching, and search performance.

| Option           |   Default | Description                                                                       |
| ---------------- | --------: | --------------------------------------------------------------------------------- |
| `iconsUrl`       |   `false` | URL of a JSON icon pack to load lazily.                                           |
| `iconsDataKey`   | `"icons"` | Key used for responses shaped like `{ "icons": [...] }`.                          |
| `maxResults`     |     `100` | Maximum number of icons rendered at one time. Set to `0` for unlimited results.   |
| `searchDebounce` |     `120` | Search debounce delay in milliseconds.                                            |
| `renderOnInit`   |   `false` | Render the icon grid during initialization instead of waiting until it is needed. |
| `sharedPopover`  |    `true` | Reuse one floating popover across non-inline picker instances.                    |
| `clearOnHide`    |    `true` | Remove rendered icon nodes after a private picker closes.                         |
| `cacheIcons`     |    `true` | Share normalized icon metadata and identical URL requests across instances.       |

## Templates

The `templates` option controls the HTML markup used to build the picker interface.

| Template         | Default                                                                                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `popover`        | `<div class="iconpicker-popover popover"><div class="arrow"></div><div class="popover-title"></div><div class="popover-content"></div></div>`                                                                         |
| `footer`         | `<div class="popover-footer"></div>`                                                                                                                                                                                  |
| `buttons`        | `<button type="button" class="iconpicker-btn iconpicker-btn-cancel btn btn-outline-secondary btn-sm">Cancel</button> <button type="button" class="iconpicker-btn iconpicker-btn-accept btn btn-primary btn-sm">Accept</button>` |
| `search`         | `<input type="search" class="form-control iconpicker-search" placeholder="Type to filter">`                                                                                                                           |
| `iconpicker`     | `<div class="iconpicker"><div class="iconpicker-items"></div></div>`                                                                                                                                                  |
| `iconpickerItem` | `<a role="button" href="#" class="iconpicker-item"><i></i></a>`                                                                                                                                                       |

Example:

```js
$('.icon-picker').iconpicker({
    placement: 'bottom',
    animation: true,
    hideOnSelect: false,
    showFooter: false,
    iconsUrl: '/icons.json',
    iconsDataKey: 'icons',
    maxResults: 100,
    searchDebounce: 120,
    renderOnInit: false,
    sharedPopover: true,
    clearOnHide: true,
    cacheIcons: true
});
```
## Cache control

Clear one URL cache entry:

```js
$.iconpicker.clearIconCache('/assets/fontawesome-icons.json');
```
Clear all URL icon caches:

```js
$.iconpicker.clearIconCache();
```
## Positioning

The standard production build uses `position-lite.js` for the placement modes used by the picker, including top, bottom, left, right, corner variants, `flip`, and `fit` behavior.

The compatibility build can still include the legacy jQuery UI Position implementation for applications that depend on advanced custom positioning syntax.

## Credits

This repository originated from the work of Javi Aguilar and contributors to [`itsjavi/fontawesome-iconpicker`](https://github.com/itsjavi/fontawesome-iconpicker).

The current performance-oriented JavaScript architecture and additional optimizations are maintained in [`DikaArdnt/fontawesome-iconpicker`](https://github.com/DikaArdnt/fontawesome-iconpicker).

## License

See `LICENSE` and any third-party notices included with the repository. When redistributing files that remain derived from upstream or other third-party projects, preserve the notices required by their respective licenses.
