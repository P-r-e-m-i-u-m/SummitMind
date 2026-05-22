# Security Policy

SummitMind is a local-first browser app. It does not use a backend service, analytics script, or third-party tracker.

## Data Model

- Memories are stored in browser `localStorage`.
- Exports are user-triggered JSON or Markdown files.
- Imports are user-selected JSON files.
- Demo data is opt-in through the **Load demo** button or `?demo=1`.

## Reporting Issues

Please open a GitHub issue for security or privacy concerns that do not expose sensitive user data.

Do not include private memories, exported archives, browser profile data, secrets, or personal documents in public issues.

## Current Limitations

Browser storage is not a secure vault. Anyone with access to the same browser profile may be able to read local data. Sensitive use cases should wait for encrypted exports or a desktop storage model.
