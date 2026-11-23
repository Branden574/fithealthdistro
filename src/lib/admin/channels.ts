/**
 * Names the channel an inquiry came through, from what its browser noted (see lib/inquiry/source.ts). The utm_source
 * tag wins over the referring site, because whoever tagged the link knows best; a known site or tag gets its usual name,
 * and anything else shows as it was written. Shared by the dashboard and the inquiry page.
 */

export interface SourceParts {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrerHost: string;
}

export interface Channel {
  key: string;
  label: string;
}

export const DIRECT: Channel = { key: 'direct', label: 'Direct or unknown' };

/** Sites by the end of their host name, most specific first. */
const SITES: Array<{ key: string; label: string; hosts: RegExp }> = [
  { key: 'gemini', label: 'Gemini', hosts: /(^|\.)gemini\.google\.com$/ },
  { key: 'google', label: 'Google', hosts: /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$|(^|\.)googleadservices\.com$/ },
  { key: 'bing', label: 'Bing', hosts: /(^|\.)bing\.com$/ },
  { key: 'duckduckgo', label: 'DuckDuckGo', hosts: /(^|\.)duckduckgo\.com$/ },
  { key: 'yahoo', label: 'Yahoo', hosts: /(^|\.)yahoo\.com$/ },
  { key: 'facebook', label: 'Facebook', hosts: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/ },
  { key: 'instagram', label: 'Instagram', hosts: /(^|\.)instagram\.com$/ },
  { key: 'linkedin', label: 'LinkedIn', hosts: /(^|\.)(linkedin\.com|lnkd\.in)$/ },
  { key: 'x', label: 'X (Twitter)', hosts: /(^|\.)(x\.com|twitter\.com|t\.co)$/ },
  { key: 'youtube', label: 'YouTube', hosts: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { key: 'tiktok', label: 'TikTok', hosts: /(^|\.)tiktok\.com$/ },
  { key: 'pinterest', label: 'Pinterest', hosts: /(^|\.)(pinterest\.[a-z.]+|pin\.it)$/ },
  { key: 'nextdoor', label: 'Nextdoor', hosts: /(^|\.)nextdoor\.com$/ },
  { key: 'yelp', label: 'Yelp', hosts: /(^|\.)yelp\.com$/ },
  { key: 'reddit', label: 'Reddit', hosts: /(^|\.)reddit\.com$/ },
  { key: 'chatgpt', label: 'ChatGPT', hosts: /(^|\.)(chatgpt\.com|chat\.openai\.com)$/ },
  { key: 'perplexity', label: 'Perplexity', hosts: /(^|\.)perplexity\.ai$/ },
  { key: 'claude', label: 'Claude', hosts: /(^|\.)claude\.ai$/ },
  { key: 'copilot', label: 'Copilot', hosts: /(^|\.)copilot\.microsoft\.com$/ },
];

/** utm_source values people commonly write for those sites. */
const TAGS: Record<string, string> = {
  google: 'google',
  'google ads': 'google',
  adwords: 'google',
  bing: 'bing',
  facebook: 'facebook',
  fb: 'facebook',
  meta: 'facebook',
  instagram: 'instagram',
  ig: 'instagram',
  linkedin: 'linkedin',
  x: 'x',
  twitter: 'x',
  youtube: 'youtube',
  tiktok: 'tiktok',
  pinterest: 'pinterest',
  nextdoor: 'nextdoor',
  yelp: 'yelp',
  reddit: 'reddit',
  chatgpt: 'chatgpt',
  openai: 'chatgpt',
  perplexity: 'perplexity',
  claude: 'claude',
  copilot: 'copilot',
  gemini: 'gemini',
};

/** utm_medium values that mean a paid ad. */
const PAID = new Set(['cpc', 'ppc', 'paid', 'paidsearch', 'paid search', 'paid_search', 'paid social', 'paid_social', 'paidsocial', 'display', 'ads', 'ad', 'banner']);

const siteByKey = new Map(SITES.map((site) => [site.key, site]));

function siteFor(host: string): Channel | null {
  const site = SITES.find((entry) => entry.hosts.test(host));
  return site ? { key: site.key, label: site.label } : null;
}

/** "flyer" becomes "Flyer"; tags are stored in lower case. */
const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function channelOf(parts: SourceParts): Channel {
  let base: Channel;
  if (parts.utmSource) {
    const known = siteByKey.get(TAGS[parts.utmSource] ?? '');
    base = known ? { key: known.key, label: known.label } : (siteFor(parts.utmSource) ?? { key: `tag:${parts.utmSource}`, label: capitalized(parts.utmSource) });
  } else if (parts.referrerHost) {
    base = siteFor(parts.referrerHost) ?? { key: `site:${parts.referrerHost}`, label: parts.referrerHost };
  } else if (parts.utmMedium) {
    base = { key: `medium:${parts.utmMedium}`, label: capitalized(parts.utmMedium) };
  } else {
    return DIRECT;
  }
  return PAID.has(parts.utmMedium) ? { key: `${base.key}:paid`, label: `${base.label} ads` } : base;
}

export interface ChannelCount extends Channel {
  inquiries: number;
  converted: number;
  /** Campaign names tagged on these inquiries' links, most inquiries first. */
  campaigns: Array<{ name: string; inquiries: number }>;
}

/** Adds up rows that land in the same channel. Most inquiries first; Direct or unknown last among equals. */
export function byChannel(rows: Array<SourceParts & { inquiries: number; converted: number }>): ChannelCount[] {
  const channels = new Map<string, ChannelCount>();
  for (const row of rows) {
    const channel = channelOf(row);
    const entry = channels.get(channel.key) ?? { ...channel, inquiries: 0, converted: 0, campaigns: [] };
    entry.inquiries += row.inquiries;
    entry.converted += row.converted;
    if (row.utmCampaign) {
      const campaign = entry.campaigns.find((item) => item.name === row.utmCampaign);
      if (campaign) campaign.inquiries += row.inquiries;
      else entry.campaigns.push({ name: row.utmCampaign, inquiries: row.inquiries });
    }
    channels.set(channel.key, entry);
  }
  const sorted = [...channels.values()];
  for (const entry of sorted) entry.campaigns.sort((a, b) => b.inquiries - a.inquiries || a.name.localeCompare(b.name));
  return sorted.sort(
    (a, b) => b.inquiries - a.inquiries || Number(a.key === DIRECT.key) - Number(b.key === DIRECT.key) || a.label.localeCompare(b.label),
  );
}
