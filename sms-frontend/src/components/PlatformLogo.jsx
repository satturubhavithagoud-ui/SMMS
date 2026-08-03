import {
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaXTwitter,
  FaYoutube,
  FaPinterest,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa6';

const PLATFORMS = {
  instagram: { Icon: FaInstagram, label: 'Instagram', bg: 'bg-[#E1306C]', text: 'text-white' },
  facebook: { Icon: FaFacebook, label: 'Facebook', bg: 'bg-[#1877F2]', text: 'text-white' },
  linkedin: { Icon: FaLinkedin, label: 'LinkedIn', bg: 'bg-[#0077B5]', text: 'text-white' },
  twitter: { Icon: FaXTwitter, label: 'X', bg: 'bg-black', text: 'text-white' },
  x: { Icon: FaXTwitter, label: 'X', bg: 'bg-black', text: 'text-white' },
  youtube: { Icon: FaYoutube, label: 'YouTube', bg: 'bg-[#FF0000]', text: 'text-white' },
  pinterest: { Icon: FaPinterest, label: 'Pinterest', bg: 'bg-[#BD081C]', text: 'text-white' },
  tiktok: { Icon: FaTiktok, label: 'TikTok', bg: 'bg-black', text: 'text-white' },
  whatsapp: { Icon: FaWhatsapp, label: 'WhatsApp', bg: 'bg-[#25D366]', text: 'text-white' },
};

function normalizePlatform(platform) {
  return (platform || '').toLowerCase().replace(/[^a-z]/g, '');
}

export function getPlatformConfig(platform) {
  const key = normalizePlatform(platform);
  if (key.includes('instagram')) return PLATFORMS.instagram;
  if (key.includes('facebook')) return PLATFORMS.facebook;
  if (key.includes('linkedin')) return PLATFORMS.linkedin;
  if (key.includes('twitter') || key === 'x') return PLATFORMS.twitter;
  if (key.includes('youtube')) return PLATFORMS.youtube;
  if (key.includes('pinterest')) return PLATFORMS.pinterest;
  if (key.includes('tiktok')) return PLATFORMS.tiktok;
  if (key.includes('whatsapp')) return PLATFORMS.whatsapp;
  return null;
}

/** Brand icon — plain or badge variant */
export default function PlatformLogo({ platform, size = 16, variant = 'icon', className = '' }) {
  const config = getPlatformConfig(platform);

  if (!config) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} style={{ fontSize: size }} title={platform}>
        🌐
      </span>
    );
  }

  const { Icon, label, bg, text } = config;

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-lg ${bg} ${text} ${className}`}
        style={{ width: size + 8, height: size + 8 }}
        title={label}
      >
        <Icon size={size} />
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${className}`} title={label}>
      <Icon size={size} />
    </span>
  );
}

export const PLATFORM_FILTER_LIST = [
  { name: 'Instagram', value: 'INSTAGRAM' },
  { name: 'Facebook', value: 'FACEBOOK' },
  { name: 'LinkedIn', value: 'LINKEDIN' },
  { name: 'X', value: 'TWITTER' },
  { name: 'YouTube', value: 'YOUTUBE' },
  { name: 'Pinterest', value: 'PINTEREST' },
];

export const PLATFORM_EDIT_LIST = [
  { name: 'Instagram', value: 'instagram' },
  { name: 'Facebook', value: 'facebook' },
  { name: 'LinkedIn', value: 'linkedin' },
  { name: 'X', value: 'twitter' },
  { name: 'YouTube', value: 'youtube' },
  { name: 'Pinterest', value: 'pinterest' },
];
