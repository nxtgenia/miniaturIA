import React from 'react';
import { UserPlus, X } from 'lucide-react';
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
    <div className="flex flex-col items-center w-full gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2 w-full">
        <AnimatePresence mode="popLayout">
          {references.map((ref) => (
            <motion.div
              key={ref.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative w-12 h-12 rounded-lg border border-[#3f3f46] overflow-hidden bg-[#1e1e20] group"
            >
              <img src={ref.data} alt={ref.tag} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#09090b]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => onRemove(ref.id)}
                  className="text-white hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-[#09090b]/90 py-0.5 text-[8px] font-mono text-[#34d399] tracking-wider text-center font-bold">
                {ref.tag.toUpperCase()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {references.length < 6 && (
          <div
            {...getRootProps()}
            className={`w-12 h-12 rounded-lg border border-dashed flex items-center justify-center cursor-pointer transition-all ${isDragActive ? "border-[#34d399] bg-[#34d399]/10 text-[#34d399]" : "border-[#3f3f46] hover:border-[#a1a1aa] bg-[#1e1e20] text-[#71717a]"
              }`}
          >
            <input {...getInputProps()} />
            <UserPlus className="w-4 h-4" />
          </div>
        )}
      </div>

      {references.length > 0 && (
        <p className="text-[10px] text-[#71717a] font-mono mt-1">
          Use <span className="text-[#34d399]">@img1-3</span> for people, <span className="text-[#34d399]">@obj1-3</span> for objects.
        </p>
      )}
    </div>
  );
};
