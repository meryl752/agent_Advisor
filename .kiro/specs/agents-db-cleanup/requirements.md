# Requirements Document

## Introduction

The Raspquery app uses a Supabase `agents` table as its core data source for AI tool recommendations. A quality audit revealed four critical issues that degrade recommendation accuracy and user experience: 837 agents (63%) lack URLs, preventing logo display and deep links; 24 important tools are missing entirely; 19 entries are duplicated; and `use_cases` / `description` fields contain French text, which causes LLM instruction-following failures. Additionally, at least one agent (Lindy) has an incorrect `use_cases` value that triggers wrong role assignments in the recommendation engine.

This feature delivers a set of Node.js `.mjs` scripts that clean, enrich, and validate the `agents` table so that every record is complete, deduplicated, in English, and correctly categorised.

---

## Glossary

- **Agent**: A row in the Supabase `agents` table representing one AI tool or service.
- **Cleanup_Script**: A Node.js `.mjs` script that modifies the `agents` table via the Supabase service-role client.
- **Deduplication**: The process of identifying duplicate Agent rows (same `name`, case-insensitive) and retaining exactly one canonical record.
- **Enrichment**: The process of adding or correcting Agent fields — `url`, `description`, `use_cases`, `best_for`, `not_for`, `price_from`, `score` — to meet completeness standards.
- **Translation**: Converting French text in `description`, `use_cases`, `best_for`, and `not_for` fields to English.
- **Validation_Report**: A JSON or console report produced after cleanup that summarises data quality metrics.
- **Missing_Tool**: An Agent that is expected in the database but is absent.
- **Duplicate**: Two or more Agent rows sharing the same `name` value (case-insensitive).
- **URL_Field**: The `url` column in the `agents` table, used for logo display via logo.dev and deep links.
- **Use_Case**: A string tag in the `use_cases` array that the recommendation engine uses to assign roles to Agents.
- **Service_Role_Key**: The Supabase `SUPABASE_SERVICE_ROLE_KEY` environment variable, loaded from `.env.local`, required for write operations.

---

## Requirements

### Requirement 1: Duplicate Removal

**User Story:** As a developer, I want to remove duplicate agent entries from the database, so that the recommendation engine never returns the same tool twice and data quality metrics are accurate.

#### Acceptance Criteria

1. WHEN the deduplication script runs, THE Cleanup_Script SHALL identify all Agent rows whose `name` values are identical when compared case-insensitively.
2. WHEN duplicates are found, THE Cleanup_Script SHALL retain the Agent row with the most complete data (non-null `url`, longest `description`, highest `score`) and delete all other duplicate rows.
3. IF two duplicate rows have equal completeness scores, THEN THE Cleanup_Script SHALL retain the row with the earlier `created_at` timestamp and delete the newer row.
4. WHEN a duplicate row is deleted, THE Cleanup_Script SHALL log the deleted row's `id`, `name`, and the reason for deletion to the console.
5. WHEN the deduplication script completes, THE Cleanup_Script SHALL print a summary showing the total number of duplicates found and the total number of rows deleted.
6. THE Cleanup_Script SHALL perform deduplication as a dry-run by default, requiring an explicit `--apply` flag to commit deletions to Supabase.

---

### Requirement 2: Add Missing Important Tools

**User Story:** As a product owner, I want the 24 missing high-value tools added to the database with complete English data, so that users receive recommendations for the most important AI tools on the market.

#### Acceptance Criteria

1. WHEN the import script runs, THE Cleanup_Script SHALL insert each of the following tools if no Agent with that name (case-insensitive) already exists: Gemini, Taplio, Mailchimp, Zapier, Shopify, Tidio AI, Semrush, Notion, Zendesk, Perplexity AI, Writesonic, Later, Sprout Social, ActiveCampaign, Shopify Sidekick, Gorgias, Seamless.ai, Surfer SEO, DALL-E, Stable Diffusion, Synthesia, Google Analytics, Windsurf, Tavily.
2. WHEN a new Agent is inserted, THE Cleanup_Script SHALL populate all of the following fields with non-null, non-empty English values: `name`, `category`, `description`, `use_cases` (at least 2 tags), `best_for` (at least 2 values), `url`, `price_from`, `score`.
3. WHEN a new Agent is inserted, THE Cleanup_Script SHALL set `pricing_model` to one of the valid values: `'free'`, `'freemium'`, `'paid'`, or `'usage'`.
4. IF an Agent with the same name already exists in the database, THEN THE Cleanup_Script SHALL skip insertion and log a warning message identifying the tool name.
5. WHEN the import script completes, THE Cleanup_Script SHALL print a summary showing how many tools were inserted and how many were skipped.

---

### Requirement 3: Translate French Text to English

**User Story:** As a developer, I want all `description`, `use_cases`, `best_for`, and `not_for` fields to be in English, so that the LLM recommendation engine follows instructions correctly and produces consistent results.

#### Acceptance Criteria

