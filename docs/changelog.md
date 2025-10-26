# Changelog

## 2024-05-04
### Added
- `src/server.js` Express server exposing `/upsert`, `/query`, `/doc`, `/stats`, `/collections` endpoints.
- `src/vectorStore.js` file-backed text similarity store with safe collection and metadata handling.
- `mcp/server.py` Model Context Protocol bridge that maps search and document fetch calls to the HTTP API.
- Continuous integration workflow skeleton and Python requirements for the MCP bridge.

### Changed
- Updated `README.md` with quick start, REST documentation, and security notes.
- Expanded audit log with the latest hardening work.
