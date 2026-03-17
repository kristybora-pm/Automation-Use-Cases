# Gmail Inbox Cleaner — Automated Weekly Cleanup

A lightweight Google Apps Script that automatically deletes inbox clutter on a weekly schedule. No agent, no LLM, no infrastructure. Just the right tool for the job.

> Want the script? See [GmailAutoDelete.gs](./GmailAutoDelete.gs)

---

## What it does

Connects to your Gmail via Google Apps Script and permanently deletes emails matching configurable rules — while protecting anything important.

### Cleanup rules (all configurable)

| Category | Rule |
|---|---|
| Promotions | Delete all |
| Social notifications | Delete all |
| Forums | Delete all |
| Newsletters | Delete all (any email containing "unsubscribe") |
| Purchases | Delete if older than 2 months |
| Updates | Delete if older than 6 months |
| Spam | Delete if older than 1 month |
| Custom sender groups | Delete if older than N days (e.g. building notices, mailing lists) |

### Always protected — never deleted

- Starred emails
- Emails marked Important
- Flight bookings, hotel confirmations, travel itineraries
- Invoices, tax documents, statements
- Interview and job application emails
- One-time passwords and security codes
- Order confirmations and shipment tracking
- Any domain or keyword you add to the safe list

All rules and safeguards are controlled by a single `CONFIG` object at the top of the script — no digging through code.

---

## Tech stack

- **Google Apps Script** — runs entirely inside your Google account, no hosting or servers needed
- **Gmail API (Advanced Service)** — enables permanent deletion (bypasses Trash)
- **Time-based trigger** — fires automatically on a schedule you set (e.g. every Sunday at 10pm)

---

## Setup (5 minutes)

### 1. Open Google Apps Script
Go to [script.google.com](https://script.google.com) → click **New project**

### 2. Paste the script
Copy the contents of `GmailAutoDelete.gs` into the editor → `Ctrl+S` to save

### 3. Enable the Gmail API
Left sidebar → click **"+" next to Services** → find **Gmail API** → click **Add**

> Required for permanent deletion. Without it, emails only move to Trash.

### 4. Dry run first (recommended)
Select `dryRun` from the function dropdown → click **Run** → go to **View → Logs**

You'll see exactly which emails would be deleted vs protected. Nothing is touched yet.

### 5. Run it now
Switch to `runNow` → click **Run**. Grant permissions when Google prompts → it cleans your inbox immediately.

### 6. Set up the weekly trigger
Switch to `createWeeklyTrigger` → click **Run** once.

This schedules automatic cleanup every Sunday at 10pm. You never need to touch it again. To change the day/time, go to the **Triggers** (clock icon in the sidebar) and edit it there.

---

## Customisation

Everything lives in the `CONFIG` block at the top of the script:

```javascript
var CONFIG = {

  // Turn each rule on/off
  deletePromotions:         true,
  deleteSocial:             true,
  deleteForums:             true,
  deleteNewsletters:        true,

  // Age-based rules (set to 0 to disable)
  deletePurchasesAfterDays: 60,    // 2 months
  deleteUpdatesAfterDays:   180,   // 6 months
  deleteSpamAfterDays:      30,    // 1 month

  // Custom sender group — e.g. building notices, community mailing lists
  // Set to 0 to keep all, or adjust the number of days
  deleteCustomSenderAfterDays: 365,

  // Keywords in subject line that always protect an email
  safeSubjectKeywords: [
    "booking", "flight", "invoice", "interview", "tax", ...
  ],

  // Sender domains that are always safe (never deleted)
  safeSenderDomains: [
    "yourgov.ca", "yourbank.com", ...
  ],

  // Sender domains to delete after N days (add your own)
  customSenderDomains: [
    "your-building-portal.com", "your-community-list.org"
  ]
};
```

---

## Functions

| Function | What it does |
|---|---|
| `dryRun` | Preview what would be deleted — nothing is touched |
| `runNow` | Run the cleanup immediately |
| `createWeeklyTrigger` | Set up automatic weekly schedule (run once) |

---

## Why not an AI agent?

Deliberate design choice. The cleanup rules are well-defined and deterministic — there's no ambiguity that requires reasoning. Using an LLM here would add latency, cost, and failure points for zero benefit.

A rule-based, scheduled script is the right tool for a rule-based, scheduled task.

AI shines when the problem is ambiguous, contextual, or requires judgment. Inbox cleanup based on Gmail categories, sender domains, and email age is none of those things.

---

## Contributing

Rules, safeguards, and edge cases are all welcome. Open an issue or PR if you have a useful addition.

---

## Author

Kristy Bora — Product Manager
https://www.linkedin.com/in/kristy-bora-52576280