1. WHEN the translation script runs, THE Cleanup_Script SHALL detect Agent rows where the `description` field contains French text (identified by the presence of French-specific characters or common French words such as "avec", "pour", "les", "des", "une", "est").
2. WHEN a French `description` is detected, THE Cleanup_Script SHALL replace it with an equivalent English description of equivalent length and meaning.
3. WHEN the translation script runs, THE Cleanup_Script SHALL replace all French string values in the `use_cases`, `best_for`, and `not_for` arrays with their English equivalents.
4. WHEN a field is translated, THE Cleanup_Script SHALL preserve the original array structure and number of elements.
5. WHEN the translation script completes, THE Cleanup_Script SHALL print a summary showing the total number of Agent rows updated and the total number of fields translated.
6. THE Cleanup_Script SHALL perform translation as a dry-run by default, requiring an explicit `--apply` flag to commit updates to Supabase.

---

### Requirement 4: Fix Incorrect Use Cases

**User Story:** As a developer, I want incorrect `use_cases` values corrected, so that the recommendation engine assigns the right role to each tool and does not recommend Lindy for reporting tasks.

#### Acceptance Criteria

1. WHEN the use-case fix script runs, THE Cleanup_Script SHALL locate the Agent named "Lindy" and remove the tag `"reporting"` from its `use_cases` array.
2. WHEN the "reporting" tag is removed from Lindy, THE Cleanup_Script SHALL ensure the `use_cases` array retains at least 2 correct tags reflecting Lindy's actual capabilities (e.g., `"email_automation"`, `"workflow_automation"`).
3. WHEN the use-case fix script runs, THE Cleanup_Script SHALL accept a configuration object listing additional `{ name, remove_tags[], add_tags[] }` corrections so that future fixes can be applied without code changes.
4. WHEN a use-case correction is applied, THE Cleanup_Script SHALL log the Agent `name`, the tags removed, and the tags added.
5. THE Cleanup_Script SHALL perform use-case fixes as a dry-run by default, requiring an explicit `--apply` flag to commit updates to Supabase.

---

### Requirement 5: Add Missing URLs

**User Story:** As a developer, I want missing `url` values populated for as many agents as possible, so that logo.dev can display logos and users can navigate directly to each tool.

#### Acceptance Criteria

1. WHEN the URL enrichment script runs, THE Cleanup_Script SHALL query all Agent rows where `url` is null or empty.
2. WHEN a known URL mapping exists for an Agent name, THE Cleanup_Script SHALL update the Agent's `url` field with the canonical HTTPS URL for that tool.
3. WHEN a URL is added, THE Cleanup_Script SHALL also derive and set the `website_domain` field from the URL hostname (e.g., `"zapier.com"` from `"https://zapier.com"`).
4. WHEN the URL enrichment script completes, THE Cleanup_Script SHALL print a summary showing the number of URLs added and the number of Agents that still have no URL.
5. THE Cleanup_Script SHALL perform URL enrichment as a dry-run by default, requiring an explicit `--apply` flag to commit updates to Supabase.

---

### Requirement 6: Post-Cleanup Validation Report

**User Story:** As a developer, I want a validation report generated after cleanup, so that I can confirm data quality has improved and identify any remaining issues.

#### Acceptance Criteria

1. WHEN the validation script runs, THE Cleanup_Script SHALL query the `agents` table and report the total Agent count.
2. WHEN the validation script runs, THE Cleanup_Script SHALL report the number of Agents with a null or empty `url` field.
3. WHEN the validation script runs, THE Cleanup_Script SHALL report the number of Agents with a null or empty `description` field.
4. WHEN the validation script runs, THE Cleanup_Script SHALL report the number of Agents with a null or empty `use_cases` array.
5. WHEN the validation script runs, THE Cleanup_Script SHALL report the number of duplicate Agent names detected.
6. WHEN the validation script runs, THE Cleanup_Script SHALL report the number of Agents whose `description` still contains French text.
7. WHEN the validation script runs, THE Cleanup_Script SHALL report the category distribution (count per `category` value).
8. WHEN the validation script completes, THE Cleanup_Script SHALL write the full report as a JSON file to `scripts/agents-db-validation-report.json` and also print a human-readable summary to the console.

---

### Requirement 7: Safe Script Execution

**User Story:** As a developer, I want all scripts to be safe to run without accidentally modifying production data, so that I can audit changes before applying them.

#### Acceptance Criteria

1. THE Cleanup_Script SHALL load Supabase credentials exclusively from environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) read from `stackai/.env.local` via `dotenv`.
2. IF the required environment variables are not set, THEN THE Cleanup_Script SHALL exit with a non-zero exit code and print a descriptive error message before performing any database operations.
3. THE Cleanup_Script SHALL default to dry-run mode for all destructive or mutating operations (DELETE, UPDATE, INSERT) and SHALL require an explicit `--apply` CLI flag to execute writes against Supabase.
4. WHEN running in dry-run mode, THE Cleanup_Script SHALL print a clear `[DRY RUN]` prefix on every line that describes a change that would be made.
5. WHEN running with `--apply`, THE Cleanup_Script SHALL print a clear `[APPLIED]` prefix on every line that confirms a change was committed to Supabase.
6. THE Cleanup_Script SHALL handle Supabase API errors by logging the error message and the affected Agent name, then continuing to process remaining records rather than crashing.
7. WHEN all operations complete, THE Cleanup_Script SHALL exit with code `0` on success and code `1` if any errors were encountered during execution.
