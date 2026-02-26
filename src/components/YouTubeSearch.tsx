import React, { useState, useRef } from 'react';
import { Search, Loader2, Youtube, ExternalLink, Calendar, Eye, Hash, Image as ImageIcon, Play, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_URL } from '../lib/config';

interface YouTubeVideo {
    id: string;
    title: string;
    author: string;
    views: number;
    thumbnail: string;
    url: string;
}

interface YouTubeSearchProps {
    onSelect: (thumbnailUrl: string) => void;
}

export const YouTubeSearch: React.FC<YouTubeSearchProps> = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<YouTubeVideo[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [lastQuery, setLastQuery] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchResults = async (searchQuery: string, page: number, append: boolean) => {
        try {
            const res = await fetch(`${API_URL} /api/youtube - search ? q = ${encodeURIComponent(searchQuery)}& page=${page} `);
            if (!res.ok) throw new Error('Error al buscar en YouTube');

            const data = await res.json();
            const newVideos: YouTubeVideo[] = data.videos || [];

            if (append) {
                // Filter out duplicates by id
                setResults(prev => {
                    const existingIds = new Set(prev.map(v => v.id));
                    const unique = newVideos.filter(v => !existingIds.has(v.id));
                    return [...prev, ...unique];
                });
            } else {
                setResults(newVideos);
            }

            setHasMore(data.hasMore ?? false);
            setCurrentPage(page);
            setLastQuery(searchQuery);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError('');
        setResults([]);
        setCurrentPage(1);
        setHasMore(false);

        await fetchResults(query.trim(), 1, false);
        setIsSearching(false);
    };

    const handleLoadMore = async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextPage = currentPage + 1;
        await fetchResults(lastQuery, nextPage, true);
        setIsLoadingMore(false);
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
        return views.toString();
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative flex">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Busca canales o temas (ej: mrbeast, vlogs, cocina)"
                        className="w-full bg-[#1e1e20] border border-[#27272a] focus:border-[#34d399] rounded-l-xl py-3 pl-11 pr-4 text-sm text-[#f4f4f5] placeholder:text-[#52525b] focus:outline-none transition-colors border-r-0"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="px-5 bg-[#27272a] hover:bg-[#3f3f46] border border-[#27272a] border-l-0 rounded-r-xl transition-colors disabled:opacity-50 text-white text-sm font-semibold shrink-0"
                >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                </button>
            </form>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            {/* Results Grid — fixed-height scrollable container */}
            {results.length > 0 && (
                <div ref={scrollRef} className="max-h-[280px] overflow-y-auto rounded-xl" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 #18181b' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
                        {results.map((video) => (
                            <div
                                key={video.id}
                                className="bg-[#1e1e20] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#34d399]/50 transition-colors cursor-pointer group"
                                onClick={() => onSelect(video.thumbnail)}
                            >
                                <div className="relative aspect-video">
                                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#34d399] rounded-full p-2 scale-90 group-hover:scale-100 duration-200">
                                            <Play className="w-5 h-5 text-black fill-black" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-1.5 right-1.5 bg-[#09090b]/90 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#f4f4f5] flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {formatViews(video.views)}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="text-xs font-semibold text-[#f4f4f5] line-clamp-2 leading-snug mb-1">{video.title}</h3>
                                    <p className="text-[10px] text-[#a1a1aa]">{video.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More Button — inside the scroll area */}
                    {hasMore && (
                        <div className="mt-4 pb-2 flex justify-center sticky bottom-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/90 to-transparent pt-6">
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="group flex items-center gap-2.5 px-6 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-[#34d399] font-medium text-xs rounded-full border border-[#3f3f46] transition-all disabled:opacity-60"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cargando...
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                        Cargar más resultados
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state after search */}
            {!isSearching && results.length === 0 && lastQuery && (
                <div className="py-12 text-center">
                    <p className="text-[#717171] text-sm">No se encontraron resultados para "{lastQuery}"</p>
                </div>
            )}
        </div>
    );
};
