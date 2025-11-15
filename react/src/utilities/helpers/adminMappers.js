// utils/adminMappers.js
const safe = (v, fallback = "—") => (v === null || v === undefined ? fallback : v);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");

// Count COMPLETED deliveries in driver_schedules
const countCompletedDeliveries = (driver) => {
  const arr = driver?.driver_schedules ?? [];
  return arr.filter((s) => String(s.status).toUpperCase() === "COMPLETED").length;
};

/**
 * role_id = 2 (Recycling Companies)
 * Preset: DEPARTMENTS.RC -> keys:
 *   recycling_company, branchCount, driver, planned, collected, location, _action
 */
export const mapRCUsers = (rows = []) =>
  rows.map((u) => {
    const driversCount = (u.drivers ?? []).length;
    // Planned (L): sum approx_oil_to_collect from oil_posts if numeric
    const plannedL = (u.oil_posts ?? []).reduce((sum, p) => {
      const n = Number(p.approx_oil_to_collect);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    return {
      key: u.id,
      recycling_company: safe(u.company?.name || u.name),
      branchCount: safe(u.company?.number_of_branches ?? 0),
      driver: driversCount,
      planned: plannedL,          // you can replace with real metric later
      collected: "—",             // no field in payload yet → placeholder
      location: "—",              // not provided → placeholder
      _action: "",
    };
  });

/**
 * role_id = 3 (Restaurants)
 * Preset: DEPARTMENTS.RESTAURANT -> keys:
 *   restaurant, branches, activeOrders, scheduled7d, onTimeRate, oilMTD, date, _action
 */
export const mapRestaurantUsers = (rows = []) =>
  rows.map((u) => ({
    key: u.id,
    restaurant: safe(u.restaurant?.name || u.name),
    branches: (u.branches ?? []).length,
    activeOrders: (u.oil_posts ?? []).length, // no status granularity beyond example → count
    scheduled7d: "—",                         // not in payload (future)
    onTimeRate: "—",                          // not in payload (future)
    oilMTD: "—",                              // not in payload (future)
    date: fmtDate(u.createdAt),
    _action: "",
  }));

/**
 * role_id = 4 (Branches under Restaurants)
 * Preset: DEPARTMENTS.BRANCH_UNDER_RESTAURANT -> keys:
 *   branch, manager, restaurant, planned, actual, location, date, _action
 */
export const mapBranchUsers = (rows = []) =>
  rows.map((u) => {
    const b = u.Branch;
    const loc = b?.location;
    return {
      key: u.id,
      branch: safe(b?.name),
      manager: safe(u.name),
      restaurant: safe(b?.restaurant?.name),
      planned: "—", // not provided → placeholder
      actual: "—",  // not provided → placeholder
      location: loc
        ? `${safe(loc.nearby, "")}${loc.lat ? ` • ${loc.lat}` : ""}${loc.long ? `, ${loc.long}` : ""}`
        : "—",
      date: fmtDate(b?.createdAt || u.createdAt),
      _action: "",
    };
  });

/**
 * role_id = 6 (Testers)
 * Preset: DEPARTMENTS.TESTER -> keys:
 *   testId, sampleFrom, collector, tpm, ffa, result, tat, _action
 *
 * API gives user-level info + tests: [] (empty for now)
 * We'll create one row per user (no tests), placeholders for lab fields.
 */
export const mapTesterUsers = (rows = []) =>
  rows.map((u) => ({
    key: u.id,
    testId: "—",
    sampleFrom: "—",
    collector: "—",
    tpm: "—",
    ffa: "—",
    result: "—",
    tat: "—",
    _action: "",
  }));

/**
 * role_id = 1 (Drivers)
 * Preset: DEPARTMENTS.DRIVERS -> keys:
 *   driver, company, deliveries, planned, actual, "on-time-rate", date, _action
 */
export const mapDriverUsers = (rows = []) =>
  rows.map((u) => ({
    key: u.id,
    driver: safe(u.name),
    company: safe(u.company?.name),
    deliveries: countCompletedDeliveries(u),
    planned: "—",           // not in payload
    actual: "—",            // not in payload
    "on-time-rate": "—",    // not in payload
    date: fmtDate(u.createdAt),
    _action: "",
  }));
