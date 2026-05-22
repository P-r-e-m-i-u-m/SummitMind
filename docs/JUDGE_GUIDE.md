# Judge Guide

This page is a quick path for reviewing SummitMind as a Finish-Up-A-Thon submission.

## Live Demo

https://p-r-e-m-i-u-m.github.io/SummitMind/?demo=1&report=1

The demo URL loads sample memories and opens the monthly reflection report.

## 90-Second Review Path

1. Open the live demo link.
2. Notice the pinned memories at the top of the archive.
3. Open the proof links in the top overview panel.
4. Click a tag filter such as `reflection` or `privacy`.
5. Click **Edit** on a memory and update any field.
6. Click **Report** if the report is hidden.
7. Click **Copy** to copy the monthly report as Markdown.
8. Click **Print** to preview the clean review layout.
9. Export the archive as JSON if you want to inspect the local data format.

## What Changed During The Finish-Up

Before, SummitMind was a simple capture/search/archive tool. The finished version now supports:

- editing saved memories
- pinning important memories
- filtering by generated tags
- generating a monthly reflection report
- copying the report as Markdown
- printing a clean review view
- loading demo data for quick evaluation
- running CI checks for formatting and JavaScript syntax
- deploying to GitHub Pages

## Why It Matters

The project is not trying to be another productivity dashboard. It is a private continuity layer: a place to remember why a decision changed, why a project paused, and which themes keep returning.

## Privacy Notes

- No backend.
- No account.
- No tracking.
- Data stays in browser `localStorage`.
- Export and import are user-triggered.
