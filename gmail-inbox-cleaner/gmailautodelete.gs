/**
 * Gmail Auto-Delete Script
 * ========================
 * Automatically deletes inbox clutter on a weekly schedule.
 * Applies to ALL emails — read and unread.
 * Fully configurable — edit the CONFIG block to match your rules.
 *
 * RULES (defaults):
 *   Promotions  → delete ALL
 *   Social      → delete ALL
 *   Forums      → delete ALL
 *   Newsletters → delete ALL (emails containing "unsubscribe")
 *   Purchases   → delete if older than 2 months
 *   Updates     → delete if older than 6 months
 *   Job updates → delete if older than 6 months
 *   Spam        → delete if older than 1 month
 *   Custom senders → delete if older than N days
 *
 * ALWAYS PROTECTED:
 *   Starred, Important, flight confirmations, tax/invoice docs,
 *   interview emails, security codes, shipment tracking,
 *   plus any keywords/domains you add to the safe lists
 *
 * SETUP:
 *   1. Paste into https://script.google.com
 *   2. Services → "+" → add Gmail API (enables permanent delete)
 *   3. Run dryRun to preview → then runNow to delete
 *   4. Run createWeeklyTrigger once to automate
 *
 * NOTE ON BULK CLEARING:
 *   The script processes 100 threads per category per run.
 *   For a large initial backlog, manually bulk-delete in Gmail first:
 *   Click a category tab → select all → delete.
 *   Then let this script maintain your inbox weekly going forward.
 */

// ─────────────────────────────────────────────
// CONFIGURATION — edit this block to your needs
// ─────────────────────────────────────────────

var CONFIG = {

  // --- ON/OFF SWITCHES ---
  deletePromotions:  true,   // Gmail Promotions category — delete ALL
  deleteSocial:      true,   // Gmail Social category — delete ALL
  deleteForums:      true,   // Gmail Forums category — delete ALL
  deleteNewsletters: true,   // Emails containing "unsubscribe" — delete ALL

  // --- AGE-BASED RULES (days, set to 0 to disable) ---
  deletePurchasesAfterDays:  60,   // 2 months
  deleteUpdatesAfterDays:    180,  // 6 months
  deleteJobUpdatesAfterDays: 180,  // 6 months
  deleteSpamAfterDays:       30,   // 1 month

  // --- CUSTOM SENDER GROUP ---
  // Useful for building portals, community lists, mailing lists, etc.
  // Emails from these senders are deleted if older than N days
  // Set to 0 to disable
  deleteCustomSendersAfterDays: 365,

  // Add sender domains you want age-based deletion for
  customSenderDomains: [
    // "example-building-portal.com",
    // "example-community-newsletter.org"
  ],

  // --- SAFETY CAP ---
  // Max threads deleted per run per category
  // Increase if you want to process more per weekly run
  maxPerRun: 400,

  // --- SAFEGUARDS (never deleted regardless of category) ---

  // Protects emails containing these phrases in the subject
  // Uses specific phrases to avoid catching promo emails that
  // mention keywords like "flight deals" or "tax season"
  safeSubjectKeywords: [
    "your booking confirmation",
    "your flight confirmation",
    "flight itinerary",
    "boarding pass",
    "e-ticket",
    "your itinerary",
    "check-in is open",
    "your invoice",
    "your statement",
    "your t4",
    "your roe",
    "interview confirmation",
    "offer letter",
    "your one-time",
    "your otp",
    "security code",
    "your shipment",
    "tracking number"
  ],

  // Sender domains that are ALWAYS safe — add your bank, govt, employer, etc.
  safeSenderDomains: [
    // "yourgov.ca",
    // "yourbank.com",
    // "youremployer.com"
  ]

};

// ─────────────────────────────────────────────
// MAIN — called manually or by weekly trigger
// ─────────────────────────────────────────────

