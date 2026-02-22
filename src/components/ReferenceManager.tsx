import React from 'react';
import { UserPlus, X, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';

interface ReferenceImage {
  id: string;
  data: string;
  tag: string;
}

interface ReferenceManagerProps {
  references: ReferenceImage[];
  onAdd: (data: string) => void;
  onRemove: (id: string) => void;
}

export const ReferenceManager: React.FC<ReferenceManagerProps> = ({ references, onAdd, onRemove }) => {
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && references.length < 6) {
      const reader = new FileReader();
      reader.onload = () => {
        onAdd(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false,
    disabled: references.length >= 6
  } as any);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Referencias (Personajes y Objetos)</h3>
        <span className="text-xs text-zinc-500">{references.length} / 6</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {references.map((ref) => (
            <motion.div
              key={ref.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-xl border border-white/10 overflow-hidden bg-white/5 group"
            >
              <img src={ref.data} alt={ref.tag} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => onRemove(ref.id)}
                  className="bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] font-mono text-emerald-400 text-center">
                {ref.tag}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {references.length < 6 && (
          <div
            {...getRootProps()}
            className={`
              aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
              ${isDragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'}
            `}
          >
            <input {...getInputProps()} />
            <UserPlus className="w-6 h-6 text-zinc-500 mb-2" />
            <span className="text-[10px] text-zinc-500 font-medium">Añadir</span>
          </div>
        )}
      </div>

      {references.length > 0 && (
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
          <p className="text-[11px] text-emerald-200/60 leading-relaxed">
            Usa <span className="text-emerald-400 font-mono">@img1-3</span> para personajes y <span className="text-emerald-400 font-mono">@obj1-3</span> para objetos en tu prompt.
          </p>
        </div>
      )}
    </div>
  );
};
