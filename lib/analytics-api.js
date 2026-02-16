const crypto = require("crypto");

const TRACKED_EVENT_NAMES = new Set([
  "view_case_study",
  "scroll_depth",
  "click_resume_download",
  "click_contact",
  "submit_contact_form",
  "outbound_click",
  "copy_email"
]);

const CONVERSION_EVENT_NAMES = new Set([
  "click_resume_download",
  "click_contact",
  "submit_contact_form"
]);

const cacheStore = new Map();

const BASE_EVENT_SELECT = {
  id: true,
  eventName: true,
  eventTime: true,
  userId: true,
  sessionId: true,
  pagePath: true,
  pageTitle: true,
  referrerDomain: true,
  sessionSource: true,
  sessionMedium: true,
  sessionCampaign: true,
  firstTouchSource: true,
  firstTouchMedium: true,
  firstTouchCampaign: true,
  slug: true,
  caseStudyTitle: true,
  percent: true,
  location: true,
  method: true,
  destinationDomain: true,
  linkText: true,
  success: true,
  deviceType: true,
  countryCode: true
};

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date, dayOffset) {
  return new Date(date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

function toInt(value, defaultValue) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function sanitizeText(value, maxLength = 160) {
  const compact = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!compact) return "";
  return compact.slice(0, maxLength);
}

function sanitizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function sanitizePath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw, "http://localhost");
    const clean = (url.pathname || "/").replace(/\/+$/, "") || "/";
    return clean.slice(0, 255);
  } catch (error) {
    const clean = raw.split("?")[0].split("#")[0] || "/";
    const normalized = clean.startsWith("/") ? clean : `/${clean}`;
    return (normalized.replace(/\/+$/, "") || "/").slice(0, 255);
  }
}

function sanitizeCountry(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}

function sanitizeDevice(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["desktop", "mobile", "tablet"].includes(normalized)) {
    return normalized;
  }

  return "";
}

function sanitizeListValue(value, key) {
  if (!value) return "";

  if (key === "page_path") {
    return sanitizePath(value);
  }

  if (key === "case_study_slug") {
    return sanitizeSlug(value);
  }

  if (key === "country") {
    return sanitizeCountry(value);
  }

  if (key === "device") {
    return sanitizeDevice(value);
  }

  return sanitizeText(value, 120).toLowerCase();
}

function parseQueryList(input, key) {
  if (Array.isArray(input)) {
    const output = [];
    for (const item of input) {
      output.push(...parseQueryList(item, key));
    }
    return output;
  }

  const value = String(input || "").trim();
  if (!value) return [];

  const cleaned = value
    .split(",")
    .map((part) => sanitizeListValue(part, key))
    .filter(Boolean);

  return Array.from(new Set(cleaned));
}

function normalizeDimension(dimension) {
  const raw = String(dimension || "sourceMedium").trim();
  if (raw === "campaign") return "campaign";
  return "sourceMedium";
}

function normalizeFunnelName(funnel) {
  const raw = String(funnel || "home_to_contact").trim().toLowerCase();
  if (raw === "case_to_resume") return "case_to_resume";
  return "home_to_contact";
}

function buildDateRange(query, fallbackDays = 30) {
  const today = startOfUtcDay(new Date());
  const defaultEnd = today;
  const defaultStart = addDays(today, -(fallbackDays - 1));

  const requestedStart = parseDateInput(query?.from || query?.start);
  const requestedEnd = parseDateInput(query?.to || query?.end);

  let start = requestedStart || defaultStart;
  let end = requestedEnd || defaultEnd;

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  const maxWindowDays = 365;
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  if (totalDays > maxWindowDays) {
    start = addDays(end, -(maxWindowDays - 1));
  }

  const startAt = startOfUtcDay(start);
  const endAt = addDays(startOfUtcDay(end), 1);
  const days = Math.max(1, Math.floor((endAt.getTime() - startAt.getTime()) / 86400000));

  const previousEndAt = startAt;
  const previousStartAt = addDays(previousEndAt, -days);

  return {
    startAt,
    endAt,
    previousStartAt,
    previousEndAt,
    from: formatDate(startAt),
    to: formatDate(addDays(endAt, -1)),
    previousFrom: formatDate(previousStartAt),
    previousTo: formatDate(addDays(previousEndAt, -1)),
    days
  };
}

function extractFilters(query = {}) {
  return {
    device: parseQueryList(query.device, "device"),
    country: parseQueryList(query.country, "country"),
    referrer: parseQueryList(query.referrer, "referrer"),
    source: parseQueryList(query.source, "source"),
    medium: parseQueryList(query.medium, "medium"),
    campaign: parseQueryList(query.campaign, "campaign"),
    pagePath: parseQueryList(query.page_path, "page_path"),
    caseStudySlug: parseQueryList(query.case_study_slug, "case_study_slug"),
    search: sanitizeText(query.q, 120).toLowerCase()
  };
}

