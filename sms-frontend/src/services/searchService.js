import { apiRequest } from './api';
import { getSMHContentQueue } from './postService';
import { getPlatformConfig } from '../components/PlatformLogo';

const PLATFORM_KEYWORDS = {
  instagram: ['instagram', 'insta', 'ig'],
  facebook: ['facebook', 'fb'],
  linkedin: ['linkedin'],
  twitter: ['twitter', 'x'],
  youtube: ['youtube', 'yt'],
  tiktok: ['tiktok'],
  whatsapp: ['whatsapp'],
};

function matchesPlatform(query) {
  const q = query.toLowerCase();
  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) return platform;
  }
  return null;
}

export async function globalSearch(query) {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) return { clients: [], posts: [], platform: null };

  const q = trimmed.toLowerCase();
  const platformMatch = matchesPlatform(q);

  const [clients, posts] = await Promise.all([
    apiRequest('/smh/clients/').catch(() => []),
    getSMHContentQueue('', platformMatch ? platformMatch.toUpperCase() : '').catch(() => []),
  ]);

  const filteredClients = (clients || []).filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.industry && c.industry.toLowerCase().includes(q)) ||
      (c.plan && c.plan.toLowerCase().includes(q)) ||
      (platformMatch && c.platforms?.some((p) => p.toLowerCase().includes(platformMatch)))
  );

  const filteredPosts = (posts || []).filter(
    (p) =>
      (p.client_name && p.client_name.toLowerCase().includes(q)) ||
      (p.caption && p.caption.toLowerCase().includes(q)) ||
      (p.hashtags && p.hashtags.toLowerCase().includes(q)) ||
      (p.status && p.status.toLowerCase().includes(q)) ||
      (p.platforms && p.platforms.some((plat) => {
        const cfg = getPlatformConfig(plat);
        return cfg?.label.toLowerCase().includes(q) || plat.toLowerCase().includes(q);
      })) ||
      (platformMatch && p.platforms?.some((plat) => plat.toLowerCase().includes(platformMatch)))
  );

  return {
    clients: filteredClients.slice(0, 5),
    posts: filteredPosts.slice(0, 5),
    platform: platformMatch,
  };
}
