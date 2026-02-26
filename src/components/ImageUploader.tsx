import React, { useState } from 'react';
import { Youtube, Upload, Link as LinkIcon, X, Image as ImageIcon, Search } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { getYouTubeThumbnail } from '../lib/gemini';
import { API_URL } from '../lib/config';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { YouTubeSearch } from './YouTubeSearch';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  onImageSelectedWithSource?: (base64: string, source: 'upload' | 'url' | 'search') => void;
  currentImage: string | null;
}

type Mode = 'upload' | 'url' | 'search';

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, onImageSelectedWithSource, currentImage }) => {
  const [ytUrl, setYtUrl] = useState('');
  const [error, setError] = useState('');
  const [activeMode, setActiveMode] = useState<Mode>('upload');

  const selectImage = (base64: string, source: Mode) => {
    onImageSelected(base64);
    onImageSelectedWithSource?.(base64, source);
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        selectImage(reader.result as string, 'upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'], 'video/*': ['.mp4', '.mov', '.webm'] },
    multiple: false
  } as any);

  const handleYtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const thumb = getYouTubeThumbnail(ytUrl);
    if (thumb) {
      try {
        const response = await fetch(`${API_URL}/api/proxy-image?url=${encodeURIComponent(thumb)}`);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          selectImage(reader.result as string, 'url');
          setYtUrl('');
          setError('');
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        setError('No se pudo cargar la miniatura. Intenta subir el archivo directamente.');
      }
    } else {
      setError('URL no válida');
    }
  };

  const handleSearchSelect = async (thumbnailUrl: string) => {
    try {
      const response = await fetch(`${API_URL}/api/proxy-image?url=${encodeURIComponent(thumbnailUrl)}`);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        selectImage(reader.result as string, 'search');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error procesando imagen de búsqueda', err);
    }
  };

  const modes: { key: Mode; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
    { key: 'url', label: 'URL', icon: <LinkIcon className="w-3.5 h-3.5" /> },
    { key: 'search', label: 'Buscar', icon: <Search className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full">
      {!currentImage ? (
        <div className="flex flex-col items-center gap-3 w-full">
          {/* 3-pill mode switcher */}
          <div className="flex bg-[#1a1a1a] p-1 rounded-full border border-[#2a2a2a]">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setActiveMode(m.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeMode === m.key
                  ? 'bg-[#2a2a2a] text-white shadow-sm'
                  : 'text-[#777] hover:text-white'
                  }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* Upload mode */}
          {activeMode === 'upload' && (
            <div className="w-full">
              <div
                {...getRootProps()}
                className={cn(
                  "w-full bg-[#111] border border-dashed border-[#2a2a2a] hover:border-[#ff0000]/50 rounded-xl flex items-center justify-center cursor-pointer transition-all min-h-[56px] text-sm text-[#555]",
                  isDragActive && "border-[#ff0000] bg-[#ff0000]/5 text-[#ff0000]"
                )}
              >
                <input {...getInputProps()} />
                <p>{isDragActive ? 'Suelta aquí...' : 'Arrastra una imagen aquí, o haz clic para buscar'}</p>
              </div>
            </div>
          )}

          {/* URL mode */}
          {activeMode === 'url' && (
            <div className="w-full">
              <form onSubmit={handleYtSubmit} className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Youtube className="h-4 w-4 text-[#555]" />
                </div>
                <input
                  type="text"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="Pega el link de un video o miniatura..."
                  className="w-full bg-[#111] border border-[#1e1e1e] focus:border-[#ff0000]/50 rounded-xl py-3 pl-10 pr-24 text-sm text-[#e4e4e7] placeholder:text-[#444] focus:outline-none transition-colors"
                />
                <button type="submit" className="absolute inset-y-1.5 right-1.5 px-4 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white text-xs font-medium rounded-lg transition-colors">
                  Cargar
                </button>
              </form>
              {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
            </div>
          )}

          {/* Search mode */}
          {activeMode === 'search' && (
            <div className="w-full">
              <YouTubeSearch onSelect={handleSearchSelect} />
            </div>
          )}
        </div>
      ) : (
        <div className="relative group rounded-xl overflow-hidden border border-[#1e1e1e] aspect-video bg-black">
          <img src={currentImage} alt="Base" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => onImageSelected('')}
              className="bg-[#1e1e1e] text-white p-3 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-[#ff0000]" />
            <span className="text-[10px] font-semibold text-white uppercase tracking-wide">Base</span>
          </div>
        </div>
      )}
    </div>
  );
};
