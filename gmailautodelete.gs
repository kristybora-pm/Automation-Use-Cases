**
 * Gmail Auto-Delete Script — Kristy's Inbox Cleaner
 * ===================================================
 * RULES:
 *   Promotions  → delete ALL (any age)
 *   Purchases   → delete if older than 2 months
 *   Social      → delete ALL (any age)
 *   Updates     → delete if older than 6 months
 *   Spam        → delete if older than 1 month
 *   Forums      → delete ALL (any age)
 *   Newsletters → delete ALL (any age, contains "unsubscribe")
 *   Old condo   → delete if older than 1 year
 *
 * ALWAYS PROTECTED (never deleted):
 *   Starred, Important, flight/booking/interview/tax/govt keywords
 */
 
var CONFIG = {
 
  // --- RULES ---
  deletePromotions:           true,   // delete ALL
  deleteSocial:               true,   // delete ALL
  deleteForums:               true,   // delete ALL
  deleteNewsletters:          true,   // delete ALL (contains unsubscribe)
 
  deletePurchasesAfterDays:   60,     // 2 months
  deleteUpdatesAfterDays:     180,    // 6 months
  deleteSpamAfterDays:        30,     // 1 month
  deleteOldCondoAfterDays:    365,    // 1 year
 
  maxPerRun: 400,
 
  // --- SAFEGUARDS ---
  safeSubjectKeywords: [
    "booking", "confirmation", "reservation", "itinerary",
    "flight", "ticket", "boarding", "e-ticket",
    "hotel", "check-in", "check in",
    "scanned", "scan", "document", "invoice", "receipt",
    "statement", "tax", "t4", "t4a", "roe",
    "password", "interview", "offer letter", "contract",
    "verification", "security code", "one-time", "otp",
    "shipment", "tracking", "order"
  ],
 
  safeSenderDomains: [
    "gov.ab.ca",
    "canada.ca",
    "cra-arc.gc.ca",
    "morganstanley.com"
  ],
 
  condoSenderDomains: [
    "condo-communities.com"
  ]
};
 
// ─────────────────────────────────────────────
// MAIN — run now or via weekly trigger
// ─────────────────────────────────────────────
 
function runNow() {
  Logger.log("=== Gmail Auto-Delete starting — " + new Date() + " ===");
  var total = 0;
 
  // Delete ALL promotions
  if (CONFIG.deletePromotions) {
    total += deleteByQuery("category:promotions -is:starred -label:important", "Promotions (all)");
  }
 
  // Delete ALL social
  if (CONFIG.deleteSocial) {
    total += deleteByQuery("category:social -is:starred -label:important", "Social (all)");
  }
 
  // Delete ALL forums
  if (CONFIG.deleteForums) {
    total += deleteByQuery("category:forums -is:starred -label:important", "Forums (all)");
  }
 
  // Delete ALL newsletters (unsubscribe keyword, not already caught above)
  if (CONFIG.deleteNewsletters) {
    total += deleteByQuery(
      "unsubscribe -is:starred -label:important -category:promotions -category:social -category:forums",
      "Newsletters (all)"
    );
  }
 
  // Delete purchases older than 2 months
  if (CONFIG.deletePurchasesAfterDays > 0) {
    total += deleteByQuery(
      "category:purchases -is:starred -label:important " + olderThan(CONFIG.deletePurchasesAfterDays),
      "Purchases (2mo+)"
    );
  }
 
  // Delete updates older than 6 months
  if (CONFIG.deleteUpdatesAfterDays > 0) {
    total += deleteByQuery(
      "category:updates -is:starred -label:important " + olderThan(CONFIG.deleteUpdatesAfterDays),
      "Updates (6mo+)"
    );
  }
 
  // Delete spam older than 1 month (includes spam folder)
  if (CONFIG.deleteSpamAfterDays > 0) {
    total += deleteByQuery(
      "in:spam " + olderThan(CONFIG.deleteSpamAfterDays),
      "Spam (1mo+)",
      true  // includeSpamTrash = true
    );
  }
 
  // Delete old condo notices
  if (CONFIG.deleteOldCondoAfterDays > 0) {
    total += deleteOldCondoNotices();
  }
 
  Logger.log("=== Done. Total deleted: " + total + " ===");
}
 
