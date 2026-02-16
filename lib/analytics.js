const crypto = require("crypto");
const cron = require("node-cron");

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

const CONTACT_METHODS = new Set(["email", "form", "phone"]);
const RESUME_LOCATIONS = new Set(["header", "footer", "case_study"]);

function isDoNotTrack(req) {
  return String(req.get("DNT") || "") === "1" || String(req.get("Sec-GPC") || "") === "1";
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function sanitizeText(value, maxLength = 120) {
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

function sanitizeLocation(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "unknown";
}

function sanitizeDomain(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  const noProto = raw.replace(/^https?:\/\//, "");
  const host = noProto.split("/")[0].split(":")[0].replace(/^www\./, "");
  return host.replace(/[^a-z0-9.-]/g, "").slice(0, 120);
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

function inferDeviceType(userAgent) {
  const ua = String(userAgent || "").toLowerCase();
  if (!ua) return "desktop";

  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

function sanitizePath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw, "http://localhost");
    const cleanPath = (url.pathname || "/").replace(/\/+$/, "") || "/";
    return cleanPath.slice(0, 255);
  } catch (error) {
    const noQuery = raw.split("?")[0].split("#")[0] || "/";
    const normalized = noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
    return (normalized.replace(/\/+$/, "") || "/").slice(0, 255);
  }
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date, dayOffset) {
  return new Date(date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
}

function formatDateKey(date) {
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

function buildDateRange(query, fallbackDays = 7) {
  const today = startOfUtcDay(new Date());
  const fallbackEnd = today;
  const fallbackStart = addDays(today, -(fallbackDays - 1));

  const requestedStart = parseDateInput(query?.start);
  const requestedEnd = parseDateInput(query?.end);

  let start = requestedStart || fallbackStart;
  let end = requestedEnd || fallbackEnd;

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  const maxWindowDays = 90;
  const actualDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  if (actualDays > maxWindowDays) {
    start = addDays(end, -(maxWindowDays - 1));
  }

  const startAt = startOfUtcDay(start);
  const endAt = addDays(startOfUtcDay(end), 1);
  const days = Math.floor((endAt.getTime() - startAt.getTime()) / 86400000);

  const previousEndAt = startAt;
  const previousStartAt = addDays(previousEndAt, -days);

  return {
    startAt,
    endAt,
    previousStartAt,
    previousEndAt,
    startDate: formatDateKey(startAt),
    endDate: formatDateKey(addDays(endAt, -1)),
    previousStartDate: formatDateKey(previousStartAt),
    previousEndDate: formatDateKey(addDays(previousEndAt, -1)),
    days
  };
}

function getDateRangeQuery(range) {
  return `start=${encodeURIComponent(range.startDate)}&end=${encodeURIComponent(range.endDate)}`;
}

function compareMetric(currentValue, previousValue) {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  let deltaPercent = 0;
  if (previous > 0) {
    deltaPercent = ((current - previous) / previous) * 100;
  } else if (current > 0) {
    deltaPercent = 100;
  }

  let anomaly = "stable";
  if (previous >= 10 && Math.abs(deltaPercent) >= 30) {
    anomaly = deltaPercent > 0 ? "spike" : "drop";
  }

  return {
    current,
    previous,
    deltaPercent,
    anomaly
  };
}

function hashFallbackId(seed) {
  const digest = crypto.createHash("sha256").update(seed).digest("hex");
  return digest.slice(0, 16);
}

function normalizeCollectPayload(input, req) {
  const eventName = sanitizeText(input?.eventName || input?.event_name, 64).toLowerCase();
  if (!TRACKED_EVENT_NAMES.has(eventName)) {
    return null;
  }

  const params = input?.params && typeof input.params === "object" ? input.params : {};

  const userIdInput = sanitizeText(input?.userId || input?.user_id, 64);
  const sessionIdInput = sanitizeText(input?.sessionId || input?.session_id, 64);

  const userAgent = sanitizeText(req.get("user-agent"), 160);
  const fallbackSeed = `${userAgent}|${sanitizeText(req.get("accept-language"), 40)}`;
  const fallbackId = hashFallbackId(fallbackSeed || "anonymous");

  const userId = userIdInput || `anon-${fallbackId}`;
  const sessionId = sessionIdInput || `sess-${fallbackId}`;

  const pagePath = sanitizePath(input?.pagePath || input?.page_path || req.get("referer"));
  const pageTitle = sanitizeText(input?.pageTitle || input?.page_title, 200) || null;

  const refererUrl = sanitizeText(req.get("referer"), 400);
  let referrerDomain = sanitizeDomain(input?.referrerDomain || input?.referrer_domain);
  if (!referrerDomain && refererUrl) {
    referrerDomain = sanitizeDomain(refererUrl);
  }

  const rawDevice =
    input?.deviceType || input?.device_type || input?.device || params.device || "";
  const deviceType = sanitizeDevice(rawDevice) || inferDeviceType(userAgent);

  const rawCountry =
    input?.countryCode ||
    input?.country_code ||
    input?.country ||
    params.country ||
    req.get("cf-ipcountry") ||
    "";
  const countryCode = sanitizeCountry(rawCountry) || null;

  const eventTimeInput = input?.eventTime || input?.event_time;
  const parsedEventTime = eventTimeInput ? new Date(eventTimeInput) : new Date();
  const eventTime = Number.isNaN(parsedEventTime.getTime()) ? new Date() : parsedEventTime;

  const data = {
    eventName,
    eventTime,
    eventDate: startOfUtcDay(eventTime),
    userId,
    sessionId,
    pagePath: pagePath || null,
    pageTitle,
    referrerDomain: referrerDomain || null,
    deviceType: deviceType || null,
    countryCode,
    sessionSource: sanitizeText(input?.sessionSource || input?.session_source, 64) || null,
    sessionMedium: sanitizeText(input?.sessionMedium || input?.session_medium, 64) || null,
    sessionCampaign:
      sanitizeText(input?.sessionCampaign || input?.session_campaign, 120) || null,
    firstTouchSource:
      sanitizeText(input?.firstTouchSource || input?.first_touch_source, 64) || null,
    firstTouchMedium:
      sanitizeText(input?.firstTouchMedium || input?.first_touch_medium, 64) || null,
    firstTouchCampaign:
      sanitizeText(input?.firstTouchCampaign || input?.first_touch_campaign, 120) || null,
    slug: null,
    caseStudyTitle: null,
    percent: null,
    location: null,
    method: null,
    destinationDomain: null,
    linkText: null,
    success: null,
    metadata: null
  };

  if (eventName === "view_case_study") {
    data.slug = sanitizeSlug(params.slug) || null;
    data.caseStudyTitle = sanitizeText(params.title, 200) || null;
  }

  if (eventName === "scroll_depth") {
    data.slug = sanitizeSlug(params.slug) || null;
    data.percent = clampNumber(params.percent, 0, 100);
  }

  if (eventName === "click_resume_download") {
    const location = sanitizeLocation(params.location);
    data.location = RESUME_LOCATIONS.has(location) ? location : "unknown";
  }

  if (eventName === "click_contact") {
    const method = sanitizeText(params.method, 24).toLowerCase();
    data.method = CONTACT_METHODS.has(method) ? method : "unknown";
    data.location = sanitizeLocation(params.location);
  }

  if (eventName === "submit_contact_form") {
    data.success = parseBoolean(params.success);
  }

  if (eventName === "outbound_click") {
    data.destinationDomain = sanitizeDomain(params.destination_domain || params.destinationDomain) || null;
    data.linkText = sanitizeText(params.link_text || params.linkText, 120) || null;
    data.location = sanitizeLocation(params.location);
  }

  if (eventName === "copy_email") {
    data.location = sanitizeLocation(params.location);
  }

  return data;
}

function buildEventSummary(events) {
  const userSet = new Set();
  const sessionMap = new Map();
  const pageviewSet = new Set();
  let conversions = 0;

  for (const event of events) {
    if (event.userId) userSet.add(event.userId);

    if (!sessionMap.has(event.sessionId)) {
      sessionMap.set(event.sessionId, []);
    }
    sessionMap.get(event.sessionId).push(event);

    if (event.pagePath) {
      pageviewSet.add(`${event.sessionId}::${event.pagePath}`);
    }

    if (CONVERSION_EVENT_NAMES.has(event.eventName)) {
      conversions += 1;
    }
  }

  let engagedSessions = 0;
  let totalEngagementSeconds = 0;

  for (const [sessionId, sessionEvents] of sessionMap.entries()) {
    if (!sessionId) continue;

    sessionEvents.sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());

    const first = sessionEvents[0];
    const last = sessionEvents[sessionEvents.length - 1];
    const rawDurationSec = Math.max(
      0,
      Math.round((last.eventTime.getTime() - first.eventTime.getTime()) / 1000)
    );
    const cappedDuration = Math.min(rawDurationSec, 1800);
    totalEngagementSeconds += cappedDuration;

    const hasDeepScroll = sessionEvents.some(
      (evt) => evt.eventName === "scroll_depth" && Number(evt.percent || 0) >= 50
    );
    const hasConversion = sessionEvents.some((evt) => CONVERSION_EVENT_NAMES.has(evt.eventName));
    const engaged = sessionEvents.length >= 2 || hasDeepScroll || hasConversion;

    if (engaged) {
      engagedSessions += 1;
    }
  }

  const sessions = sessionMap.size;
  const users = userSet.size;
  const pageviews = pageviewSet.size;
  const engagementRate = sessions ? (engagedSessions / sessions) * 100 : 0;
  const avgEngagementSeconds = sessions ? totalEngagementSeconds / sessions : 0;

  return {
    users,
    sessions,
    pageviews,
    engagementRate,
    avgEngagementSeconds,
    conversions,
    sessionMap
  };
}

function buildPageEngagement(sessionMap) {
  const pageVisitSet = new Set();
  const pageTimeMap = new Map();
  const pageExitMap = new Map();

  for (const events of sessionMap.values()) {
    const sortedEvents = [...events].sort(
      (a, b) => a.eventTime.getTime() - b.eventTime.getTime()
    );

    let lastTrackedPage = "";

    for (let i = 0; i < sortedEvents.length; i += 1) {
      const current = sortedEvents[i];
      const pagePath = sanitizePath(current.pagePath || "");
      if (!pagePath) continue;

      pageVisitSet.add(`${current.sessionId}::${pagePath}`);
      lastTrackedPage = pagePath;

      const next = sortedEvents[i + 1];
      if (!next) continue;

      const diffSeconds = Math.max(
        0,
        Math.round((next.eventTime.getTime() - current.eventTime.getTime()) / 1000)
      );
      const bounded = Math.min(diffSeconds, 1800);

      pageTimeMap.set(pagePath, (pageTimeMap.get(pagePath) || 0) + bounded);
    }

    if (lastTrackedPage) {
      pageExitMap.set(lastTrackedPage, (pageExitMap.get(lastTrackedPage) || 0) + 1);
    }
  }

  const pageSessionCountMap = new Map();
  for (const pair of pageVisitSet) {
    const [, pagePath] = pair.split("::");
    pageSessionCountMap.set(pagePath, (pageSessionCountMap.get(pagePath) || 0) + 1);
  }

  const pages = [];
  for (const [pagePath, sessionCount] of pageSessionCountMap.entries()) {
    const totalTime = pageTimeMap.get(pagePath) || 0;
    const exits = pageExitMap.get(pagePath) || 0;

    pages.push({
      pagePath,
      pageviews: sessionCount,
      avgTimeSeconds: sessionCount ? totalTime / sessionCount : 0,
      exitRate: sessionCount ? (exits / sessionCount) * 100 : 0
    });
  }

  pages.sort((a, b) => b.pageviews - a.pageviews);

  return pages;
}

function buildCaseStudyDeepScroll(events) {
  const map = new Map();

  for (const event of events) {
    if (event.eventName !== "scroll_depth") continue;
    if (Number(event.percent || 0) < 75) continue;
    const slug = sanitizeSlug(event.slug || "");
    if (!slug) continue;

    if (!map.has(slug)) {
      map.set(slug, new Set());
    }

    map.get(slug).add(event.sessionId);
  }

  return Array.from(map.entries())
    .map(([slug, sessions]) => ({
      slug,
      deepScrollSessions: sessions.size
    }))
    .sort((a, b) => b.deepScrollSessions - a.deepScrollSessions);
}

function buildAcquisition(events) {
  const perSession = new Map();

  for (const event of events) {
    if (!perSession.has(event.sessionId)) {
      perSession.set(event.sessionId, []);
    }
    perSession.get(event.sessionId).push(event);
  }

  const sessionSourceMap = new Map();
  const firstTouchSourceMap = new Map();
  const sessionCampaignMap = new Map();
  const firstTouchCampaignMap = new Map();

  for (const sessionEvents of perSession.values()) {
    const sorted = [...sessionEvents].sort(
      (a, b) => a.eventTime.getTime() - b.eventTime.getTime()
    );
    const first = sorted[0];

    const sessionSource = sanitizeText(first.sessionSource, 64) || "(direct)";
    const sessionMedium = sanitizeText(first.sessionMedium, 64) || "(none)";
    const sessionCampaign = sanitizeText(first.sessionCampaign, 120) || "(not set)";
    const firstTouchSource = sanitizeText(first.firstTouchSource, 64) || sessionSource;
    const firstTouchMedium = sanitizeText(first.firstTouchMedium, 64) || sessionMedium;
    const firstTouchCampaign =
      sanitizeText(first.firstTouchCampaign, 120) || sessionCampaign || "(not set)";

    const sessionDimension = `${sessionSource} / ${sessionMedium}`;
    const firstTouchDimension = `${firstTouchSource} / ${firstTouchMedium}`;

    sessionSourceMap.set(sessionDimension, (sessionSourceMap.get(sessionDimension) || 0) + 1);
    firstTouchSourceMap.set(
      firstTouchDimension,
      (firstTouchSourceMap.get(firstTouchDimension) || 0) + 1
    );

    sessionCampaignMap.set(sessionCampaign, (sessionCampaignMap.get(sessionCampaign) || 0) + 1);
    firstTouchCampaignMap.set(
      firstTouchCampaign,
      (firstTouchCampaignMap.get(firstTouchCampaign) || 0) + 1
    );
  }

  const toRows = (map) =>
    Array.from(map.entries())
      .map(([dimension, sessions]) => ({ dimension, sessions }))
      .sort((a, b) => b.sessions - a.sessions);

  return {
    sessionSourceMedium: toRows(sessionSourceMap),
    firstTouchSourceMedium: toRows(firstTouchSourceMap),
    sessionCampaigns: toRows(sessionCampaignMap),
    firstTouchCampaigns: toRows(firstTouchCampaignMap)
  };
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

function buildEventTrend(events) {
  const byDate = new Map();

  for (const event of events) {
    const key = formatDateKey(startOfUtcDay(event.eventTime));
    byDate.set(key, (byDate.get(key) || 0) + 1);
  }

  return Array.from(byDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function buildRealtime(events) {
  const activeUsers = new Set();
  const topPagesMap = new Map();

  for (const event of events) {
    if (event.userId) activeUsers.add(event.userId);

    const page = sanitizePath(event.pagePath || "");
    if (page) {
      topPagesMap.set(page, (topPagesMap.get(page) || 0) + 1);
    }
  }

  const topPages = Array.from(topPagesMap.entries())
    .map(([pagePath, eventsCount]) => ({ pagePath, events: eventsCount }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 10);

  const liveFeed = events
    .slice()
    .sort((a, b) => b.eventTime.getTime() - a.eventTime.getTime())
    .slice(0, 50)
    .map((event) => ({
      at: event.eventTime,
      eventName: event.eventName,
      pagePath: event.pagePath || "(unknown)",
      slug: event.slug || "",
      location: event.location || ""
    }));

  return {
    activeUsers: activeUsers.size,
    topPages,
    liveFeed
  };
}

function buildConversions(events) {
  const counts = {
    click_resume_download: 0,
    click_contact: 0,
    submit_contact_form: 0
  };

  const bySession = new Map();

  for (const event of events) {
    if (Object.hasOwn(counts, event.eventName)) {
      counts[event.eventName] += 1;
    }

    if (!bySession.has(event.sessionId)) {
      bySession.set(event.sessionId, []);
    }

    bySession.get(event.sessionId).push(event);
  }

  let funnel1Home = 0;
  let funnel1Case = 0;
  let funnel1Contact = 0;
  let funnel2Case = 0;
  let funnel2Resume = 0;

  for (const sessionEvents of bySession.values()) {
    const sorted = [...sessionEvents].sort(
      (a, b) => a.eventTime.getTime() - b.eventTime.getTime()
    );

    const homeIndex = sorted.findIndex((evt) => sanitizePath(evt.pagePath || "") === "/");
    const caseIndex = sorted.findIndex(
      (evt) =>
        evt.eventName === "view_case_study" ||
        sanitizePath(evt.pagePath || "").startsWith("/case-studies/")
    );
    const contactIndex = sorted.findIndex(
      (evt) => evt.eventName === "click_contact" || evt.eventName === "submit_contact_form"
    );
    const resumeIndex = sorted.findIndex((evt) => evt.eventName === "click_resume_download");

    if (homeIndex >= 0) {
      funnel1Home += 1;
      if (caseIndex > homeIndex) {
        funnel1Case += 1;
        if (contactIndex > caseIndex) {
          funnel1Contact += 1;
        }
      }
    }

    if (caseIndex >= 0) {
      funnel2Case += 1;
      if (resumeIndex > caseIndex) {
        funnel2Resume += 1;
      }
    }
  }

  return {
    counts,
    funnel: {
      homeToCaseToContact: [
        { step: "Home", sessions: funnel1Home },
        { step: "Case Study", sessions: funnel1Case },
        { step: "Contact", sessions: funnel1Contact }
      ],
      caseToResume: [
        { step: "Case Study", sessions: funnel2Case },
        { step: "Resume", sessions: funnel2Resume }
      ]
    }
  };
}

function aggregateRowsForDay(day, events) {
  const rows = [];
  const summary = buildEventSummary(events);
  const pageRows = buildPageEngagement(summary.sessionMap);
  const eventRows = buildEventCounts(events);
  const caseRows = buildCaseStudyDeepScroll(events);
  const acquisition = buildAcquisition(events);
  const conversions = buildConversions(events);

  rows.push(
    {
      day,
      bucket: "overview",
      metric: "users",
      dimension: null,
      value: summary.users
    },
    {
      day,
      bucket: "overview",
      metric: "sessions",
      dimension: null,
      value: summary.sessions
    },
    {
      day,
      bucket: "overview",
      metric: "pageviews",
      dimension: null,
      value: summary.pageviews
    },
    {
      day,
      bucket: "overview",
      metric: "engagement_rate",
      dimension: null,
      value: summary.engagementRate
    },
    {
      day,
      bucket: "overview",
      metric: "avg_engagement_seconds",
      dimension: null,
      value: summary.avgEngagementSeconds
    },
    {
      day,
      bucket: "overview",
      metric: "conversions",
      dimension: null,
      value: summary.conversions
    }
  );

  for (const row of eventRows) {
    rows.push({
      day,
      bucket: "events",
      metric: "count",
      dimension: row.eventName,
      value: row.count,
      uniqueUsers: row.uniqueUsers
    });
  }

  for (const row of pageRows) {
    rows.push(
      {
        day,
        bucket: "pages",
        metric: "pageviews",
        dimension: row.pagePath,
        value: row.pageviews
      },
      {
        day,
        bucket: "pages",
        metric: "avg_time_on_page",
        dimension: row.pagePath,
        value: row.avgTimeSeconds
      },
      {
        day,
        bucket: "pages",
        metric: "exit_rate",
        dimension: row.pagePath,
        value: row.exitRate
      }
    );
  }

  for (const row of caseRows) {
    rows.push({
      day,
      bucket: "case_study",
      metric: "deep_scroll_75_sessions",
      dimension: row.slug,
      value: row.deepScrollSessions
    });
  }

  for (const row of acquisition.sessionSourceMedium) {
    rows.push({
      day,
      bucket: "acquisition_session",
      metric: "sessions",
      dimension: row.dimension,
      value: row.sessions
    });
  }

  for (const row of acquisition.firstTouchSourceMedium) {
    rows.push({
      day,
      bucket: "acquisition_first_touch",
      metric: "sessions",
      dimension: row.dimension,
      value: row.sessions
    });
  }

  for (const row of acquisition.sessionCampaigns) {
    rows.push({
      day,
      bucket: "campaign_session",
      metric: "sessions",
      dimension: row.dimension,
      value: row.sessions
    });
  }

  for (const row of acquisition.firstTouchCampaigns) {
    rows.push({
      day,
      bucket: "campaign_first_touch",
      metric: "sessions",
      dimension: row.dimension,
      value: row.sessions
    });
  }

  for (const [eventName, count] of Object.entries(conversions.counts)) {
    rows.push({
      day,
      bucket: "conversions",
      metric: "count",
      dimension: eventName,
      value: count
    });
  }

  return rows;
}

async function runDailyAggregation(prisma, targetDay) {
  const day = startOfUtcDay(targetDay);
  const dayEnd = addDays(day, 1);

  const events = await prisma.event.findMany({
    where: {
      eventTime: {
        gte: day,
        lt: dayEnd
      }
    },
    orderBy: {
      eventTime: "asc"
    },
    select: {
      eventName: true,
      eventTime: true,
      userId: true,
      sessionId: true,
      pagePath: true,
      slug: true,
      percent: true,
      location: true,
      sessionSource: true,
      sessionMedium: true,
      sessionCampaign: true,
      firstTouchSource: true,
      firstTouchMedium: true,
      firstTouchCampaign: true
    }
  });

  const rows = aggregateRowsForDay(day, events);

  await prisma.$transaction(async (tx) => {
    await tx.dailyAggregate.deleteMany({
      where: { day }
    });

    if (rows.length > 0) {
      await tx.dailyAggregate.createMany({ data: rows });
    }
  });

  return rows.length;
}

async function backfillRecentAggregates(prisma, days = 14) {
  const safeDays = Math.max(1, Math.min(Number(days) || 14, 120));
  const today = startOfUtcDay(new Date());

  for (let i = safeDays - 1; i >= 0; i -= 1) {
    const day = addDays(today, -i);
    // Keep startup resilient even if one day fails.
    try {
      await runDailyAggregation(prisma, day);
    } catch (error) {
      console.error("Daily aggregation failed for", formatDateKey(day), error.message);
    }
  }
}

function scheduleDailyAggregation(prisma, options = {}) {
  const cronExpression = options.cron || process.env.ANALYTICS_CRON || "5 0 * * *";
  const cronTimezone = options.timezone || process.env.ANALYTICS_CRON_TZ || "UTC";

  const job = cron.schedule(
    cronExpression,
    async () => {
      const dayToAggregate = addDays(startOfUtcDay(new Date()), -1);

      try {
        await runDailyAggregation(prisma, dayToAggregate);
      } catch (error) {
        console.error("Scheduled daily aggregation failed:", error);
      }
    },
    {
      timezone: cronTimezone
    }
  );

  return job;
}

function mergeOverviewRows(rows) {
  const merged = {
    users: 0,
    sessions: 0,
    pageviews: 0,
    engagement_rate: 0,
    avg_engagement_seconds: 0,
    conversions: 0
  };

  const dayCountMap = new Map();

  for (const row of rows) {
    const metric = row.metric;
    if (!Object.hasOwn(merged, metric)) continue;

    if (metric === "engagement_rate" || metric === "avg_engagement_seconds") {
      const dayKey = formatDateKey(row.day);
      if (!dayCountMap.has(metric)) dayCountMap.set(metric, new Map());
      dayCountMap.get(metric).set(dayKey, Number(row.value || 0));
      continue;
    }

    merged[metric] += Number(row.value || 0);
  }

  const engagementDays = dayCountMap.get("engagement_rate") || new Map();
  const timeDays = dayCountMap.get("avg_engagement_seconds") || new Map();

  merged.engagement_rate =
    engagementDays.size > 0
      ? Array.from(engagementDays.values()).reduce((sum, value) => sum + value, 0) /
        engagementDays.size
      : 0;

  merged.avg_engagement_seconds =
    timeDays.size > 0
      ? Array.from(timeDays.values()).reduce((sum, value) => sum + value, 0) / timeDays.size
      : 0;

  return merged;
}

async function getOverview(prisma, range) {
  const [currentRows, previousRows] = await Promise.all([
    prisma.dailyAggregate.findMany({
      where: {
        bucket: "overview",
        day: {
          gte: range.startAt,
          lt: range.endAt
        }
      }
    }),
    prisma.dailyAggregate.findMany({
      where: {
        bucket: "overview",
        day: {
          gte: range.previousStartAt,
          lt: range.previousEndAt
        }
      }
    })
  ]);

  const current = mergeOverviewRows(currentRows);
  const previous = mergeOverviewRows(previousRows);

  return {
    users: compareMetric(current.users, previous.users),
    sessions: compareMetric(current.sessions, previous.sessions),
    pageviews: compareMetric(current.pageviews, previous.pageviews),
    engagementRate: compareMetric(current.engagement_rate, previous.engagement_rate),
    avgEngagementSeconds: compareMetric(
      current.avg_engagement_seconds,
      previous.avg_engagement_seconds
    ),
    conversions: compareMetric(current.conversions, previous.conversions)
  };
}

async function getRealtime(prisma) {
  const since = new Date(Date.now() - 30 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      eventTime: {
        gte: since
      }
    },
    orderBy: {
      eventTime: "desc"
    },
    select: {
      eventName: true,
      eventTime: true,
      userId: true,
      pagePath: true,
      slug: true,
      location: true
    }
  });

  return buildRealtime(events);
}

async function getEventsInRange(prisma, range) {
  return prisma.event.findMany({
    where: {
      eventTime: {
        gte: range.startAt,
        lt: range.endAt
      }
    },
    orderBy: {
      eventTime: "asc"
    },
    select: {
      eventName: true,
      eventTime: true,
      userId: true,
      sessionId: true,
      pagePath: true,
      slug: true,
      caseStudyTitle: true,
      percent: true,
      location: true,
      sessionSource: true,
      sessionMedium: true,
      sessionCampaign: true,
      firstTouchSource: true,
      firstTouchMedium: true,
      firstTouchCampaign: true
    }
  });
}

async function getAcquisition(prisma, range) {
  const aggregateRows = await prisma.dailyAggregate.findMany({
    where: {
      day: {
        gte: range.startAt,
        lt: range.endAt
      },
      bucket: {
        in: [
          "acquisition_session",
          "acquisition_first_touch",
          "campaign_session",
          "campaign_first_touch"
        ]
      }
    }
  });

  if (aggregateRows.length > 0) {
    const sessionSourceMap = new Map();
    const firstTouchSourceMap = new Map();
    const sessionCampaignMap = new Map();
    const firstTouchCampaignMap = new Map();

    for (const row of aggregateRows) {
      const dimension = row.dimension || "(not set)";
      const value = Number(row.value || 0);
      if (row.bucket === "acquisition_session") {
        sessionSourceMap.set(dimension, (sessionSourceMap.get(dimension) || 0) + value);
      } else if (row.bucket === "acquisition_first_touch") {
        firstTouchSourceMap.set(dimension, (firstTouchSourceMap.get(dimension) || 0) + value);
      } else if (row.bucket === "campaign_session") {
        sessionCampaignMap.set(dimension, (sessionCampaignMap.get(dimension) || 0) + value);
      } else if (row.bucket === "campaign_first_touch") {
        firstTouchCampaignMap.set(
          dimension,
          (firstTouchCampaignMap.get(dimension) || 0) + value
        );
      }
    }

    const toRows = (map) =>
      Array.from(map.entries())
        .map(([dimension, sessions]) => ({ dimension, sessions: Math.round(sessions) }))
        .sort((a, b) => b.sessions - a.sessions);

    return {
      sessionSourceMedium: toRows(sessionSourceMap),
      firstTouchSourceMedium: toRows(firstTouchSourceMap),
      sessionCampaigns: toRows(sessionCampaignMap),
      firstTouchCampaigns: toRows(firstTouchCampaignMap)
    };
  }

  const events = await getEventsInRange(prisma, range);
  return buildAcquisition(events);
}

async function getEngagement(prisma, range) {
  const aggregateRows = await prisma.dailyAggregate.findMany({
    where: {
      day: {
        gte: range.startAt,
        lt: range.endAt
      },
      bucket: {
        in: ["pages", "case_study"]
      }
    }
  });

  if (aggregateRows.length > 0) {
    const pageMap = new Map();
    const caseMap = new Map();

    for (const row of aggregateRows) {
      if (row.bucket === "pages" && row.dimension) {
        if (!pageMap.has(row.dimension)) {
          pageMap.set(row.dimension, {
            pagePath: row.dimension,
            pageviews: 0,
            avgTimeAccumulator: 0,
            avgTimeSamples: 0,
            exitRateAccumulator: 0,
            exitRateSamples: 0
          });
        }

        const page = pageMap.get(row.dimension);
        if (row.metric === "pageviews") {
          page.pageviews += Number(row.value || 0);
        } else if (row.metric === "avg_time_on_page") {
          page.avgTimeAccumulator += Number(row.value || 0);
          page.avgTimeSamples += 1;
        } else if (row.metric === "exit_rate") {
          page.exitRateAccumulator += Number(row.value || 0);
          page.exitRateSamples += 1;
        }
      }

      if (
        row.bucket === "case_study" &&
        row.metric === "deep_scroll_75_sessions" &&
        row.dimension
      ) {
        caseMap.set(row.dimension, (caseMap.get(row.dimension) || 0) + Number(row.value || 0));
      }
    }

    const topPages = Array.from(pageMap.values())
      .map((page) => ({
        pagePath: page.pagePath,
        pageviews: Math.round(page.pageviews),
        avgTimeSeconds:
          page.avgTimeSamples > 0 ? page.avgTimeAccumulator / page.avgTimeSamples : 0,
        exitRate:
          page.exitRateSamples > 0 ? page.exitRateAccumulator / page.exitRateSamples : 0
      }))
      .sort((a, b) => b.pageviews - a.pageviews)
      .slice(0, 15);

    const caseStudyDeepScroll = Array.from(caseMap.entries())
      .map(([slug, deepScrollSessions]) => ({
        slug,
        deepScrollSessions: Math.round(deepScrollSessions)
      }))
      .sort((a, b) => b.deepScrollSessions - a.deepScrollSessions);

    return {
      topPages,
      caseStudyDeepScroll
    };
  }

  const events = await getEventsInRange(prisma, range);
  const summary = buildEventSummary(events);

  return {
    topPages: buildPageEngagement(summary.sessionMap).slice(0, 15),
    caseStudyDeepScroll: buildCaseStudyDeepScroll(events)
  };
}

async function getEventsReport(prisma, range) {
  const aggregateRows = await prisma.dailyAggregate.findMany({
    where: {
      day: {
        gte: range.startAt,
        lt: range.endAt
      },
      bucket: "events",
      metric: "count"
    }
  });

  if (aggregateRows.length > 0) {
    const eventCountMap = new Map();
    const trendMap = new Map();

    for (const row of aggregateRows) {
      const eventName = row.dimension || "unknown_event";
      const dayKey = formatDateKey(row.day);
      const value = Number(row.value || 0);
      const uniqueUsers = Number(row.uniqueUsers || 0);

      if (!eventCountMap.has(eventName)) {
        eventCountMap.set(eventName, {
          eventName,
          count: 0,
          uniqueUsers: 0
        });
      }

      const entry = eventCountMap.get(eventName);
      entry.count += value;
      entry.uniqueUsers += uniqueUsers;

      trendMap.set(dayKey, (trendMap.get(dayKey) || 0) + value);
    }

    const counts = Array.from(eventCountMap.values())
      .map((row) => ({
        eventName: row.eventName,
        count: Math.round(row.count),
        uniqueUsers: Math.round(row.uniqueUsers)
      }))
      .sort((a, b) => b.count - a.count);

    const trend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count: Math.round(count) }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    return {
      counts,
      trend
    };
  }

  const events = await getEventsInRange(prisma, range);

  return {
    counts: buildEventCounts(events),
    trend: buildEventTrend(events)
  };
}

async function getConversions(prisma, range) {
  const [aggregateRows, events] = await Promise.all([
    prisma.dailyAggregate.findMany({
      where: {
        day: {
          gte: range.startAt,
          lt: range.endAt
        },
        bucket: "conversions",
        metric: "count"
      }
    }),
    getEventsInRange(prisma, range)
  ]);

  const conversionModel = buildConversions(events);

  if (aggregateRows.length > 0) {
    const counts = {
      click_resume_download: 0,
      click_contact: 0,
      submit_contact_form: 0
    };
    for (const row of aggregateRows) {
      if (Object.hasOwn(counts, row.dimension || "")) {
        counts[row.dimension] += Math.round(Number(row.value || 0));
      }
    }

    return {
      counts,
      funnel: conversionModel.funnel
    };
  }

  return conversionModel;
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

async function buildCsvReport(prisma, report, range) {
  if (report === "overview") {
    const overview = await getOverview(prisma, range);
    const rows = [
      {
        metric: "Users",
        current: overview.users.current,
        previous: overview.users.previous,
        delta_percent: overview.users.deltaPercent.toFixed(2),
        anomaly: overview.users.anomaly
      },
      {
        metric: "Sessions",
        current: overview.sessions.current,
        previous: overview.sessions.previous,
        delta_percent: overview.sessions.deltaPercent.toFixed(2),
        anomaly: overview.sessions.anomaly
      },
      {
        metric: "Pageviews",
        current: overview.pageviews.current,
        previous: overview.pageviews.previous,
        delta_percent: overview.pageviews.deltaPercent.toFixed(2),
        anomaly: overview.pageviews.anomaly
      },
      {
        metric: "Engagement Rate",
        current: overview.engagementRate.current.toFixed(2),
        previous: overview.engagementRate.previous.toFixed(2),
        delta_percent: overview.engagementRate.deltaPercent.toFixed(2),
        anomaly: overview.engagementRate.anomaly
      },
      {
        metric: "Avg Engagement Seconds",
        current: overview.avgEngagementSeconds.current.toFixed(2),
        previous: overview.avgEngagementSeconds.previous.toFixed(2),
        delta_percent: overview.avgEngagementSeconds.deltaPercent.toFixed(2),
        anomaly: overview.avgEngagementSeconds.anomaly
      },
      {
        metric: "Conversions",
        current: overview.conversions.current,
        previous: overview.conversions.previous,
        delta_percent: overview.conversions.deltaPercent.toFixed(2),
        anomaly: overview.conversions.anomaly
      }
    ];

    return toCsv(rows, [
      { key: "metric", label: "Metric" },
      { key: "current", label: "Current" },
      { key: "previous", label: "Previous" },
      { key: "delta_percent", label: "Delta %" },
      { key: "anomaly", label: "Anomaly" }
    ]);
  }

  if (report === "events") {
    const events = await getEventsReport(prisma, range);
    return toCsv(events.counts, [
      { key: "eventName", label: "Event" },
      { key: "count", label: "Count" },
      { key: "uniqueUsers", label: "Unique Users" }
    ]);
  }

  if (report === "acquisition") {
    const acquisition = await getAcquisition(prisma, range);
    const rows = acquisition.sessionSourceMedium.map((item) => ({
      perspective: "session",
      dimension: item.dimension,
      sessions: item.sessions
    }));

    rows.push(
      ...acquisition.firstTouchSourceMedium.map((item) => ({
        perspective: "first_touch",
        dimension: item.dimension,
        sessions: item.sessions
      }))
    );

    return toCsv(rows, [
      { key: "perspective", label: "Perspective" },
      { key: "dimension", label: "Source / Medium" },
      { key: "sessions", label: "Sessions" }
    ]);
  }

  if (report === "engagement") {
    const engagement = await getEngagement(prisma, range);
    return toCsv(engagement.topPages, [
      { key: "pagePath", label: "Page" },
      { key: "pageviews", label: "Pageviews" },
      { key: "avgTimeSeconds", label: "Avg Time (sec)" },
      { key: "exitRate", label: "Exit Rate (%)" }
    ]);
  }

  if (report === "conversions") {
    const conversions = await getConversions(prisma, range);
    const rows = Object.entries(conversions.counts).map(([eventName, count]) => ({
      eventName,
      count
    }));

    return toCsv(rows, [
      { key: "eventName", label: "Conversion Event" },
      { key: "count", label: "Count" }
    ]);
  }

  const events = await getEventsReport(prisma, range);
  return toCsv(events.counts, [
    { key: "eventName", label: "Event" },
    { key: "count", label: "Count" },
    { key: "uniqueUsers", label: "Unique Users" }
  ]);
}

module.exports = {
  TRACKED_EVENT_NAMES,
  CONVERSION_EVENT_NAMES,
  isDoNotTrack,
  normalizeCollectPayload,
  buildDateRange,
  getDateRangeQuery,
  runDailyAggregation,
  backfillRecentAggregates,
  scheduleDailyAggregation,
  getOverview,
  getRealtime,
  getAcquisition,
  getEngagement,
  getEventsReport,
  getConversions,
  buildCsvReport
};
