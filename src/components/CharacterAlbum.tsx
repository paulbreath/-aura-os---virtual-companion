import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  Download, 
  Image as ImageIcon, 
  Camera,
  Sparkles,
  Clock,
  Grid3X3
} from 'lucide-react';
import { AlbumImage, getAlbum, removeFromAlbum, clearAlbum, getAlbumStats } from '../types/album';

interface CharacterAlbumProps {
  avatarId: string;
  avatarName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CharacterAlbum({ avatarId, avatarName, isOpen, onClose }: CharacterAlbumProps) {
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'selfie' | 'custom'>('all');

  useEffect(() => {
    if (isOpen) {
      loadAlbum();
    }
  }, [isOpen, avatarId]);

  const loadAlbum = () => {
    const album = getAlbum(avatarId);
    setImages(album.images);
  };

  const filteredImages = images.filter(img => {
    if (filter === 'all') return true;
    return img.type === filter;
  });

  const handleDelete = (imageId: string) => {
    if (confirm('确定要删除这张图片吗？')) {
      removeFromAlbum(avatarId, imageId);
      loadAlbum();
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
    }
  };

  const handleClearAll = () => {
    if (confirm(`确定要清空 ${avatarName} 的所有相册图片吗？此操作不可恢复。`)) {
      clearAlbum(avatarId);
      loadAlbum();
      setSelectedImage(null);
    }
  };

  const handleDownload = async (image: AlbumImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `${avatarName}_${image.type}_${new Date(image.createdAt).toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = getAlbumStats(avatarId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{avatarName} 的相册</h2>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    共 {stats.total} 张
                  </span>
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    自拍 {stats.selfies} 张
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filter */}
              <div className="flex bg-zinc-800 rounded-lg p-1">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'selfie', label: '自拍' },
                  { value: 'custom', label: '创作' }
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value as any)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === f.value 
                        ? 'bg-pink-500 text-white' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              
              {/* View Mode */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              
              {/* Clear All */}
              {images.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="清空相册"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              
              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">相册为空</p>
                <p className="text-sm mt-2">请求自拍或创作图片后会自动保存到这里</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-800 cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={`${avatarName} photo`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white truncate">{image.prompt || '自拍'}</p>
                        <p className="text-xs text-zinc-300 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(image.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(image); }}
                        className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                        className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-red-500/70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={`${avatarName} photo`}
                      className="w-16 h-16 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{image.prompt || '自拍'}</p>
                      <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(image.createdAt)}
                        {image.model && (
                          <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded">
                            {image.model}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(image); }}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/90"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-4xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage.url}
                  alt={`${avatarName} photo preview`}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                  <p className="text-white">{selectedImage.prompt || '自拍'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-300">
                    <span>{formatDate(selectedImage.createdAt)}</span>
                    {selectedImage.model && (
                      <span className="bg-zinc-700 px-2 py-0.5 rounded">{selectedImage.model}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { handleDelete(selectedImage.id); }}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-red-500/70"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}