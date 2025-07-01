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