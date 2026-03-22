// 角色相册相关类型定义

export interface AlbumImage {
  id: string;
  url: string;           // 图片URL或base64
  prompt?: string;       // 生成时使用的prompt
  model?: string;        // 使用的AI模型
  type: 'selfie' | 'custom' | 'avatar';  // 图片类型
  createdAt: Date;
  metadata?: {
    scene?: string;
    outfit?: string;
    mood?: string;
    [key: string]: any;
  };
}

export interface CharacterAlbum {
  avatarId: string;
  images: AlbumImage[];
  createdAt: Date;
  updatedAt: Date;
}

// 获取角色相册
export const getAlbum = (avatarId: string): CharacterAlbum => {
  try {
    const saved = localStorage.getItem(`aura-album-${avatarId}`);
    if (saved) {
      const album = JSON.parse(saved);
      // 确保日期正确解析
      album.images = album.images.map((img: any) => ({
        ...img,
        createdAt: new Date(img.createdAt)
      }));
      return album;
    }
  } catch (e) {
    console.error('Failed to load album:', e);
  }
  
  return {
    avatarId,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// 保存角色相册
export const saveAlbum = (album: CharacterAlbum): void => {
  try {
    album.updatedAt = new Date();
    
    // 尝试保存
    try {
      localStorage.setItem(`aura-album-${album.avatarId}`, JSON.stringify(album));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('[Album] Storage quota exceeded, trimming album...');
        // 清理旧图片，保留最新的5张
        trimAlbum(album.avatarId, 5);
        // 重新尝试保存
        const trimmedAlbum = getAlbum(album.avatarId);
        localStorage.setItem(`aura-album-${album.avatarId}`, JSON.stringify(trimmedAlbum));
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.error('Failed to save album:', e);
  }
};

// 添加图片到相册
export const addToAlbum = (
  avatarId: string, 
  url: string, 
  options: {
    prompt?: string;
    model?: string;
    type?: 'selfie' | 'custom' | 'avatar';
    metadata?: AlbumImage['metadata'];
  } = {}
): AlbumImage | null => {
  try {
    const album = getAlbum(avatarId);
    
    // 对于base64图片，如果太大会导致localStorage溢出
    if (url.startsWith('data:') && url.length > 100000) {
      console.warn('[Album] Large base64 image, skipping storage to save space');
      // 对于过大的base64图片，不存储到相册
      return null;
    }
    
    const newImage: AlbumImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      prompt: options.prompt?.substring(0, 200), // 限制prompt长度
      model: options.model,
      type: options.type || 'selfie',
      createdAt: new Date(),
      metadata: options.metadata
    };
    
    // 添加到开头（最新的在前）
    album.images.unshift(newImage);
    
    // 限制相册大小（最多30张，减少以节省空间）
    if (album.images.length > 30) {
      album.images = album.images.slice(0, 30);
    }
    
    saveAlbum(album);
    console.log(`[Album] Added image to ${avatarId}'s album. Total: ${album.images.length}`);
    return newImage;
  } catch (e) {
    console.error('Failed to add to album:', e);
    return null;
  }
};

// 从相册删除图片
export const removeFromAlbum = (avatarId: string, imageId: string): boolean => {
  try {
    const album = getAlbum(avatarId);
    const index = album.images.findIndex(img => img.id === imageId);
    
    if (index !== -1) {
      album.images.splice(index, 1);
      saveAlbum(album);
      console.log(`[Album] Removed image ${imageId} from ${avatarId}'s album`);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to remove from album:', e);
    return false;
  }
};

// 清理相册（保留最新的n张）
export const trimAlbum = (avatarId: string, keepCount: number = 20): void => {
  try {
    const album = getAlbum(avatarId);
    if (album.images.length > keepCount) {
      album.images = album.images.slice(0, keepCount);
      saveAlbum(album);
      console.log(`[Album] Trimmed ${avatarId}'s album to ${keepCount} images`);
    }
  } catch (e) {
    console.error('Failed to trim album:', e);
  }
};

// 清空相册
export const clearAlbum = (avatarId: string): void => {
  try {
    localStorage.removeItem(`aura-album-${avatarId}`);
    console.log(`[Album] Cleared ${avatarId}'s album`);
  } catch (e) {
    console.error('Failed to clear album:', e);
  }
};

// 获取相册统计
export const getAlbumStats = (avatarId: string): { total: number; selfies: number; customs: number } => {
  const album = getAlbum(avatarId);
  return {
    total: album.images.length,
    selfies: album.images.filter(img => img.type === 'selfie').length,
    customs: album.images.filter(img => img.type === 'custom').length
  };
};