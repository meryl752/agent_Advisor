# Implementation Plan: agents-db-cleanup

## Overview

Six standalone Node.js `.mjs` scripts that clean, enrich, and validate the Supabase `agents` table. Each script follows the same boilerplate (dotenv, service-role client, dry-run by default, `[DRY RUN]` / `[APPLIED]` prefixes, exit codes). Scripts are placed in `stackai/scripts/` and tests in `stackai/scripts/__tests__/`.

## Tasks

- [x] 1. Set up shared boilerplate and test infrastructure
  - Create `stackai/scripts/__tests__/` directory
  - Verify `fast-check` and `vitest` are available in `package.json` (already present)
  - Define the shared boilerplate pattern (env loading, Supabase client, `--apply` flag, `DRY_RUN`/`PREFIX` constants) as a reference comment block that each script will copy — no shared module needed since scripts are self-contained
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [-] 2. Implement `db-deduplicate.mjs`
  - [x] 2.1 Write `db-deduplicate.mjs` with shared boilerplate
    - Implement `completenessScore(agent)` pure function: `(url ? 3 : 0) + (description?.length ?? 0) / 100 + (score ?? 0) / 100`
    - Implement `detectDuplicates(agents)` pure function: group by `name.toLowerCase()`, return groups with size > 1
    - Implement `selectKeeper(group)` pure function: highest completeness score, tie-break by earliest `created_at`
    - Fetch `id, name, url, description, score, created_at` from `agents`
    - In `--apply` mode: `DELETE FROM agents WHERE id IN (loser_ids)`
    - Log per-deleted row: `[DRY RUN] DELETE id=... name="..." reason="duplicate of id=... (higher completeness)"`
    - Print summary: `Deduplication complete: N duplicates found, N rows deleted`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 2.2 Write property test for duplicate detection completeness
    - **Property 1: Duplicate detection completeness**
    - **Validates: Requirements 1.1**
    - Use `fc.array(agentArbitrary())` with injected known duplicates (varying case); assert every injected duplicate name appears in a group of size ≥ 2 and no false positives
    - File: `stackai/scripts/__tests__/db-deduplicate.test.mjs`

  - [ ]* 2.3 Write property test for best-candidate selection
    - **Property 2: Best-candidate selection**
    - **Validates: Requirements 1.2, 1.3**
    - Generate arbitrary groups of agents; assert `selectKeeper()` always returns the agent with the highest completeness score, tie-broken by earliest `created_at`
    - File: `stackai/scripts/__tests__/db-deduplicate.test.mjs`

  - [ ]* 2.4 Write unit tests for `db-deduplicate.mjs`
    - Test env var validation: missing vars → exit code 1
    - Test `[DRY RUN]` prefix present when `--apply` not passed
    - Test summary output format
    - _Requirements: 1.4, 1.5, 7.2, 7.4_