function runNow() {
  Logger.log("=== Gmail Auto-Delete starting — " + new Date() + " ===");
  var total = 0;

  // Delete ALL promotions — read and unread
  if (CONFIG.deletePromotions) {
    total += deleteByQuery(
      "category:promotions -is:starred -label:important",
      "Promotions (all)"
    );
  }

  // Delete ALL social — read and unread
  if (CONFIG.deleteSocial) {
    total += deleteByQuery(
      "category:social -is:starred -label:important",
      "Social (all)"
    );
  }

  // Delete ALL forums — read and unread
  if (CONFIG.deleteForums) {
    total += deleteByQuery(
      "category:forums -is:starred -label:important",
      "Forums (all)"
    );
  }

  // Delete ALL newsletters — read and unread
  if (CONFIG.deleteNewsletters) {
    total += deleteByQuery(
      "unsubscribe -is:starred -label:important -category:promotions -category:social -category:forums",
      "Newsletters (all)"
    );
  }

  // Purchases older than 2 months — read and unread
  // Uses subject keywords because Gmail rarely assigns category:purchases
  if (CONFIG.deletePurchasesAfterDays > 0) {
    total += deleteByQuery(
      "(subject:\"order confirmed\" OR subject:\"order #\" OR subject:\"your order\" OR " +
      "subject:\"purchase confirmed\" OR subject:\"payment confirmed\" OR subject:\"payment received\") " +
      "-is:starred -label:important " + olderThan(CONFIG.deletePurchasesAfterDays),
      "Purchases (" + CONFIG.deletePurchasesAfterDays + "d+)"
    );
  }

  // Updates older than 6 months — read and unread
  if (CONFIG.deleteUpdatesAfterDays > 0) {
    total += deleteByQuery(
      "category:updates -is:starred -label:important " + olderThan(CONFIG.deleteUpdatesAfterDays),
      "Updates (" + CONFIG.deleteUpdatesAfterDays + "d+)"
    );
  }

  // Job application updates older than 6 months — read and unread
  if (CONFIG.deleteJobUpdatesAfterDays > 0) {
    total += deleteByQuery(
      "(subject:\"your application\" OR subject:\"application update\" OR " +
      "subject:\"application received\" OR subject:\"thank you for applying\" OR " +
      "subject:\"we received your application\" OR subject:\"application status\" OR " +
      "subject:\"update on your candidacy\" OR subject:\"your candidacy\") " +
      "-is:starred -label:important " + olderThan(CONFIG.deleteJobUpdatesAfterDays),
      "Job updates (" + CONFIG.deleteJobUpdatesAfterDays + "d+)"
    );
  }

  // Spam older than 1 month — read and unread
  if (CONFIG.deleteSpamAfterDays > 0) {
    total += deleteByQuery(
      "in:spam " + olderThan(CONFIG.deleteSpamAfterDays),
      "Spam (" + CONFIG.deleteSpamAfterDays + "d+)"
    );
  }

  // Custom senders older than N days
  if (CONFIG.deleteCustomSendersAfterDays > 0 && CONFIG.customSenderDomains.length > 0) {
    total += deleteOldCustomSenders();
  }

  Logger.log("=== Done. Total deleted this run: " + total + " ===");
}

// ─────────────────────────────────────────────
// CORE DELETE
// ─────────────────────────────────────────────

function deleteByQuery(query, label) {
  Logger.log("--- " + label + " | " + query);
  var deleted = 0;
  var threads = GmailApp.search(query, 0, 100);

  for (var i = 0; i < threads.length; i++) {
    if (deleted >= CONFIG.maxPerRun) {
      Logger.log("  Cap reached (" + CONFIG.maxPerRun + "). Remainder next run.");
      break;
    }
    if (isSafeThread(threads[i])) {
      Logger.log("  PROTECTED: " + threads[i].getFirstMessageSubject());
      continue;
    }
    Logger.log("  DELETING: " + threads[i].getFirstMessageSubject());
    Gmail.Users.Threads.remove("me", threads[i].getId());
    deleted++;
  }

  Logger.log("  " + label + ": deleted " + deleted);
  return deleted;
}

function deleteOldCustomSenders() {
  var deleted = 0;
  var dateStr = formatDate(CONFIG.deleteCustomSendersAfterDays);

  for (var i = 0; i < CONFIG.customSenderDomains.length; i++) {
    var q = "from:" + CONFIG.customSenderDomains[i] + " before:" + dateStr + " -is:starred";
    Logger.log("--- Custom sender: " + CONFIG.customSenderDomains[i]);
    var threads = GmailApp.search(q, 0, 100);

    for (var t = 0; t < threads.length; t++) {
      if (threads[t].hasStarredMessages()) {
        Logger.log("  PROTECTED (starred): " + threads[t].getFirstMessageSubject());
        continue;
      }
      Logger.log("  DELETING: " + threads[t].getFirstMessageSubject());
      Gmail.Users.Threads.remove("me", threads[t].getId());
      deleted++;
    }
  }

  Logger.log("  Custom senders: deleted " + deleted);
  return deleted;
}

// ─────────────────────────────────────────────
// SAFEGUARD CHECK
// ─────────────────────────────────────────────

