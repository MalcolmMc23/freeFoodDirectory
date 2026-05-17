import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL =
  "https://foodlocator.sfmfoodbank.org/en/sf/94108/urgent/calfresh";
const DATA_DIR = join(__dirname, "data");
const LATEST = join(DATA_DIR, "latest.json");
const PREVIOUS = join(DATA_DIR, "previous.json");
const CHANGES = join(DATA_DIR, "changes.json");

interface FoodBank {
  name: string;
  address: string;
  hours: Record<string, string>;
  notes: string;
}

async function scrape(): Promise<FoodBank[]> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("Fetching", URL);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  const results = await page.evaluate(() => {
    const banks: Array<{
      name: string;
      address: string;
      hours: Record<string, string>;
      notes: string;
    }> = [];

    // Each food bank is a top-level div.ng-scope containing an h2.ng-binding
    const sections = document.querySelectorAll(".content-div .ng-scope");

    sections.forEach((section) => {
      const nameEl = section.querySelector("h2.ng-binding");
      if (!nameEl) return;

      const name = nameEl.childNodes[0]?.textContent?.trim() ?? "";
      const address =
        section.querySelector("span.text-nowrap.ng-binding")?.textContent?.trim() ?? "";

      // Hours table: th = label, td = value (may contain a list for multi-date fields)
      const hours: Record<string, string> = {};
      section.querySelectorAll("table.resource-table tbody tr").forEach((row) => {
        const label = row.querySelector("th.ng-binding")?.textContent?.trim();
        if (!label) return;
        // Multi-date rows (e.g. Next Distribution) use a <ul> of <li> items
        const listItems = row.querySelectorAll("td ul li");
        if (listItems.length) {
          hours[label] = Array.from(listItems)
            .map((li) => li.textContent?.trim())
            .filter(Boolean)
            .join(", ");
        } else {
          const val = row.querySelector("td.ng-binding")?.textContent?.trim();
          if (val) hours[label] = val;
        }
      });

      // Warning/info callouts
      const noteEls = section.querySelectorAll(
        ".bs-callout-warning.ng-binding, .bs-callout-info.ng-binding"
      );
      const notes = Array.from(noteEls)
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join(" | ");

      banks.push({ name, address, hours, notes });
    });

    return banks;
  });

  await browser.close();
  return results;
}

function diff(prev: FoodBank[], curr: FoodBank[]) {
  const changes: {
    added: FoodBank[];
    removed: FoodBank[];
    changed: Array<{ name: string; field: string; from: string; to: string }>;
  } = { added: [], removed: [], changed: [] };

  const key = (b: FoodBank) => b.name || b.address;
  const prevMap = new Map(prev.map((b) => [key(b), b]));
  const currMap = new Map(curr.map((b) => [key(b), b]));

  for (const [k, bank] of currMap) {
    if (!prevMap.has(k)) {
      changes.added.push(bank);
    } else {
      const old = prevMap.get(k)!;
      for (const field of ["address", "notes"] as const) {
        if (old[field] !== bank[field]) {
          changes.changed.push({ name: k, field, from: old[field], to: bank[field] });
        }
      }
      const oldHours = JSON.stringify(old.hours);
      const newHours = JSON.stringify(bank.hours);
      if (oldHours !== newHours) {
        changes.changed.push({ name: k, field: "hours", from: oldHours, to: newHours });
      }
    }
  }

  for (const [k, bank] of prevMap) {
    if (!currMap.has(k)) changes.removed.push(bank);
  }

  return changes;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const current = await scrape();
  console.log(`\nFound ${current.length} food bank(s)\n`);
  current.forEach((b, i) => {
    console.log(`[${i + 1}] ${b.name || "(unnamed)"}`);
    if (b.address) console.log(`    Address: ${b.address}`);
    const hourLines = Object.entries(b.hours);
    if (hourLines.length) {
      console.log("    Hours:");
      hourLines.forEach(([day, time]) => console.log(`      ${day}: ${time}`));
    }
    if (b.notes) console.log(`    Notes:   ${b.notes}`);
  });

  if (existsSync(LATEST)) {
    const raw = readFileSync(LATEST, "utf8");
    writeFileSync(PREVIOUS, raw);

    const previous: FoodBank[] = JSON.parse(raw);
    const changes = diff(previous, current);
    const hasChanges =
      changes.added.length || changes.removed.length || changes.changed.length;

    if (hasChanges) {
      writeFileSync(CHANGES, JSON.stringify(changes, null, 2));
      console.log("\n=== CHANGES DETECTED ===");
      changes.added.forEach((b) => console.log(`  + Added:   ${b.name || b.address}`));
      changes.removed.forEach((b) =>
        console.log(`  - Removed: ${b.name || b.address}`)
      );
      changes.changed.forEach((c) =>
        console.log(
          `  ~ Changed: ${c.name} [${c.field}]\n      was: ${c.from}\n      now: ${c.to}`
        )
      );
      console.log(`\nFull diff saved to: ${CHANGES}`);
    } else {
      console.log("\nNo changes detected since last run.");
    }
  } else {
    console.log("First run — no previous snapshot to compare.");
  }

  writeFileSync(LATEST, JSON.stringify(current, null, 2));
  console.log(`Snapshot saved to: ${LATEST}`);
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
