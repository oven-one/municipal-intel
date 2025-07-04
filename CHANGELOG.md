# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 3.0.0 (2025-07-04)


### ⚠ BREAKING CHANGES

* Major architectural redesign from field normalization to natural language descriptions

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
* Replace complex 25+ field normalization with natural language descriptions

• Replace MunicipalProject schema (25+ fields → 5 fields: id, source, description, rawData, lastUpdated)
• Add getDescription methods to all datasets for rich, contextual descriptions
• Include full municipal context (city, state, ZIP) in all descriptions
• Reduce payload size by ~70% by eliminating duplicate normalized fields
• Delete test-utils module and inline validation logic
• Update all documentation for AI-first approach

Key Changes:
- src/types/projects.ts: Simplified MunicipalProject interface
- src/types/sources.ts: Added getDescription to SocrataDataset interface
- src/data/municipal-registry.ts: Implemented dataset-specific descriptions
- src/clients/socrata/client.ts: Updated normalizeProject for new schema
- docs/AI_FIRST_DESIGN.md: New comprehensive design philosophy guide
- README.md: Updated examples and schema documentation
- docs/MUNICIPAL_API_GUIDE.md: Replaced normalization with description approach
- docs/ADD_NEW_SOURCE.md: Updated for getDescription implementation

Benefits:
- Natural language descriptions ready for LLM consumption
- Self-contained context eliminates need for field assembly
- Zero field mapping maintenance (no more broken mappings)
- Smaller payloads improve performance and reduce costs
- Better data quality visibility through natural language

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>

### Features

* Complete AI-first redesign with natural language descriptions ([54e3fb4](https://github.com/oven-one/municipal-intel/commit/54e3fb4d7b478fac7c95de5b32bb4ede327e8689))
* Complete TypeScript conversion recovery ([fb48241](https://github.com/oven-one/municipal-intel/commit/fb4824133cbf5c7fbaf3debe818333ac5dddb972))
* Initial release of municipal intelligence package ([63ebb5d](https://github.com/oven-one/municipal-intel/commit/63ebb5dc176c5ca67b650493a929f6608efdf784))


### Bug Fixes

* Add backward compatibility for tests and improve error handling ([bcb54ad](https://github.com/oven-one/municipal-intel/commit/bcb54ad5ad50552d6161f5b8427fcaf62eab7795))
* Fix dataset field mapping bug where wrong dataset context was used ([8e9ad84](https://github.com/oven-one/municipal-intel/commit/8e9ad844b943417d2d402912fee6e14590508c01))
* Implement universal value filtering with adjustments framework ([49c2735](https://github.com/oven-one/municipal-intel/commit/49c27352fb2019423b0239c732d57311a953411c))
* Resolve real test failures exposed by unit tests ([93b588a](https://github.com/oven-one/municipal-intel/commit/93b588acced6b20df771c6c1ee1316d6d331adab))
* Update repository field format for npm publishing ([df96ddf](https://github.com/oven-one/municipal-intel/commit/df96ddf57bd2de08b8bb90046b11a91ec4dbf95d))


* Bump version to 2.0.0 for AI-first redesign ([1fe94e7](https://github.com/oven-one/municipal-intel/commit/1fe94e7f07fb998c5585db76448b42cdbf1ab3a7))
