// src/utils/videoEmbedParser.js

export const videoPlatforms = {
  youtube: {
    regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    embedUrl: 'https://www.youtube.com/embed/{id}',
  },
  vk: {
    regex: /(?:https?:\/\/)?(?:www\.)?(?:vk\.com|vkvideo\.ru)\/video(-?\d+_\d+)/,
    embedUrl: 'https://vk.com/video_ext.php?oid={id1}&id={id2}',
    parseIds: (match) => {
      const parts = match[1].split('_');
      return { id1: parts[0], id2: parts[1] };
    }
  },
  yandex: {
    regex: /(?:https?:\/\/)?(?:www\.)?(?:disk\.yandex\.ru|yadi\.sk)\/[^/]+\/([a-zA-Z0-9_-]+)/,
    embedUrl: 'https://disk.yandex.ru/preview/{id}?embed=1',
  },
  telegram: {
    regex: /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/[^/]+\/(\d+)/,
    embedUrl: null, // Telegram не поддерживает iframe
  },
  rutube: {
    regex: /(?:https?:\/\/)?(?:www\.)?rutube\.ru\/video\/([a-zA-Z0-9_-]+)/,
    embedUrl: 'https://rutube.ru/play/embed/{id}',
  },
  vimeo: {
    regex: /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    embedUrl: 'https://player.vimeo.com/video/{id}',
  },
  dzen: {
    regex: /(?:https?:\/\/)?(?:www\.)?dzen\.ru\/video\/watch\/([a-zA-Z0-9_-]+)/,
    embedUrl: 'https://dzen.ru/embed/video/{id}',
  }
};

export function parseVideoUrl(url) {
  const cleanUrl = url.trim();
  
  // Проверяем на прямую ссылку на видео файл
  if (cleanUrl.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv|3gp)(\?.*)?$/i)) {
    return {
      type: 'direct',
      url: cleanUrl,
      platform: 'direct',
    };
  }
  
  // Проверяем на embed iframe
  if (cleanUrl.includes('<iframe') && cleanUrl.includes('src=')) {
    const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      return {
        type: 'embed',
        url: srcMatch[1],
        embedCode: cleanUrl,
        platform: 'embed',
      };
    }
  }

  // Прямая VK embed-ссылка (video_ext.php?oid=...&id=...)
  try {
    const parsedUrl = new URL(cleanUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    const isVkHost = host === 'vk.com' || host === 'vkvideo.ru';
    const isVideoExt = parsedUrl.pathname.includes('video_ext.php');
    if (isVkHost && isVideoExt) {
      const oid = parsedUrl.searchParams.get('oid');
      const id = parsedUrl.searchParams.get('id');
      if (oid && id) {
        return {
          type: 'embed',
          url: cleanUrl,
          embedUrl: `https://vk.com/video_ext.php?oid=${oid}&id=${id}`,
          platform: 'vk',
          videoId: `${oid}_${id}`,
        };
      }
    }
  } catch {
    // ignore
  }
  
  // Проверяем соцсети
  for (const [platform, config] of Object.entries(videoPlatforms)) {
    const match = cleanUrl.match(config.regex);
    if (match) {
      if (config.parseIds) {
        const ids = config.parseIds(match);
        const embedUrl = config.embedUrl
          .replace(/{id1}/, ids.id1)
          .replace(/{id2}/, ids.id2);
        
        return {
          type: 'embed',
          url: cleanUrl,
          embedUrl: embedUrl,
          platform,
          videoId: match[1],
        };
      } else {
        return {
          type: 'embed',
          url: cleanUrl,
          embedUrl: config.embedUrl?.replace('{id}', match[1]),
          platform,
          videoId: match[1],
        };
      }
    }
  }
  
  return null;
}

export function getVideoThumbnail(parsed) {
  if (!parsed) return null;
  
  switch (parsed.platform) {
    case 'youtube':
      return `https://img.youtube.com/vi/${parsed.videoId}/0.jpg`;
    case 'vimeo':
      return `https://vumbnail.com/${parsed.videoId}.jpg`;
    case 'vk':
      return `https://sun9-35.userapi.com/impg/...`; // VK требует API токен
    default:
      return null;
  }
}
