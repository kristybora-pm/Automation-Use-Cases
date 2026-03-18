# Gmail Inbox Cleaner

A lightweight Google Apps Script that automatically deletes inbox clutter on a weekly schedule. No agent, no LLM, no infrastructure — just the right tool for the job.

> Want to jump straight in? See [GmailAutoDelete.gs](./GmailAutoDelete.gs)

---

## What it does

Connects to your Gmail via Google Apps Script and permanently deletes emails matching configurable rules — while protecting anything important. Applies to **all emails, read and unread**.

### Cleanup rules (all configurable)

| Category | Rule |
|---|---|
| Promotions | Delete all |
| Social notifications | Delete all |
| Forums | Delete all |
| Newsletters | Delete all (any email containing "unsubscribe") |
| Purchases | Delete if older than 2 months |
| Updates | Delete if older than 6 months |
| Job application updates | Delete if older than 6 months |
| Spam | Delete if older than 1 month |
| Custom sender group | Delete if older than N days (e.g. building notices, mailing lists) |

### Always protected — never deleted

- Starred emails
- Emails marked Important
- Flight booking confirmations and itineraries
- Invoices, tax documents, statements
- Interview confirmation emails
- One-time passwords and security codes
- Shipment tracking emails
- Any domain or keyword you add to the safe lists

All rules and safeguards live in a single `CONFIG` block at the top of the script — no digging through code.

---

## Why subject keywords instead of `category:purchases`?

Gmail rarely assigns the `purchases` label reliably. This script uses subject line keywords (`order confirmed`, `payment received`, etc.) to catch purchase emails regardless of how Gmail categorises them. More reliable in practice.

---

## Tech stack

- **Google Apps Script** — runs entirely inside your Google account, no hosting or servers needed
- **Gmail API (Advanced Service)** — enables permanent deletion, bypassing Trash
- **Time-based trigger** — fires automatically every Sunday at 10pm (configurable)

---

## Setup (5 minutes)

### 1. Open Google Apps Script
Go to [script.google.com](https://script.google.com) → click **New project**

### 2. Paste the script
Copy the contents of `GmailAutoDelete.gs` → paste into the editor → `Ctrl+S` to save

### 3. Enable the Gmail API
Left sidebar → click **"+" next to Services** → find **Gmail API** → click **Add**

> Required for permanent deletion. Without it, emails only move to Trash.

### 4. Dry run first (recommended)
Select `dryRun` from the function dropdown → click **Run** → go to **View → Logs**

You'll see exactly which emails would be deleted vs protected. Nothing is touched yet.

### 5. Run it now
Switch to `runNow` → click **Run**. Grant permissions when Google prompts.

### 6. Set up the weekly trigger
Switch to `createWeeklyTrigger` → click **Run** once.

Schedules automatic cleanup every Sunday at 10pm. To change the day or time, go to the **Triggers** tab (clock icon in the left sidebar) and edit it there.

---

## A note on large backlogs

The script processes **100 threads per category per run**. If you have a large existing backlog (thousands of emails), manually bulk-delete first:

1. In Gmail, click a category tab (e.g. Promotions)
2. Check the top-left checkbox → click **"Select all conversations"**
3. Hit Delete

Then let the script maintain your inbox weekly going forward. It's designed for ongoing maintenance, not one-time bulk clearing.

---

## Customisation

Everything is in the `CONFIG` block at the top of the script:

```javascript
var CONFIG = {

  // Turn each rule on/off
  deletePromotions:  true,
  deleteSocial:      true,
  deleteForums:      true,
  deleteNewsletters: true,

  // Age-based rules in days (set to 0 to disable)
  deletePurchasesAfterDays:  60,   // 2 months
  deleteUpdatesAfterDays:    180,  // 6 months
  deleteJobUpdatesAfterDays: 180,  // 6 months
  deleteSpamAfterDays:       30,   // 1 month

  // Custom sender group — e.g. building notices, community lists
  deleteCustomSendersAfterDays: 365,
  customSenderDomains: [
    // "example-building-portal.com"
  ],

  // Subject phrases that always protect an email from deletion
  safeSubjectKeywords: [
    "your booking confirmation", "boarding pass", "e-ticket", ...
  ],

  // Sender domains that are always safe
  safeSenderDomains: [
    // "yourgov.ca",
    // "yourbank.com"
  ]
};
```

---

## Functions

| Function | What it does |
|---|---|
| `dryRun` | Preview what would be deleted — nothing is touched |
| `runNow` | Run the cleanup immediately |
| `createWeeklyTrigger` | Set up automatic weekly schedule (run once only) |

---

## Why not an AI agent?

Deliberate design choice. The cleanup rules are well-defined and deterministic — there is no ambiguity that requires reasoning. Using an LLM here would add latency, cost, and failure points for zero benefit.

A rule-based scheduled script is the right tool for a rule-based scheduled task. AI is the right call when the problem requires judgment, context, or ambiguity resolution. Inbox cleanup based on Gmail categories, sender domains, and email age is none of those things.

---

## Contributing

Rules, safeguards, and edge cases are all welcome. Open an issue or PR if you have a useful addition.

---

## Author
Kristy Bora

[Your Name] — Product Manager
[LinkedIn](#) · [GitHub](#)
