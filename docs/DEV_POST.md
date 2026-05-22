# SummitMind: finishing a local-first memory app for the GitHub Finish-Up-A-Thon

This is a submission for the GitHub Finish-Up-A-Thon Challenge.

## What I built

SummitMind is a local-first memory app for understanding thoughts, decisions, projects, and recurring patterns.

Most note apps help you store information. SummitMind is focused on the next step: helping you notice what keeps coming back.

The app runs in the browser with no account, no backend, and no tracking. Memories stay in `localStorage` unless the user exports them.

Repository: https://github.com/P-r-e-m-i-u-m/SummitMind

Demo path: open `index.html?demo=1&report=1`

Release: https://github.com/P-r-e-m-i-u-m/SummitMind/releases/tag/v0.2.0

## Before

The old version had a good idea, but it still felt unfinished.

It could:

- save memories
- search
- group by month
- show simple pattern cards
- import and export JSON

But the product loop was incomplete. You could capture a memory, but you could not comfortably revise it, mark it as important, filter by theme, or turn your archive into a review.

## After

The revived version now supports a complete reflection flow:

1. Capture a memory.
2. Edit it when the context changes.
3. Pin memories that still matter.
4. Filter the archive by generated tags.
5. Generate a private monthly reflection report.
6. Copy the report as Markdown or print the archive.

I also added:

- demo data for quick evaluation
- a demo screenshot and report
- keyboard shortcuts for search and save
- accessibility polish with a skip link and live status updates
- print styles
- CI checks for formatting and JavaScript syntax

## How GitHub Copilot helped

Copilot helped me turn a vague unfinished roadmap into concrete implementation steps.

The most useful parts were:

- breaking the revival into small, reviewable product improvements
- refactoring the browser-only JavaScript without introducing a framework
- adding edit, pin, tag filtering, and report behavior while preserving old saved data
- improving UI copy so the product felt calm and human
- shaping the before/after story for the challenge submission

I still reviewed the code manually, tested the app in Chrome, generated screenshots, and kept the scope intentionally small.

## What I learned

The missing piece was not a giant AI feature. It was the loop.

SummitMind became more useful when a memory could move through its full lifecycle:

- capture
- revise
- prioritize
- filter
- reflect
- export

That turned it from a note list into a small personal continuity tool.

## Screenshots

![SummitMind demo](https://raw.githubusercontent.com/P-r-e-m-i-u-m/SummitMind/main/docs/summitmind-demo-full.png)

## Tech stack

- HTML
- CSS
- JavaScript
- Browser `localStorage`
- GitHub Actions

## Links

- Repository: https://github.com/P-r-e-m-i-u-m/SummitMind
- Demo report: https://github.com/P-r-e-m-i-u-m/SummitMind/blob/main/docs/DEMO_REPORT.md
- Challenge notes: https://github.com/P-r-e-m-i-u-m/SummitMind/blob/main/CHALLENGE_SUBMISSION.md

## Tags

`#devchallenge` `#githubchallenge` `#githubcopilot` `#webdev` `#opensource`