function buildWhereClause(range, filters) {
  const where = {
    eventTime: {
      gte: range.startAt,
      lt: range.endAt
    }
  };

  if (filters.device.length > 0) {
    where.deviceType = { in: filters.device };
  }

  if (filters.country.length > 0) {
    where.countryCode = { in: filters.country };
  }

  if (filters.referrer.length > 0) {
    where.referrerDomain = { in: filters.referrer };
  }

  if (filters.source.length > 0) {
    where.sessionSource = { in: filters.source };
  }

  if (filters.medium.length > 0) {
    where.sessionMedium = { in: filters.medium };
  }

  if (filters.campaign.length > 0) {
    where.sessionCampaign = { in: filters.campaign };
  }

  if (filters.pagePath.length > 0) {
    where.pagePath = { in: filters.pagePath };
  }

  if (filters.caseStudySlug.length > 0) {
    where.slug = { in: filters.caseStudySlug };
  }

  if (filters.search) {
    where.OR = [
      { pagePath: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
      { caseStudyTitle: { contains: filters.search, mode: "insensitive" } }
    ];
  }

  return where;
}

function cacheKey(prefix, payload) {
  const hash = crypto
    .createHash("sha256")
    .update(`${prefix}:${JSON.stringify(payload)}`)
    .digest("hex");
  return `${prefix}:${hash}`;
}

function cloneCachedValue(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

async function withCache(key, ttlMs, factory) {
  const now = Date.now();
  const existing = cacheStore.get(key);

  if (existing && existing.expiresAt > now) {
    return cloneCachedValue(existing.value);
  }

  const computed = await factory();
  cacheStore.set(key, {
    expiresAt: now + ttlMs,
    value: computed
  });

  return cloneCachedValue(computed);
}

function invalidateAnalyticsCache() {
  cacheStore.clear();
}

async function fetchEvents(prisma, range, filters, options = {}) {
  const order = options.order === "desc" ? "desc" : "asc";
  const limit = Number.isFinite(options.limit) ? options.limit : undefined;

  return prisma.event.findMany({
    where: buildWhereClause(range, filters),
    orderBy: {
      eventTime: order
    },
    take: limit,
    select: BASE_EVENT_SELECT
  });
}

function toSessionMap(events) {
  const map = new Map();

  for (const event of events) {
    const sessionId = sanitizeText(event.sessionId, 128) || "unknown_session";
    if (!map.has(sessionId)) {
      map.set(sessionId, []);
    }
    map.get(sessionId).push(event);
  }

  for (const sessionEvents of map.values()) {
    sessionEvents.sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());
  }

  return map;
}

function buildSummary(events) {
  const users = new Set();
  const pageviews = new Set();
  const sessionMap = toSessionMap(events);

  let conversions = 0;

  for (const event of events) {
    if (event.userId) users.add(event.userId);
    const pagePath = sanitizePath(event.pagePath);
    if (pagePath && event.sessionId) {
      pageviews.add(`${event.sessionId}::${pagePath}`);
    }

    if (CONVERSION_EVENT_NAMES.has(event.eventName)) {
      conversions += 1;
    }
  }

  let engagedSessions = 0;
  let engagementSecondsTotal = 0;

  for (const sessionEvents of sessionMap.values()) {
    if (sessionEvents.length === 0) continue;

    const first = sessionEvents[0];
    const last = sessionEvents[sessionEvents.length - 1];
    const durationSeconds = Math.max(
      0,
      Math.round((last.eventTime.getTime() - first.eventTime.getTime()) / 1000)
    );
    const boundedDuration = Math.min(durationSeconds, 1800);

    const hasDeepScroll = sessionEvents.some(
      (event) => event.eventName === "scroll_depth" && Number(event.percent || 0) >= 50
    );
    const hasConversion = sessionEvents.some((event) =>
      CONVERSION_EVENT_NAMES.has(event.eventName)
    );

    const engaged = sessionEvents.length >= 2 || hasDeepScroll || hasConversion;
    if (engaged) {
      engagedSessions += 1;
    }

    engagementSecondsTotal += boundedDuration;
  }

  const sessions = sessionMap.size;
  const engagementRate = sessions > 0 ? (engagedSessions / sessions) * 100 : 0;
  const avgEngagementTime = sessions > 0 ? engagementSecondsTotal / sessions : 0;

  return {
    users: users.size,
    sessions,
    pageviews: pageviews.size,
    engagementRate,
    avgEngagementTime,
    conversions,
    sessionMap
  };
}

function compareMetric(current, previous) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  let deltaPercent = 0;
  if (previousValue > 0) {
    deltaPercent = ((currentValue - previousValue) / previousValue) * 100;
  } else if (currentValue > 0) {
    deltaPercent = 100;
  }

  return {
    current: currentValue,
    previous: previousValue,
    deltaPercent
  };
}

function toDayKey(value) {
  return formatDate(startOfUtcDay(value));
}