function isSafeThread(thread) {
  if (thread.hasStarredMessages()) return true;
  if (thread.isImportant()) return true;

  var subject = thread.getFirstMessageSubject().toLowerCase();
  for (var k = 0; k < CONFIG.safeSubjectKeywords.length; k++) {
    if (subject.indexOf(CONFIG.safeSubjectKeywords[k]) !== -1) return true;
  }

  var messages = thread.getMessages();
  for (var m = 0; m < messages.length; m++) {
    var from = messages[m].getFrom().toLowerCase();

    for (var d = 0; d < CONFIG.safeSenderDomains.length; d++) {
      if (from.indexOf(CONFIG.safeSenderDomains[d]) !== -1) return true;
    }

    for (var c = 0; c < CONFIG.customSenderDomains.length; c++) {
      if (from.indexOf(CONFIG.customSenderDomains[c]) !== -1) {
        var cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - CONFIG.deleteCustomSendersAfterDays);
        if (messages[m].getDate() > cutoff) return true;
      }
    }
  }

  return false;
}

// ─────────────────────────────────────────────
// DRY RUN — preview without deleting anything
// ─────────────────────────────────────────────

function dryRun() {
  Logger.log("=== DRY RUN — nothing will be deleted ===");
  var total = 0;

  var queries = [
    {
      q: "category:promotions -is:starred -label:important",
      label: "Promotions (all)"
    },
    {
      q: "category:social -is:starred -label:important",
      label: "Social (all)"
    },
    {
      q: "category:forums -is:starred -label:important",
      label: "Forums (all)"
    },
    {
      q: "unsubscribe -is:starred -label:important -category:promotions -category:social -category:forums",
      label: "Newsletters (all)"
    },
    {
      q: "(subject:\"order confirmed\" OR subject:\"order #\" OR subject:\"your order\" OR subject:\"purchase confirmed\" OR subject:\"payment confirmed\" OR subject:\"payment received\") " +
         "-is:starred -label:important " + olderThan(CONFIG.deletePurchasesAfterDays),
      label: "Purchases (" + CONFIG.deletePurchasesAfterDays + "d+)"
    },
    {
      q: "category:updates -is:starred -label:important " + olderThan(CONFIG.deleteUpdatesAfterDays),
      label: "Updates (" + CONFIG.deleteUpdatesAfterDays + "d+)"
    },
    {
      q: "(subject:\"your application\" OR subject:\"application update\" OR subject:\"application received\" OR " +
         "subject:\"thank you for applying\" OR subject:\"we received your application\" OR " +
         "subject:\"application status\" OR subject:\"update on your candidacy\" OR subject:\"your candidacy\") " +
         "-is:starred -label:important " + olderThan(CONFIG.deleteJobUpdatesAfterDays),
      label: "Job updates (" + CONFIG.deleteJobUpdatesAfterDays + "d+)"
    },
    {
      q: "in:spam " + olderThan(CONFIG.deleteSpamAfterDays),
      label: "Spam (" + CONFIG.deleteSpamAfterDays + "d+)"
    }
  ];

  for (var i = 0; i < queries.length; i++) {
    var threads = GmailApp.search(queries[i].q, 0, 100);
    var del = 0, prot = 0;
    for (var t = 0; t < threads.length; t++) {
      if (isSafeThread(threads[t])) {
        prot++;
        Logger.log("  [PROTECT] " + threads[t].getFirstMessageSubject());
      } else {
        del++;
        Logger.log("  [DELETE]  " + threads[t].getFirstMessageSubject());
      }
    }
    Logger.log("--- " + queries[i].label + ": would delete " + del + ", protect " + prot);
    total += del;
  }

  if (CONFIG.deleteCustomSendersAfterDays > 0 && CONFIG.customSenderDomains.length > 0) {
    var dateStr = formatDate(CONFIG.deleteCustomSendersAfterDays);
    for (var c = 0; c < CONFIG.customSenderDomains.length; c++) {
      var q = "from:" + CONFIG.customSenderDomains[c] + " before:" + dateStr + " -is:starred";
      var ct = GmailApp.search(q, 0, 100);
      Logger.log("--- Custom sender (" + CONFIG.customSenderDomains[c] + "): would delete " + ct.length);
      for (var x = 0; x < ct.length; x++) {
        Logger.log("  [DELETE]  " + ct[x].getFirstMessageSubject());
      }
      total += ct.length;
    }
  }

  Logger.log("=== Dry run complete. Would delete: " + total + " total ===");
}

// ─────────────────────────────────────────────
// WEEKLY TRIGGER — run this once to set up
// ─────────────────────────────────────────────

function createWeeklyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger("runNow")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(22)
    .create();
  Logger.log("Weekly trigger set: every Sunday at 10pm.");
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function olderThan(days) {
  return "before:" + formatDate(days);
}

function formatDate(daysAgo) {
  var d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return Utilities.formatDate(d, "GMT", "yyyy/MM/dd");
}
