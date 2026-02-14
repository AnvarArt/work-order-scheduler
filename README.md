# Work Order Schedule Timeline

An interactive **Work Order Schedule Timeline** for a manufacturing ERP system. Built with **Angular 17+** (standalone components), it lets users view, create, and edit work orders across multiple work centers with Day/Week/Month zoom and overlap validation.

## How to Run

```bash
# Install dependencies (if not already done)
npm install --legacy-peer-deps

# Serve the application
ng serve
```

Open [http://localhost:4200](http://localhost:4200). No extra setup (e.g. backend or env vars) is required.


## Libraries Used

| Library | Purpose |
|--------|--------|
| **Angular 17** | Framework, standalone components, reactive forms |
| **@ng-bootstrap/ng-bootstrap** (v16) | Date picker (ngb-datepicker) for start/end dates |
| **Bootstrap (CSS)** | Form and button styling |
| **@popperjs/core** | Required by ng-bootstrap for dropdown/datepicker positioning |

**Note on ng-select:** The spec asks for ng-select for dropdowns. The current `@ng-select/ng-select` release targets Angular 19+ (new control flow), which is not compatible with this Angular 17 project. Status and Work Center are implemented with native `<select>` elements. If you upgrade to Angular 19+, you can switch these to ng-select.

## Project Structure

```
src/app/
├── components/
│   ├── timeline/           # Main timeline grid, zoom, bars, today line
│   └── work-order-panel/   # Create/Edit slide-out form
├── data/
│   └── sample-data.ts      # Work centers + work orders
├── models/
│   ├── work-center.model.ts
│   ├── work-order.model.ts
│   └── timeline.model.ts
├── services/
│   └── schedule.service.ts # CRUD + overlap check + localStorage
├── app.config.ts
└── app.component.ts
```

## Features Implemented

- **Timeline grid**: Day / Week / Month timescale; fixed left panel; scrollable timeline; current-day vertical line; row hover.
- **Work order bars**: Name, status badge (Open / In Progress / Complete / Blocked), three-dot menu (Edit / Delete).
- **Create panel**: Opens from empty timeline click; form with name, status, work center, start/end (ngb-datepicker); prefill from click; end date default start+7 when start changes.
- **Edit panel**: Same panel, prefilled; Save instead of Create.
- **Validation**: Required fields; end date must be after start date; overlap on same work center blocks save and shows an error.
- **Bonus**: localStorage persistence for work orders.
