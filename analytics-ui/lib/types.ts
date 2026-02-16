export type CompareMetric = {
  current: number;
  previous: number;
  deltaPercent: number;
};

export type DateRange = {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
};

export type OverviewResponse = {
  range: DateRange;
  compare: boolean;
  kpis: {
    users: CompareMetric;
    sessions: CompareMetric;
    pageviews: CompareMetric;
    engagementRate: CompareMetric;
    avgEngagementTime: CompareMetric;
    conversions: CompareMetric;
  };
  trend: Array<{
    date: string;
    users: number;
    sessions: number;
    pageviews: number;
    conversions: number;
    events: number;
  }>;
  topSources: Array<{
    source: string;
    medium: string;
    sessions: number;
  }>;
  topCaseStudies: Array<{
    slug: string;
    title: string;
    views: number;
    deepScrollSessions: number;
    deepScrollRate: number;
    resumeClicks: number;
    contactClicks: number;
    intentScore: number;
  }>;
};

export type RealtimeResponse = {
  minutes: number;
  activeUsers: number;
  topPages: Array<{ pagePath: string; events: number }>;
  liveFeed: Array<{
    id: string;
    at: string;
    eventName: string;
    pagePath: string;
    slug: string;
    location: string;
    method: string;
  }>;
};

export type AcquisitionRow = {
  key: string;
  source?: string;
  medium?: string;
  campaign?: string;
  sessions: number;
  users: number;
  conversions: number;
  conversionRate: number;
};

export type AcquisitionResponse = {
  range: DateRange;
  dimension: "sourceMedium" | "campaign";
  sessionBased: {
    sourceMedium: AcquisitionRow[];
    campaign: AcquisitionRow[];
  };
  firstTouch: {
    sourceMedium: AcquisitionRow[];
    campaign: AcquisitionRow[];
  };
  drilldown: {
    topPages: Array<{ pagePath: string; events: number; sessions: number }>;
    topCaseStudies: Array<{
      slug: string;
      title: string;
      sessions: number;
      conversions: number;
    }>;
  };
};

export type EngagementPageResponse = {
  range: DateRange;
  rows: Array<{
    pagePath: string;
    views: number;
    avgEngagementTime: number;
    exits: number;
    exitRate: number;
    scrollCompletionRate: number;
  }>;
  trend: Array<{ date: string; events: number }>;
};

export type EngagementCaseResponse = {
  range: DateRange;
  rows: Array<{
    slug: string;
    title: string;
    views: number;
    deepScrollSessions: number;
    deepScrollRate: number;
    resumeClicks: number;
    contactClicks: number;
  }>;
  trend: Array<{ date: string; events: number }>;
};

export type EventsResponse = {
  range: DateRange;
  type: string | null;
  counts: Array<{ eventName: string; count: number; uniqueUsers: number }>;
  trend: Array<{ date: string; count: number }>;
  detail: null | {
    parameters: Array<{ parameter: string; value: string; count: number }>;
    recent: Array<{
      id: string;
      at: string;
      pagePath: string;
      slug: string;
      location: string;
      method: string;
    }>;
  };
};

export type ConversionsResponse = {
  range: DateRange;
  compare: boolean;
  counts: {
    click_resume_download: CompareMetric;
    click_contact: CompareMetric;
    submit_contact_form: CompareMetric;
  };
  trend: Array<{
    date: string;
    click_resume_download: number;
    click_contact: number;
    submit_contact_form: number;
  }>;
};

export type FunnelResponse = {
  range: DateRange;
  funnel: "home_to_contact" | "case_to_resume";
  steps: Array<{
    step: string;
    sessions: number;
    dropOff: number;
    conversionRate: number;
  }>;
  overallConversionRate: number;
};