- [ ] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement `db-add-missing-tools.mjs`
  - [ ] 4.1 Write `db-add-missing-tools.mjs` with shared boilerplate
    - Define `TOOLS_TO_ADD` constant: array of 24 agent objects with all required fields populated (name, category, description, use_cases ≥ 2, best_for ≥ 2, not_for, url, price_from, score, roi_score, pricing_model, setup_difficulty, time_to_value, last_updated, website_domain) — use the 24 tools listed in the design's Data Models section
    - Fetch `name` from `agents`; build a lowercased Set of existing names
    - For each tool in `TOOLS_TO_ADD`: skip if name already exists (log warning), otherwise insert
    - Log per-inserted tool: `[DRY RUN] INSERT name="..." category="..." url="..."`
    - Print summary: `Import complete: N tools inserted, N skipped (already exist)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 4.2 Write property test for idempotent insertion
    - **Property 4: Missing-tool insertion is idempotent**
    - **Validates: Requirements 2.1, 2.4, 2.5**
    - Generate arbitrary subsets of the 24 tool names as "already present"; assert `inserted_count + skipped_count === 24` for every subset
    - File: `stackai/scripts/__tests__/db-add-missing-tools.test.mjs`

  - [ ]* 4.3 Write property test for tool definition completeness
    - **Property 5: All tool definitions are complete and valid**
    - **Validates: Requirements 2.2, 2.3**
    - Iterate over every object in `TOOLS_TO_ADD`; assert all required fields are non-null/non-empty, `use_cases.length >= 2`, `best_for.length >= 2`, and `pricing_model` is one of `'free'|'freemium'|'paid'|'usage'`
    - File: `stackai/scripts/__tests__/db-add-missing-tools.test.mjs`

  - [ ]* 4.4 Write unit tests for `db-add-missing-tools.mjs`
    - Test skip logic when tool name already exists (case-insensitive)
    - Test summary output format
    - _Requirements: 2.4, 2.5_

- [ ] 5. Implement `db-translate-to-english.mjs`
  - [ ] 5.1 Write `db-translate-to-english.mjs` with shared boilerplate
    - Define `FRENCH_INDICATORS` regex array and `isFrench(text)` pure function
    - Define `TRANSLATIONS` static map covering all French strings found in the current dataset (sourced from `agents_export.json`)
    - Implement `translateField(value)` for strings and `translateArray(arr)` for string arrays (preserves length, no null/empty elements)
    - Fetch `id, name, description, use_cases, best_for, not_for` from `agents`
    - For each agent: check each field with `isFrench()`, apply translations
    - In `--apply` mode: `UPDATE agents SET description=..., use_cases=..., best_for=..., not_for=... WHERE id=...`
    - Log per-updated agent: `[DRY RUN] UPDATE id=... name="..." fields=[description, best_for]`
    - Print summary: total Agent rows updated, total fields translated
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 5.2 Write property test for French detection
    - **Property 6: French detection correctly classifies text**
    - **Validates: Requirements 3.1**
    - Use `fc.constantFrom(...FRENCH_INDICATOR_WORDS)` to generate strings containing French indicators; assert `isFrench()` returns `true`. Use `fc.stringOf(fc.constantFrom(...ENGLISH_WORDS))` for English-only strings; assert `isFrench()` returns `false`
    - File: `stackai/scripts/__tests__/db-translate-to-english.test.mjs`

  - [ ]* 5.3 Write property test for translation eliminating French text
    - **Property 7: Translation eliminates French text**
    - **Validates: Requirements 3.2, 3.3**
    - For any agent with French fields, after applying translation, assert `isFrench()` returns `false` for all translated fields
    - File: `stackai/scripts/__tests__/db-translate-to-english.test.mjs`

  - [ ]* 5.4 Write property test for translation preserving array structure
    - **Property 8: Translation preserves array structure**
    - **Validates: Requirements 3.4**
    - Use `fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 })`; assert `translateArray(arr).length === arr.length` and every element is non-null and non-empty
    - File: `stackai/scripts/__tests__/db-translate-to-english.test.mjs`

  - [ ]* 5.5 Write unit tests for `db-translate-to-english.mjs`
    - Test summary output format (rows updated, fields translated)
    - _Requirements: 3.5_

- [ ] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement `db-fix-use-cases.mjs`
  - [ ] 7.1 Write `db-fix-use-cases.mjs` with shared boilerplate
    - Define `USE_CASE_FIXES` configuration array: `[{ name: 'Lindy', remove_tags: ['reporting'], add_tags: ['email_automation', 'workflow_automation'] }, ...]`
    - Fetch `id, name, use_cases` from `agents WHERE name IN (fix_names)`
    - Implement `applyFix(useCases, fix)` pure function: remove `remove_tags`, add `add_tags` (deduped), ensure length ≥ 2
    - In `--apply` mode: `UPDATE agents SET use_cases=... WHERE id=...`
    - Log per-corrected agent: `[DRY RUN] UPDATE name="..." removed=[...] added=[...] result=[...]`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 7.2 Write property test for use-case corrections
    - **Property 9: Use-case corrections are fully applied**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Use `fc.array(fc.string(), { minLength: 2 })` for initial `use_cases` and arbitrary `{ remove_tags, add_tags }` configs; assert every `remove_tag` is absent, every `add_tag` is present, and result length ≥ 2
    - File: `stackai/scripts/__tests__/db-fix-use-cases.test.mjs`

  - [ ]* 7.3 Write unit tests for `db-fix-use-cases.mjs`
    - Test that Lindy no longer has `"reporting"` in `use_cases` after fix
    - Test log output format (name, removed, added)
    - _Requirements: 4.1, 4.4_

- [ ] 8. Implement `db-add-urls.mjs`
  - [ ] 8.1 Write `db-add-urls.mjs` with shared boilerplate
    - Implement `extractDomain(url)` pure function: `new URL(url).hostname.replace(/^www\./, '')`
    - Define `URL_MAP`: a `Map<string, string>` (lowercased agent name → canonical HTTPS URL) covering all agents in the current dataset that are missing URLs
    - Fetch `id, name, url` from `agents WHERE url IS NULL OR url = ''`
    - For each agent: look up name in `URL_MAP`; if found, derive `website_domain` via `extractDomain()`
    - In `--apply` mode: `UPDATE agents SET url=..., website_domain=... WHERE id=...`
    - Log per-updated agent: `[DRY RUN] UPDATE name="..." url="..." website_domain="..."`
    - Print summary: `URL enrichment complete: N URLs added, N agents still missing URL`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 8.2 Write property test for URL domain derivation
    - **Property 10: URL derivation is correct**
    - **Validates: Requirements 5.3**
    - Use `fc.webUrl({ validSchemes: ['https'] })`; assert `extractDomain(url)` does not start with `"www."`, does not contain `"://"`, and does not contain `"/"`
    - File: `stackai/scripts/__tests__/db-add-urls.test.mjs`

  - [ ]* 8.3 Write property test for URL enrichment applying all known mappings
    - **Property 11: URL enrichment applies all known mappings**
    - **Validates: Requirements 5.2, 5.3**
    - For any agent whose name is in `URL_MAP` and whose `url` is null/empty, assert that after enrichment `url === URL_MAP[name]` and `website_domain === extractDomain(URL_MAP[name])`
    - File: `stackai/scripts/__tests__/db-add-urls.test.mjs`

  - [ ]* 8.4 Write unit tests for `db-add-urls.mjs`
    - Test summary output format (URLs added, still missing)
    - _Requirements: 5.4_

- [ ] 9. Implement `db-validate.mjs`
  - [ ] 9.1 Write `db-validate.mjs` with shared boilerplate
    - Implement all metric computations as pure functions operating on an in-memory agents array: `countMissingUrl`, `countMissingDescription`, `countMissingUseCases`, `countDuplicates`, `countFrenchText`, `buildCategoryDistribution`
    - Fetch all agents from `agents` table
    - Assemble `ValidationReport` object: `generated_at`, `total_agents`, `missing_url`, `missing_description`, `missing_use_cases`, `duplicate_names`, `french_text_remaining`, `category_distribution`, `agents_missing_url` (names), `duplicate_groups`
    - Write report to `scripts/agents-db-validation-report.json` using `fs.writeFileSync`
    - Print human-readable summary to stdout
    - Note: this script is read-only — no `--apply` flag needed, no writes to `agents`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 7.1, 7.2_

  - [ ]* 9.2 Write property test for validation report accuracy
    - **Property 12: Validation report metrics are accurate**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**
    - Use `fc.array(agentArbitrary())` to generate arbitrary agent sets; assert each metric in the report equals the value computed by independently querying the same in-memory array
    - File: `stackai/scripts/__tests__/db-validate.test.mjs`

  - [ ]* 9.3 Write unit tests for `db-validate.mjs`
    - Test that JSON report file contains all required fields (`generated_at`, `total_agents`, `missing_url`, `missing_description`, `missing_use_cases`, `duplicate_names`, `french_text_remaining`, `category_distribution`, `agents_missing_url`, `duplicate_groups`)
    - _Requirements: 6.8_

- [ ] 10. Implement cross-cutting error handling and dry-run guarantee
  - [ ] 10.1 Verify error resilience in all five mutating scripts
    - Confirm each script wraps every Supabase write in a try/catch (or checks `error` from Supabase response), logs the error and agent name, sets `hasErrors = true`, and continues to the next record
    - Confirm exit code is `1` when `hasErrors` is true, `0` otherwise
    - _Requirements: 7.6, 7.7_

  - [ ]* 10.2 Write property test for dry-run producing zero mutations
    - **Property 3: Dry-run produces zero database mutations**
    - **Validates: Requirements 1.6, 3.6, 4.5, 5.5, 7.3**
    - For each of the five mutating scripts, mock the Supabase client and assert that when `--apply` is absent, no `insert`, `update`, or `delete` methods are called on the mock
    - File: `stackai/scripts/__tests__/db-deduplicate.test.mjs` (and equivalent files for other scripts)

  - [ ]* 10.3 Write property test for error resilience
    - **Property 13: Error resilience — processing continues after failures**
    - **Validates: Requirements 7.6**
    - Inject a Supabase mock that fails on a random subset of write calls; assert the script processes all records and does not throw an uncaught exception
    - File: `stackai/scripts/__tests__/db-deduplicate.test.mjs` (and equivalent files for other scripts)

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Run `npm test` in `stackai/` and confirm all tests pass.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each script is self-contained (no shared module) — copy the boilerplate pattern from `analyze-db-quality.mjs`
- Batch processing (10–20 records per batch, 100ms sleep) should be applied in all mutating scripts to avoid Supabase rate limits
- Run scripts with `node scripts/<name>.mjs` (dry-run) or `node scripts/<name>.mjs --apply` (write mode)
- Tests run with `npm test` (uses `vitest --run`)
- Property tests use `fast-check` (already installed); each property runs a minimum of 100 iterations