function buildDailyTrend(events, range) {
  const trendMap = new Map();

  for (let i = 0; i < range.days; i += 1) {
    const day = addDays(range.startAt, i);
    const dayKey = formatDate(day);
    trendMap.set(dayKey, {
      date: dayKey,
      usersSet: new Set(),
      sessionsSet: new Set(),
      pageviewsSet: new Set(),
      conversions: 0,
      events: 0
    });
  }

  for (const event of events) {
    const dayKey = toDayKey(event.eventTime);
    if (!trendMap.has(dayKey)) continue;

    const day = trendMap.get(dayKey);
    day.events += 1;

    if (event.userId) day.usersSet.add(event.userId);
    if (event.sessionId) day.sessionsSet.add(event.sessionId);

    const pagePath = sanitizePath(event.pagePath);
    if (pagePath && event.sessionId) {
      day.pageviewsSet.add(`${event.sessionId}::${pagePath}`);
    }

    if (CONVERSION_EVENT_NAMES.has(event.eventName)) {
      day.conversions += 1;
    }
  }

  return Array.from(trendMap.values())
    .map((row) => ({
      date: row.date,
      users: row.usersSet.size,
      sessions: row.sessionsSet.size,
      pageviews: row.pageviewsSet.size,
      conversions: row.conversions,
      events: row.events
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function buildTopSources(events, limit = 8) {
  const sessionMap = toSessionMap(events);
  const dimensionMap = new Map();

  for (const sessionEvents of sessionMap.values()) {
    if (sessionEvents.length === 0) continue;
    const first = sessionEvents[0];

    const source = sanitizeText(first.sessionSource, 64) || "(direct)";
    const medium = sanitizeText(first.sessionMedium, 64) || "(none)";
    const key = `${source} / ${medium}`;

    if (!dimensionMap.has(key)) {
      dimensionMap.set(key, {
        source,
        medium,
        sessions: 0
      });
    }

    dimensionMap.get(key).sessions += 1;
  }

  return Array.from(dimensionMap.values())
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

function inferSlugFromPath(pagePath) {
  const clean = sanitizePath(pagePath);
  const match = clean.match(/^\/case-studies\/([^/]+)$/i);
  if (!match) return "";
  return sanitizeSlug(match[1]);
}

function buildTopCaseStudies(events, limit = 8) {
  const map = new Map();

  function ensure(slug, title = "") {
    if (!slug) return null;
    if (!map.has(slug)) {
      map.set(slug, {
        slug,
        title: title || slug,
        viewSessions: new Set(),
        deepScrollSessions: new Set(),
        resumeClicks: 0,
        contactClicks: 0
      });
    }

    if (title && !map.get(slug).title) {
      map.get(slug).title = title;
    }

    return map.get(slug);
  }

  for (const event of events) {
    const slug = sanitizeSlug(event.slug) || inferSlugFromPath(event.pagePath);
    const title = sanitizeText(event.caseStudyTitle, 200);
    const row = ensure(slug, title);
    if (!row) continue;

    if (
      event.eventName === "view_case_study" ||
      sanitizePath(event.pagePath).startsWith("/case-studies/")
    ) {
      row.viewSessions.add(event.sessionId);
    }

    if (event.eventName === "scroll_depth" && Number(event.percent || 0) >= 75) {
      row.deepScrollSessions.add(event.sessionId);
    }

    if (event.eventName === "click_resume_download") {
      row.resumeClicks += 1;
    }

    if (event.eventName === "click_contact") {
      row.contactClicks += 1;
    }
  }

  return Array.from(map.values())
    .map((row) => {
      const views = row.viewSessions.size;
      const deep = row.deepScrollSessions.size;
      const deepScrollRate = views > 0 ? (deep / views) * 100 : 0;
      const intentScore = deep * 2 + row.resumeClicks + row.contactClicks;

      return {
        slug: row.slug,
        title: row.title,
        views,
        deepScrollSessions: deep,
        deepScrollRate,
        resumeClicks: row.resumeClicks,
        contactClicks: row.contactClicks,
        intentScore
      };
    })
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, limit);
}

async function getOverviewReport(prisma, query = {}) {
  const range = buildDateRange(query, 30);
  const compare = toBoolean(query.compare, false);
  const filters = extractFilters(query);

  const key = cacheKey("overview", { range, compare, filters });
  return withCache(key, 60 * 1000, async () => {
    const currentEvents = await fetchEvents(prisma, range, filters, { order: "asc" });

    const previousEvents = compare
      ? await fetchEvents(
          prisma,
          {
            startAt: range.previousStartAt,
            endAt: range.previousEndAt,
            days: range.days
          },
          filters,
          { order: "asc" }
        )
      : [];

    const currentSummary = buildSummary(currentEvents);
    const previousSummary = compare ? buildSummary(previousEvents) : buildSummary([]);

    return {
      range,
      compare,
      filters,
      kpis: {
        users: compareMetric(currentSummary.users, previousSummary.users),
        sessions: compareMetric(currentSummary.sessions, previousSummary.sessions),
        pageviews: compareMetric(currentSummary.pageviews, previousSummary.pageviews),
        engagementRate: compareMetric(
          currentSummary.engagementRate,
          previousSummary.engagementRate
        ),
        avgEngagementTime: compareMetric(
          currentSummary.avgEngagementTime,
          previousSummary.avgEngagementTime
        ),
        conversions: compareMetric(currentSummary.conversions, previousSummary.conversions)
      },
      trend: buildDailyTrend(currentEvents, range),
      topSources: buildTopSources(currentEvents),
      topCaseStudies: buildTopCaseStudies(currentEvents)
    };
  });
}

async function getRealtimeReport(prisma, query = {}) {
  const minutes = Math.min(120, Math.max(5, toInt(query.minutes, 30)));
  const range = {
    startAt: new Date(Date.now() - minutes * 60 * 1000),
    endAt: new Date(),
    days: 1
  };
  const filters = extractFilters(query);

  const key = cacheKey("realtime", { minutes, filters });
  return withCache(key, 5 * 1000, async () => {
    const events = await fetchEvents(prisma, range, filters, {
      order: "desc",
      limit: 500
    });

    const activeUsers = new Set();
    const topPagesMap = new Map();

    for (const event of events) {
      if (event.userId) activeUsers.add(event.userId);
      const page = sanitizePath(event.pagePath);
      if (page) {
        topPagesMap.set(page, (topPagesMap.get(page) || 0) + 1);
      }
    }

    const topPages = Array.from(topPagesMap.entries())
      .map(([pagePath, eventsCount]) => ({ pagePath, events: eventsCount }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);

    const liveFeed = events.slice(0, 100).map((event) => ({
      id: String(event.id),
      at: event.eventTime,
      eventName: event.eventName,
      pagePath: sanitizePath(event.pagePath) || "(unknown)",
      slug: sanitizeSlug(event.slug),
      location: sanitizeText(event.location, 64),
      method: sanitizeText(event.method, 32)
    }));

    return {
      minutes,
      activeUsers: activeUsers.size,
      topPages,
      liveFeed
    };
  });
}

function buildAcquisitionRows(events, useFirstTouch = false) {
  const sessionMap = toSessionMap(events);

  const sourceMediumMap = new Map();
  const campaignMap = new Map();

  for (const sessionEvents of sessionMap.values()) {
    if (sessionEvents.length === 0) continue;

    const first = sessionEvents[0];

    const source = useFirstTouch
      ? sanitizeText(first.firstTouchSource, 64) || sanitizeText(first.sessionSource, 64)
      : sanitizeText(first.sessionSource, 64);
    const medium = useFirstTouch
      ? sanitizeText(first.firstTouchMedium, 64) || sanitizeText(first.sessionMedium, 64)
      : sanitizeText(first.sessionMedium, 64);
    const campaign = useFirstTouch
      ? sanitizeText(first.firstTouchCampaign, 120) || sanitizeText(first.sessionCampaign, 120)
      : sanitizeText(first.sessionCampaign, 120);

    const normalizedSource = source || "(direct)";
    const normalizedMedium = medium || "(none)";
    const normalizedCampaign = campaign || "(not set)";

    const sourceKey = `${normalizedSource} / ${normalizedMedium}`;
    if (!sourceMediumMap.has(sourceKey)) {
      sourceMediumMap.set(sourceKey, {
        key: sourceKey,
        source: normalizedSource,
        medium: normalizedMedium,
        sessions: 0,
        users: new Set(),
        conversions: 0
      });
    }

    const sourceRow = sourceMediumMap.get(sourceKey);
    sourceRow.sessions += 1;

    if (first.userId) sourceRow.users.add(first.userId);
    if (sessionEvents.some((event) => CONVERSION_EVENT_NAMES.has(event.eventName))) {
      sourceRow.conversions += 1;
    }

    if (!campaignMap.has(normalizedCampaign)) {
      campaignMap.set(normalizedCampaign, {
        key: normalizedCampaign,
        campaign: normalizedCampaign,
        sessions: 0,
        users: new Set(),
        conversions: 0
      });
    }

    const campaignRow = campaignMap.get(normalizedCampaign);
    campaignRow.sessions += 1;
    if (first.userId) campaignRow.users.add(first.userId);
    if (sessionEvents.some((event) => CONVERSION_EVENT_NAMES.has(event.eventName))) {
      campaignRow.conversions += 1;
    }
  }

  const toRows = (map) =>
    Array.from(map.values())
      .map((row) => ({
        ...row,
        users: row.users.size,
        conversionRate: row.sessions > 0 ? (row.conversions / row.sessions) * 100 : 0
      }))
      .sort((a, b) => b.sessions - a.sessions);

  return {
    sourceMedium: toRows(sourceMediumMap),
    campaign: toRows(campaignMap)
  };
}

function buildAcquisitionDrilldowns(events) {
  const pageMap = new Map();
  const caseMap = new Map();

  for (const event of events) {
    const pagePath = sanitizePath(event.pagePath);
    if (pagePath) {
      const pageKey = pagePath;
      if (!pageMap.has(pageKey)) {
        pageMap.set(pageKey, {
          pagePath,
          events: 0,
          sessions: new Set()
        });
      }

      const pageRow = pageMap.get(pageKey);
      pageRow.events += 1;
      if (event.sessionId) pageRow.sessions.add(event.sessionId);
    }

    const slug = sanitizeSlug(event.slug) || inferSlugFromPath(pagePath);
    if (slug) {
      if (!caseMap.has(slug)) {
        caseMap.set(slug, {
          slug,
          title: sanitizeText(event.caseStudyTitle, 200) || slug,
          sessions: new Set(),
          conversions: 0
        });
      }

      const caseRow = caseMap.get(slug);
      if (event.sessionId) caseRow.sessions.add(event.sessionId);
      if (CONVERSION_EVENT_NAMES.has(event.eventName)) {
        caseRow.conversions += 1;
      }
    }
  }

  return {
    topPages: Array.from(pageMap.values())
      .map((row) => ({
        pagePath: row.pagePath,
        events: row.events,
        sessions: row.sessions.size
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 20),
    topCaseStudies: Array.from(caseMap.values())
      .map((row) => ({
        slug: row.slug,
        title: row.title,
        sessions: row.sessions.size,
        conversions: row.conversions
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20)
  };
}

async function getAcquisitionReport(prisma, query = {}) {
  const range = buildDateRange(query, 30);
  const filters = extractFilters(query);
  const dimension = normalizeDimension(query.dimension);

  const key = cacheKey("acquisition", { range, filters, dimension });
  return withCache(key, 60 * 1000, async () => {
    const events = await fetchEvents(prisma, range, filters, { order: "asc" });

    const sessionBased = buildAcquisitionRows(events, false);
    const firstTouch = buildAcquisitionRows(events, true);
    const drilldown = buildAcquisitionDrilldowns(events);

    return {
      range,
      filters,
      dimension,
      sessionBased,
      firstTouch,
      drilldown
    };
  });
}

function buildPageMetrics(events) {
  const sessionMap = toSessionMap(events);
  const pageVisits = new Set();
  const pageTimeMap = new Map();
  const pageExitMap = new Map();
  const pageScrollMap = new Map();

  for (const sessionEvents of sessionMap.values()) {
    let lastPageInSession = "";

    for (let i = 0; i < sessionEvents.length; i += 1) {
      const event = sessionEvents[i];
      const pagePath = sanitizePath(event.pagePath);
      if (!pagePath) continue;

      lastPageInSession = pagePath;
      pageVisits.add(`${event.sessionId}::${pagePath}`);

      if (event.eventName === "scroll_depth" && Number(event.percent || 0) >= 75) {
        if (!pageScrollMap.has(pagePath)) {
          pageScrollMap.set(pagePath, new Set());
        }
        pageScrollMap.get(pagePath).add(event.sessionId);
      }

      const next = sessionEvents[i + 1];
      if (!next) continue;

      const diffSeconds = Math.max(
        0,
        Math.round((next.eventTime.getTime() - event.eventTime.getTime()) / 1000)
      );
      const bounded = Math.min(diffSeconds, 1800);

      pageTimeMap.set(pagePath, (pageTimeMap.get(pagePath) || 0) + bounded);
    }

    if (lastPageInSession) {
      pageExitMap.set(lastPageInSession, (pageExitMap.get(lastPageInSession) || 0) + 1);
    }
  }

  const pageSessionMap = new Map();
  for (const pair of pageVisits) {
    const [sessionId, pagePath] = pair.split("::");
    if (!pageSessionMap.has(pagePath)) {
      pageSessionMap.set(pagePath, new Set());
    }
    pageSessionMap.get(pagePath).add(sessionId);
  }

  return Array.from(pageSessionMap.entries())
    .map(([pagePath, sessions]) => {
      const views = sessions.size;
      const totalTime = pageTimeMap.get(pagePath) || 0;
      const exits = pageExitMap.get(pagePath) || 0;
      const deepScrollSessions = (pageScrollMap.get(pagePath) || new Set()).size;

      return {
        pagePath,
        views,
        avgEngagementTime: views > 0 ? totalTime / views : 0,
        exits,
        exitRate: views > 0 ? (exits / views) * 100 : 0,
        scrollCompletionRate: views > 0 ? (deepScrollSessions / views) * 100 : 0
      };
    })
    .sort((a, b) => b.views - a.views);
}

function buildCaseStudyMetrics(events) {
  const map = new Map();

  function ensure(slug, title = "") {
    if (!slug) return null;
    if (!map.has(slug)) {
      map.set(slug, {
        slug,
        title: title || slug,
        viewSessions: new Set(),
        deepScrollSessions: new Set(),
        resumeClicks: 0,
        contactClicks: 0
      });
    }

    return map.get(slug);
  }

  for (const event of events) {
    const pagePath = sanitizePath(event.pagePath);
    const slug = sanitizeSlug(event.slug) || inferSlugFromPath(pagePath);
    if (!slug) continue;

    const row = ensure(slug, sanitizeText(event.caseStudyTitle, 200));
    if (!row) continue;

    if (
      event.eventName === "view_case_study" ||
      pagePath.startsWith("/case-studies/")
    ) {
      row.viewSessions.add(event.sessionId);
    }

    if (event.eventName === "scroll_depth" && Number(event.percent || 0) >= 75) {
      row.deepScrollSessions.add(event.sessionId);
    }

    if (event.eventName === "click_resume_download") {
      row.resumeClicks += 1;
    }

    if (event.eventName === "click_contact") {
      row.contactClicks += 1;
    }
  }

  return Array.from(map.values())
    .map((row) => {
      const views = row.viewSessions.size;
      const deep = row.deepScrollSessions.size;
      return {
        slug: row.slug,
        title: row.title || row.slug,
        views,
        deepScrollSessions: deep,
        deepScrollRate: views > 0 ? (deep / views) * 100 : 0,
        resumeClicks: row.resumeClicks,
        contactClicks: row.contactClicks
      };
    })
    .sort((a, b) => b.deepScrollRate - a.deepScrollRate);
}

async function getEngagementPagesReport(prisma, query = {}) {
  const range = buildDateRange(query, 30);
  const filters = extractFilters(query);

  const key = cacheKey("engagement_pages", { range, filters });
  return withCache(key, 60 * 1000, async () => {
    const events = await fetchEvents(prisma, range, filters, { order: "asc" });

    const rows = buildPageMetrics(events);

    return {
      range,
      filters,
      rows,
      trend: buildDailyTrend(events, range)
    };
  });
}

async function getEngagementCaseStudiesReport(prisma, query = {}) {
  const range = buildDateRange(query, 30);
  const filters = extractFilters(query);

  const key = cacheKey("engagement_case", { range, filters });
  return withCache(key, 60 * 1000, async () => {
    const events = await fetchEvents(prisma, range, filters, { order: "asc" });

    const rows = buildCaseStudyMetrics(events);

    return {
      range,
      filters,
      rows,
      trend: buildDailyTrend(events, range)
    };
  });
}

function buildEventCounts(events) {
  const map = new Map();

  for (const event of events) {
    if (!map.has(event.eventName)) {
      map.set(event.eventName, {
        eventName: event.eventName,
        count: 0,
        users: new Set()
      });
    }

    const row = map.get(event.eventName);
    row.count += 1;
    if (event.userId) row.users.add(event.userId);
  }

  return Array.from(map.values())
    .map((row) => ({
      eventName: row.eventName,
      count: row.count,
      uniqueUsers: row.users.size
    }))
    .sort((a, b) => b.count - a.count);
}

function buildParameterBreakdown(events, type) {
  const map = new Map();

  function bump(parameter, value) {
    const key = `${parameter}::${value}`;
    if (!map.has(key)) {
      map.set(key, {
        parameter,
        value,
        count: 0
      });
    }

    map.get(key).count += 1;
  }

  for (const event of events) {
    if (event.eventName !== type) continue;

    if (type === "view_case_study") {
      bump("slug", sanitizeSlug(event.slug) || "(unknown)");
      continue;
    }

    if (type === "scroll_depth") {
      const bucket = Number(event.percent || 0);
      bump("percent", String(bucket));
      continue;
    }

    if (type === "click_resume_download") {
      bump("location", sanitizeText(event.location, 64) || "unknown");
      continue;
    }

    if (type === "click_contact") {
      bump("method", sanitizeText(event.method, 32) || "unknown");
      bump("location", sanitizeText(event.location, 64) || "unknown");
      continue;
    }

    if (type === "submit_contact_form") {
      bump("success", String(Boolean(event.success)));
      continue;
    }

    if (type === "outbound_click") {
      bump(
        "destination_domain",
        sanitizeText(event.destinationDomain, 120) || "unknown"
      );
      bump("link_text", sanitizeText(event.linkText, 120) || "(empty)");
      continue;
    }

    if (type === "copy_email") {
      bump("location", sanitizeText(event.location, 64) || "unknown");
      continue;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 30);
}

async function getEventsReport(prisma, query = {}) {
  const range = buildDateRange(query, 30);
  const filters = extractFilters(query);
  const requestedType = sanitizeText(query.type, 64).toLowerCase();
  const type = TRACKED_EVENT_NAMES.has(requestedType) ? requestedType : "";

  const key = cacheKey("events", { range, filters, type });
  return withCache(key, 60 * 1000, async () => {
    const baseEvents = await fetchEvents(prisma, range, filters, { order: "asc" });
    const scopedEvents = type
      ? baseEvents.filter((event) => event.eventName === type)
      : baseEvents;

    const trendRange = {
      startAt: range.startAt,
      endAt: range.endAt,
      days: range.days
    };

    return {
      range,
      filters,
      type: type || null,
      counts: buildEventCounts(baseEvents),
      trend: buildDailyTrend(scopedEvents, trendRange).map((row) => ({
        date: row.date,
        count: row.events
      })),
      detail: type
        ? {
            parameters: buildParameterBreakdown(baseEvents, type),
            recent: scopedEvents
              .slice(-100)
              .reverse()
              .map((event) => ({
                id: String(event.id),
                at: event.eventTime,
                pagePath: sanitizePath(event.pagePath) || "(unknown)",
                slug: sanitizeSlug(event.slug),
                location: sanitizeText(event.location, 64),
                method: sanitizeText(event.method, 32)
              }))
          }
        : null
    };
  });
}

function buildConversionCounts(events) {
  const counts = {
    click_resume_download: 0,
    click_contact: 0,
    submit_contact_form: 0
  };

  for (const event of events) {
    if (Object.hasOwn(counts, event.eventName)) {
      counts[event.eventName] += 1;
    }
  }

  return counts;
}

function buildConversionTrend(events, range) {
  const trendMap = new Map();

  for (let i = 0; i < range.days; i += 1) {
    const day = formatDate(addDays(range.startAt, i));
    trendMap.set(day, {
      date: day,
      click_resume_download: 0,
      click_contact: 0,
      submit_contact_form: 0
    });
  }

  for (const event of events) {
    const dayKey = toDayKey(event.eventTime);
    if (!trendMap.has(dayKey)) continue;
    if (!Object.hasOwn(trendMap.get(dayKey), event.eventName)) continue;
    trendMap.get(dayKey)[event.eventName] += 1;
  }

  return Array.from(trendMap.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

function buildFunnel(events, funnelName) {
  const bySession = toSessionMap(events);

  const funnel = normalizeFunnelName(funnelName);

  let step1 = 0;
  let step2 = 0;
  let step3 = 0;

  for (const sessionEvents of bySession.values()) {
    if (sessionEvents.length === 0) continue;

    if (funnel === "home_to_contact") {
      const homeIndex = sessionEvents.findIndex((event) => sanitizePath(event.pagePath) === "/");
      const caseIndex = sessionEvents.findIndex(
        (event) =>
          event.eventName === "view_case_study" ||
          sanitizePath(event.pagePath).startsWith("/case-studies/")
      );
      const contactIndex = sessionEvents.findIndex(
        (event) =>
          event.eventName === "click_contact" || event.eventName === "submit_contact_form"
      );

      if (homeIndex >= 0) {
        step1 += 1;
        if (caseIndex > homeIndex) {
          step2 += 1;
          if (contactIndex > caseIndex) {
            step3 += 1;
          }
        }
      }
    } else {
      const caseIndex = sessionEvents.findIndex(
        (event) =>
          event.eventName === "view_case_study" ||
          sanitizePath(event.pagePath).startsWith("/case-studies/")
      );
      const resumeIndex = sessionEvents.findIndex(
        (event) => event.eventName === "click_resume_download"
      );

      if (caseIndex >= 0) {
        step1 += 1;
        if (resumeIndex > caseIndex) {
          step2 += 1;
        }
      }
    }
  }

  if (funnel === "home_to_contact") {
    const stepRows = [
      { step: "Home", sessions: step1 },
      { step: "Case Study", sessions: step2 },
      { step: "Contact", sessions: step3 }
    ];

    for (let i = 0; i < stepRows.length; i += 1) {
      const current = stepRows[i];
      const previous = i === 0 ? null : stepRows[i - 1];
      current.dropOff = previous ? Math.max(0, previous.sessions - current.sessions) : 0;
      current.conversionRate = previous
        ? previous.sessions > 0
          ? (current.sessions / previous.sessions) * 100
          : 0
        : 100;
    }

    return {
      funnel,
      steps: stepRows,
      overallConversionRate: step1 > 0 ? (step3 / step1) * 100 : 0
    };
  }

  const stepRows = [
    { step: "Case Study", sessions: step1 },
    { step: "Resume Download", sessions: step2 }
  ];

  for (let i = 0; i < stepRows.length; i += 1) {
    const current = stepRows[i];
    const previous = i === 0 ? null : stepRows[i - 1];
    current.dropOff = previous ? Math.max(0, previous.sessions - current.sessions) : 0;
    current.conversionRate = previous
      ? previous.sessions > 0
        ? (current.sessions / previous.sessions) * 100
        : 0
      : 100;
  }

  return {
    funnel,
    steps: stepRows,
    overallConversionRate: step1 > 0 ? (step2 / step1) * 100 : 0
  };
}

async function getConversionsReport(prisma, query = {}) {
  const range = buildDateRange(query, 30);
  const compare = toBoolean(query.compare, false);
  const filters = extractFilters(query);

  const key = cacheKey("conversions", { range, compare, filters });
  return withCache(key, 60 * 1000, async () => {
    const currentEvents = await fetchEvents(prisma, range, filters, { order: "asc" });
    const previousEvents = compare
      ? await fetchEvents(
          prisma,
          {
            startAt: range.previousStartAt,
            endAt: range.previousEndAt,
            days: range.days
          },
          filters,
          { order: "asc" }
        )
      : [];

    const currentCounts = buildConversionCounts(currentEvents);
    const previousCounts = buildConversionCounts(previousEvents);

    return {
      range,
      compare,
      filters,
      counts: {
        click_resume_download: compareMetric(
          currentCounts.click_resume_download,
          previousCounts.click_resume_download
        ),
        click_contact: compareMetric(
          currentCounts.click_contact,
          previousCounts.click_contact
        ),
        submit_contact_form: compareMetric(
          currentCounts.submit_contact_form,
          previousCounts.submit_contact_form
        )
      },
      trend: buildConversionTrend(currentEvents, range)
    };
  });
}

async function getFunnelsReport(prisma, query = {}) {
  const range = buildDateRange(query, 30);
  const filters = extractFilters(query);
  const funnel = normalizeFunnelName(query.funnel);

  const key = cacheKey("funnels", { range, filters, funnel });
  return withCache(key, 60 * 1000, async () => {
    const events = await fetchEvents(prisma, range, filters, { order: "asc" });

    return {
      range,
      filters,
      ...buildFunnel(events, funnel)
    };
  });
}

function toCsv(rows, headers) {
  const escapeCell = (value) => {
    const raw = String(value ?? "");
    if (/[",\n]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const headerLine = headers.map((header) => escapeCell(header.label)).join(",");
  const lines = rows.map((row) =>
    headers.map((header) => escapeCell(row[header.key])).join(",")
  );

  return [headerLine, ...lines].join("\n");
}

async function getCsvExport(prisma, query = {}) {
  const report = sanitizeText(query.report, 48).toLowerCase() || "overview";

  if (report === "overview") {
    const data = await getOverviewReport(prisma, query);
    const rows = Object.entries(data.kpis).map(([metric, values]) => ({
      metric,
      current: values.current,
      previous: values.previous,
      delta_percent: values.deltaPercent.toFixed(2)
    }));

    return toCsv(rows, [
      { key: "metric", label: "Metric" },
      { key: "current", label: "Current" },
      { key: "previous", label: "Previous" },
      { key: "delta_percent", label: "Delta %" }
    ]);
  }

  if (report === "realtime") {
    const data = await getRealtimeReport(prisma, query);
    return toCsv(data.liveFeed, [
      { key: "at", label: "At" },
      { key: "eventName", label: "Event" },
      { key: "pagePath", label: "Page" },
      { key: "slug", label: "Slug" },
      { key: "location", label: "Location" }
    ]);
  }

  if (report === "acquisition") {
    const data = await getAcquisitionReport(prisma, query);
    const rows = data.sessionBased[data.dimension].map((row) => ({
      key: row.key,
      sessions: row.sessions,
      users: row.users,
      conversions: row.conversions,
      conversion_rate: row.conversionRate.toFixed(2)
    }));

    return toCsv(rows, [
      { key: "key", label: "Dimension" },
      { key: "sessions", label: "Sessions" },
      { key: "users", label: "Users" },
      { key: "conversions", label: "Conversions" },
      { key: "conversion_rate", label: "Conversion Rate (%)" }
    ]);
  }

  if (report === "engagement_pages" || report === "engagement" || report === "pages") {
    const data = await getEngagementPagesReport(prisma, query);
    return toCsv(data.rows, [
      { key: "pagePath", label: "Page Path" },
      { key: "views", label: "Views" },
      { key: "avgEngagementTime", label: "Avg Engagement Time (s)" },
      { key: "exitRate", label: "Exit Rate (%)" },
      { key: "scrollCompletionRate", label: "Scroll Completion (%)" }
    ]);
  }

  if (
    report === "engagement_case_studies" ||
    report === "case_studies" ||
    report === "case-studies"
  ) {
    const data = await getEngagementCaseStudiesReport(prisma, query);
    return toCsv(data.rows, [
      { key: "slug", label: "Slug" },
      { key: "title", label: "Title" },
      { key: "views", label: "Views" },
      { key: "deepScrollRate", label: "Deep Scroll Rate (%)" },
      { key: "resumeClicks", label: "Resume Clicks" },
      { key: "contactClicks", label: "Contact Clicks" }
    ]);
  }

  if (report === "events") {
    const data = await getEventsReport(prisma, query);
    return toCsv(data.counts, [
      { key: "eventName", label: "Event" },
      { key: "count", label: "Count" },
      { key: "uniqueUsers", label: "Unique Users" }
    ]);
  }

  if (report === "conversions") {
    const data = await getConversionsReport(prisma, query);
    const rows = Object.entries(data.counts).map(([eventName, values]) => ({
      eventName,
      current: values.current,
      previous: values.previous,
      delta_percent: values.deltaPercent.toFixed(2)
    }));

    return toCsv(rows, [
      { key: "eventName", label: "Event" },
      { key: "current", label: "Current" },
      { key: "previous", label: "Previous" },
      { key: "delta_percent", label: "Delta %" }
    ]);
  }

  if (report === "funnels") {
    const data = await getFunnelsReport(prisma, query);
    return toCsv(data.steps, [
      { key: "step", label: "Step" },
      { key: "sessions", label: "Sessions" },
      { key: "dropOff", label: "Drop Off" },
      { key: "conversionRate", label: "Conversion Rate (%)" }
    ]);
  }

  const fallback = await getEventsReport(prisma, query);
  return toCsv(fallback.counts, [
    { key: "eventName", label: "Event" },
    { key: "count", label: "Count" },
    { key: "uniqueUsers", label: "Unique Users" }
  ]);
}

module.exports = {
  buildDateRange,
  extractFilters,
  invalidateAnalyticsCache,
  getOverviewReport,
  getRealtimeReport,
  getAcquisitionReport,
  getEngagementPagesReport,
  getEngagementCaseStudiesReport,
  getEventsReport,
  getConversionsReport,
  getFunnelsReport,
  getCsvExport
};
