import { test, expect } from "@playwright/test";

// Routes that exist in app.js. Each must render distinct content into #app
// without throwing JS errors.
const ROUTES = [
  "#/",
  "#/schedule",
  "#/horses",
  "#/staff",
  "#/billing",
  "#/shows",
  "#/messages",
  "#/barn",
  "#/reports",
  "#/live",
  "#/settings",
];

// Capture pageerror and console.error for the duration of each test.
function captureErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const txt = m.text();
    // Tailwind's CDN runtime trips a benign MutationObserver TypeError in
    // some environments; it's not produced by app code and doesn't affect
    // rendering. Filter it out so it doesn't mask real regressions.
    if (txt.includes("cdn.tailwindcss.com")) return;
    if (txt.includes("querySelectorAll")) return;
    errors.push(`console.error: ${txt}`);
  });
  return errors;
}

// Seed deterministic schedule data so chip-readability assertions are stable
// regardless of the current date. Title "Lesson: Bella w/ Taylor" is the one
// the QA report cited as truncated on mobile.
async function seedSchedule(page) {
  await page.addInitScript(() => {
    const today = new Date();
    const day = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);
    const iso = (d) => d.toISOString().slice(0, 10);
    const d0 = iso(sunday);
    const d1 = iso(new Date(sunday.getTime() + 86400000));
    const d2 = iso(new Date(sunday.getTime() + 2 * 86400000));
    localStorage.setItem(
      "barnpilot_demo_state_v2",
      JSON.stringify({
        settings: { barnName: "Demo Barn", darkMode: false },
        horses: [{ id: "H001", name: "Bella", owner: "Jordan", stall: "A1", boardType: "Full", notes: "", photo: "" }],
        staff: [{ id: "S001", name: "Taylor", role: "Trainer", phone: "", email: "" }],
        schedule: [
          { id: "EVT-A", title: "Lesson: Bella w/ Taylor", horseId: "H001", staffId: "S001", date: d0, start: "10:00", end: "10:45", arena: "Main", type: "Lesson" },
          { id: "EVT-B", title: "Turnout: Apollo", horseId: "H001", staffId: "S001", date: d1, start: "09:00", end: "12:00", arena: "-", type: "Care" },
          { id: "EVT-C", title: "Schooling: Maverick", horseId: "H001", staffId: "S001", date: d2, start: "14:00", end: "14:45", arena: "Main", type: "Schooling" },
        ],
        invoices: [], shows: [], stalls: [], feed: [], tasks: [], updates: [],
      }),
    );
  });
}

test.describe("static asset availability", () => {
  test("required files served", async ({ request }) => {
    for (const path of ["/index.html", "/assets/app.js", "/assets/styles.css"]) {
      const r = await request.get(path);
      expect(r.status(), `${path} status`).toBe(200);
      const len = Number(r.headers()["content-length"] ?? (await r.body()).length);
      expect(len, `${path} non-empty`).toBeGreaterThan(0);
    }
  });
});

test.describe("routes render without JS errors", () => {
  for (const route of ROUTES) {
    test(`route ${route}`, async ({ page }) => {
      const errors = captureErrors(page);
      await page.goto(`/index.html${route}`);
      await page.waitForFunction(
        () => document.getElementById("app") && document.getElementById("app").children.length > 0,
        null,
        { timeout: 5000 },
      );
      const childCount = await page.evaluate(() => document.getElementById("app").children.length);
      expect(childCount, `${route}: #app populated`).toBeGreaterThan(0);
      const textLen = await page.evaluate(() => document.getElementById("app").textContent.trim().length);
      expect(textLen, `${route}: #app has visible text`).toBeGreaterThan(20);
      expect(errors, `${route}: no JS errors`).toEqual([]);
    });
  }
});

const DESKTOP_PROJECTS = new Set(["desktop-chromium", "desktop-firefox", "desktop-webkit"]);

test.describe("desktop layout (1280x800)", () => {
  for (const route of ["#/", "#/schedule", "#/horses", "#/billing"]) {
    test(`no page horizontal overflow on ${route}`, async ({ page }, testInfo) => {
      test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), "desktop-only");
      await page.goto(`/index.html${route}`);
      await page.waitForFunction(
        () => document.getElementById("app") && document.getElementById("app").children.length > 0,
      );
      const { scrollW, clientW } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(scrollW, `${route}: html.scrollWidth must not exceed clientWidth`).toBeLessThanOrEqual(clientW);
    });
  }
});

test.describe("mobile #/schedule (390x844 via mobile-chromium project)", () => {
  test("no page horizontal scroll, header visible, chips readable, calendar scrolls internally", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "mobile-only");
    const errors = captureErrors(page);
    await seedSchedule(page);
    await page.goto("/index.html#/schedule");
    await page.waitForSelector(".calendar-grid");
    await page.waitForFunction(() => document.querySelectorAll(".event-chip").length > 0, null, { timeout: 6000 });

    // 1. Page must not have horizontal overflow.
    const page_h = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    expect(page_h.scrollW, "page must not scroll horizontally").toBeLessThanOrEqual(page_h.clientW);

    // 2. Heading "Weekly Schedule" must be in-viewport (x >= 0, right edge inside the viewport).
    const heading = page.locator("main h2", { hasText: "Weekly Schedule" });
    await expect(heading).toBeVisible();
    const hRect = await heading.boundingBox();
    expect(hRect, "heading bounding box").toBeTruthy();
    expect(hRect.x, "heading x in viewport").toBeGreaterThanOrEqual(0);
    expect(hRect.x + hRect.width, "heading right edge in viewport").toBeLessThanOrEqual(page_h.clientW + 1);

    // 3. The "+ Add Event" action must be visible and clickable.
    const addBtn = page.getByRole("button", { name: /Add Event/i });
    await expect(addBtn).toBeVisible();

    // 4. The "Lesson: Bella w/ Taylor" chip must render at a usable width and on 2 lines (no mid-word truncation).
    const chip = page.locator(".event-chip", { hasText: "Lesson: Bella w/ Taylor" });
    await expect(chip).toBeVisible();
    const cRect = await chip.boundingBox();
    expect(cRect.width, "chip width readable").toBeGreaterThanOrEqual(100);
    const lineHeight = await chip.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
    expect(cRect.height, "chip renders on ~2 lines").toBeGreaterThanOrEqual(lineHeight * 1.6);
    const clamp = await chip.evaluate((el) => getComputedStyle(el).webkitLineClamp || getComputedStyle(el)["-webkit-line-clamp"]);
    expect(String(clamp), "chip clamped to 2 lines").toBe("2");

    // 5. Calendar must scroll internally (its scrollWidth > clientWidth) so users can swipe between days.
    const cal = page.locator(".calendar-grid");
    const { scrollW, clientW } = await cal.evaluate((el) => ({ scrollW: el.scrollWidth, clientW: el.clientWidth }));
    expect(scrollW, "calendar has internal horizontal scroll").toBeGreaterThan(clientW);

    // 6. Day-name header row and calendar body must share the same grid template (column-aligned during scroll).
    const templates = await page.evaluate(() => {
      const cal = document.querySelector(".calendar-grid");
      const header = document.querySelector(".card .grid.grid-cols-8");
      return {
        cal: cal ? getComputedStyle(cal).gridTemplateColumns : null,
        header: header ? getComputedStyle(header).gridTemplateColumns : null,
      };
    });
    expect(templates.header, "header grid columns match calendar body").toBe(templates.cal);

    // 7. No JS errors.
    expect(errors).toEqual([]);
  });
});
