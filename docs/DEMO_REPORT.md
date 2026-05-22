# Demo Report

This report documents the revived SummitMind workflow for the DEV GitHub Finish-Up-A-Thon submission.

## Demo URL

Open:

```text
index.html?demo=1&report=1
```

This loads sample memories and opens the monthly reflection report so reviewers can understand the product quickly.

## Demo Screenshot

![SummitMind demo](summitmind-demo-full.png)

## Finished Workflow

The revived app now supports a complete local-first memory loop:

1. Capture a memory.
2. Edit the memory when the context changes.
3. Pin memories that still matter.
4. Filter by recurring tags.
5. Generate a private monthly reflection report.
6. Copy the report as Markdown.
7. Print a clean archive/report view.
8. Export or import the archive as JSON.

## Verification Notes

- The app runs without a build step.
- The app stores data in browser `localStorage`.
- No external scripts, trackers, or backend services are used.
- Demo data is opt-in through the **Load demo** button or the demo query string.
- GitHub Actions runs formatting and JavaScript syntax checks.
