import React, { useState } from 'react';
import { Youtube, Upload, Link as LinkIcon, X, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { getYouTubeThumbnail } from '../lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  currentImage: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, currentImage }) => {
  const [ytUrl, setYtUrl] = useState('');
  const [error, setError] = useState('');

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onImageSelected(reader.result as string);
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
        const response = await fetch(thumb);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          onImageSelected(reader.result as string);
          setYtUrl('');
          setError('');
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        setError('No se pudo cargar la miniatura de YouTube. Intenta subir el archivo directamente.');
      }
    } else {
      setError('URL de YouTube no válida');
    }
  };

  return (
    <div className="space-y-6">
      {!currentImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[240px]",
              isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 hover:border-white/20 bg-white/5"
            )}
          >
            <input {...getInputProps()} />
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-white font-medium">Sube un archivo</p>
            <p className="text-zinc-500 text-sm mt-1">Imagen o Video</p>
          </div>

          {/* YouTube Link */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col justify-center min-h-[240px]">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <Youtube className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-white font-medium mb-4">Desde YouTube</p>
            <form onSubmit={handleYtSubmit} className="space-y-3">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="Pega la URL del video..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Cargar Miniatura
              </button>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </form>
          </div>
        </div>
      ) : (
        <div className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black">
          <img src={currentImage} alt="Base" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => onImageSelected('')}
              className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-white">Imagen Base</span>
          </div>
        </div>
      )}
    </div>
  );
};
