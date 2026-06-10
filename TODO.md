# TODO — College & Course Finder feature (end-to-end rebuild)

## Step 1 — Backend rebuild (controller + routes)
- [x] Overwrite `server/controllers/collegeController.js` to:
  - [x] Read `data/colleges.xlsx` from sheet `Sheet1`.

  - [x] Use EXACT Excel headers from spec.
  - [ ] Add `cleanFee(val)` and `unique(arr)` helpers.
  - [ ] Implement endpoints:
    - [ ] GET `/api/v1/colleges/search?q=`
    - [ ] GET `/api/v1/colleges/by-college?name=`
    - [ ] GET `/api/v1/colleges/by-course?name=`
    - [ ] GET `/api/v1/colleges/streams`
    - [ ] GET `/api/v1/colleges/states`
  - [ ] If Excel missing: do NOT crash; return 500 with empty data.
- [x] Overwrite `server/routes/collegeRoutes.js` to map routes to new controller exports.


## Step 2 — Frontend rebuild (college-finder.html)
- [ ] Overwrite `client/college-finder.html` to match the provided markup + JS + `.cf-` scoped CSS.
- [ ] Ensure it calls the 4 required endpoints and renders:
  - [ ] Autocomplete suggestions
  - [ ] Filter pills from `/streams`
  - [ ] College detail view from `/by-college`
  - [ ] College list view from `/by-course`

## Step 3 — Ensure admissions link
- [ ] Verify `client/admissions.html` already links to `college-finder.html` (no changes needed unless link is wrong).

## Step 4 — Test checklist
- [ ] Type "ABBS" → suggestions appear → click → detail view shows all courses + fee breakdown.
- [ ] Type "YENEPOYA" → suggestions appear → click → courses show with `cleanFee()` formatting.

