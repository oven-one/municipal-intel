# Claude Development Notes

## Package Manager
This project uses **yarn** instead of npm.

## Commands
- `yarn test` - Run tests
- `yarn build` - Build the project
- `yarn test:unit` - Run unit tests only

## Project Structure
Based on typescript-starter template which uses co-located tests (test files adjacent to source code in `src/` directory).

## Testing
- Tests are located in `src/` directory alongside source code
- Test files are named `*.spec.ts`
- Uses AVA test framework with TypeScript support
- Uses NYC for coverage reporting

## Git Workflow
**CRITICAL**: NEVER work directly in the main branch
- Always create feature branches for any changes
- Use proper branch naming: `feat/description`, `fix/description`, `docs/description`
- Never commit directly to main - use PRs and proper merge workflow
- Example: `git checkout -b feat/new-feature` before making any changes

## Development Anti-Patterns to Avoid
**CRITICAL**: Lessons learned from painful debugging sessions that wasted significant time.

### Schema-First API Integration
- **NEVER assume API structure** - always investigate real API responses first
- **Create Zod schemas from actual data**, never from assumptions or documentation
- **Validate registry/configuration against real API structure** using live data
- **Save real API samples** and reference them when building schemas
- Example: `curl "https://api.example.com/endpoint?limit=1" | jq . > real-sample.json`

### Reality-Based Testing Strategy
- **Test against actual API responses, not mock data** - mocks give false confidence
- **Use schema validation to catch API changes** and configuration errors
- **When tests fail, fix the underlying issue, not the test expectation**
- **Mock tests are only useful for edge cases** - use real integration tests for primary validation
- Broken field mappings went undetected for months because mock tests always passed

### Strong Typing for External Systems  
- **Use specific union types instead of generic strings** - `'sf' | 'nyc' | 'la'` not `string`
- **Design type systems that guide users toward valid options** - especially for AI assistants
- **Leverage TypeScript to prevent configuration errors** - make invalid states impossible
- Generic string types provide no developer guidance and allow configuration errors

### Registry/Configuration Validation
- **Validate field mappings point to real fields** in actual API responses
- **Ensure field arrays are complete** - include ALL fields from API dumps, not just "important" ones
- **Verify data types match expectations** - test that TEXT fields can be cast to numbers
- **Test end-to-end functionality** with real searches, not just unit tests
- Missing fields and wrong mappings should be caught by automated tests

### User-Centric Design (AI-First for this project)
- **Design for actual users** - AI assistants need discovery APIs and metadata
- **Provide comprehensive capability detection** - what search filters work where?
- **Include detailed error reporting** - help users understand what went wrong
- **Strong typing provides IDE autocomplete** - essential for programmatic usage
- Over-engineering theoretical flexibility wastes time - focus on real use cases

### Test Failure Investigation Protocol
1. **Is this a test problem or system problem?** (Usually system problem)
2. **What real-world issue does this expose?** 
3. **Fix the root cause, not the test expectation**
4. **Verify the fix solves the actual user problem**
5. **Tests should catch real errors** - if they don't, the tests are wrong

### Data Accuracy Verification Process
For any external API integration:
1. **Dump actual field lists from live API** - don't trust documentation
2. **Save real response samples** - use for schema creation and testing
3. **Create schemas from real data** - validate against actual structure  
4. **Test with real API calls** - integration tests over unit tests
5. **Document data inconsistencies** - which fields are optional/inconsistent

## Municipal API Specific Notes
- **Socrata APIs store numbers as TEXT** - requires `::number` casting for comparisons
- **Socrata doesn't accept 'Z' timezone** in ISO dates - remove before sending
- **Registry field arrays must be UNION of dump + sample data** - include ALL known fields
- **Field mappings are at dataset level**, not municipality level
- **Value filtering only works if municipality has value field mapping**