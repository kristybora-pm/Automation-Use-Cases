# Automation Use Cases

A collection of practical automation scripts built to solve real problems — without reaching for AI when a simpler tool does the job better.

Each project is self-contained with its own README and setup instructions.

---

## Projects

| Project | Description | Stack |
|---|---|---|
| [Gmail Inbox Cleaner](./gmail-inbox-cleaner/) | Automatically deletes inbox clutter on a weekly schedule — promotions, social, forums, newsletters, spam, and age-based rules for purchases and updates | Google Apps Script, Gmail API |

*More coming soon.*

---

## Philosophy

These projects are built around one principle: **match the tool to the problem**.

Not every automation needs an AI agent. When the rules are clear and the inputs are predictable, a deterministic script is faster, cheaper, more reliable, and easier to debug than an LLM-based flow.

AI is the right call when a problem requires judgment, context, or ambiguity resolution. Scheduled cleanup tasks, rule-based filters, and repetitive workflows are not that problem.

---

## Structure
```
automation-use-cases/
├── README.md                  ← you are here
└── gmail-inbox-cleaner/
    ├── README.md              ← project overview + setup guide
    └── GmailAutoDelete.gs     ← the script