// ─────────────────────────────────────────────
// CORE DELETE FUNCTION
// ─────────────────────────────────────────────
 
function deleteByQuery(query, label, includeSpamTrash) {
  Logger.log("--- " + label + " | " + query);
  var deleted = 0;
  var threads = GmailApp.search(query, 0, 100);
 
  for (var i = 0; i < threads.length; i++) {
    if (deleted >= CONFIG.maxPerRun) {
      Logger.log("  Cap reached. Continue next run.");
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
 
function deleteOldCondoNotices() {
  var deleted = 0;
  var dateStr = formatDate(CONFIG.deleteOldCondoAfterDays);
 
  for (var i = 0; i < CONFIG.condoSenderDomains.length; i++) {
    var q = "from:" + CONFIG.condoSenderDomains[i] + " before:" + dateStr + " -is:starred";
    var threads = GmailApp.search(q, 0, 100);
    for (var t = 0; t < threads.length; t++) {
      if (threads[t].hasStarredMessages()) continue;
      Logger.log("  DELETING (old condo): " + threads[t].getFirstMessageSubject());
      Gmail.Users.Threads.remove("me", threads[t].getId());
      deleted++;
    }
  }
 
  Logger.log("  Old condo notices: deleted " + deleted);
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
 
    // Condo: safe only if recent
    for (var c = 0; c < CONFIG.condoSenderDomains.length; c++) {
      if (from.indexOf(CONFIG.condoSenderDomains[c]) !== -1) {
        var cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - CONFIG.deleteOldCondoAfterDays);
        if (messages[m].getDate() > cutoff) return true;
      }
    }
  }
 
  return false;
}
 
// ─────────────────────────────────────────────
// DRY RUN
// ─────────────────────────────────────────────
 
function dryRun() {
  Logger.log("=== DRY RUN — nothing will be deleted ===");
  var total = 0;
 
  var queries = [
    { q: "category:promotions -is:starred -label:important",                                                          label: "Promotions (all)" },
    { q: "category:social -is:starred -label:important",                                                              label: "Social (all)" },
    { q: "category:forums -is:starred -label:important",                                                              label: "Forums (all)" },
    { q: "unsubscribe -is:starred -label:important -category:promotions -category:social -category:forums",           label: "Newsletters (all)" },
    { q: "category:purchases -is:starred -label:important " + olderThan(CONFIG.deletePurchasesAfterDays),             label: "Purchases (2mo+)" },
    { q: "category:updates -is:starred -label:important " + olderThan(CONFIG.deleteUpdatesAfterDays),                 label: "Updates (6mo+)" },
    { q: "in:spam " + olderThan(CONFIG.deleteSpamAfterDays),                                                          label: "Spam (1mo+)" }
  ];
 
  for (var i = 0; i < queries.length; i++) {
    var threads = GmailApp.search(queries[i].q, 0, 100);
    var del = 0, prot = 0;
    for (var t = 0; t < threads.length; t++) {
      if (isSafeThread(threads[t])) { prot++; Logger.log("  [PROTECT] " + threads[t].getFirstMessageSubject()); }
      else                          { del++;  Logger.log("  [DELETE]  " + threads[t].getFirstMessageSubject()); }
    }
    Logger.log("--- " + queries[i].label + ": would delete " + del + ", protect " + prot);
    total += del;
  }
 
  // Condo
  var condoDateStr = formatDate(CONFIG.deleteOldCondoAfterDays);
  for (var c = 0; c < CONFIG.condoSenderDomains.length; c++) {
    var condoQ = "from:" + CONFIG.condoSenderDomains[c] + " before:" + condoDateStr + " -is:starred";
    var ct = GmailApp.search(condoQ, 0, 100);
    Logger.log("--- Old condo notices: would delete " + ct.length);
    for (var x = 0; x < ct.length; x++) Logger.log("  [DELETE]  " + ct[x].getFirstMessageSubject());
    total += ct.length;
  }
 
  Logger.log("=== Dry run complete. Would delete: " + total + " total ===");
}
 
// ─────────────────────────────────────────────
// WEEKLY TRIGGER — run once to set up
// ─────────────────────────────────────────────
 
function createWeeklyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "runNow") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
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
