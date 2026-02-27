import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Youtube, Layers, Type, Zap, CheckCircle2, Bot, PlayCircle, Image as ImageIcon, Download, TrendingDown, Clock, SearchX, Lock, ArrowRight, Star, ChevronDown, MessageSquare } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CheckoutSignupModal from '../components/CheckoutSignupModal';

const AppLogo = () => (
    <div className="w-8 h-8 rounded-lg bg-[#ff0000] flex items-center justify-center shrink-0">
        <span className="text-[11px] font-black text-white tracking-tight">IA</span>
    </div>
);

const FAQItem: React.FC<{ question: string, answer: string, delay: number }> = ({ question, answer, delay }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="border border-[#1e1e1e] bg-[#141414] rounded-2xl overflow-hidden"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full p-6 text-left"
            >
                <span className="font-bold text-white pr-4">{question}</span>
                <ChevronDown className={`w-5 h-5 text-[#ff0000] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                className="overflow-hidden"
            >
                <p className="p-6 pt-0 text-[#a1a1aa] leading-relaxed border-t border-[#1e1e1e] mt-2">
                    {answer}
                </p>
            </motion.div>
        </motion.div>
    );
};

const plans = [
    {
        name: 'Starter',
        monthlyPrice: '19,99',
        annualPrice: '199',
        monthlyCredits: '400',
        annualCredits: '4.500',
        monthlyImages: '40',
        annualImages: '450',
        annualSaving: '17%',
        monthlyKey: 'basic_monthly',
        annualKey: 'basic_annual',
        popular: false,
        features: [
            'Generador de Miniaturas IA',
            'Títulos virales con IA',
            'Comunidad privada de WhatsApp',
            '🎁 Formación: Miniaturas virales',
            '🎁 Formación: Títulos virales',
        ],
        agencyOnly: [],
    },
    {
        name: 'Pro',
        monthlyPrice: '39,99',
        annualPrice: '399',
        monthlyCredits: '900',
        annualCredits: '9.000',
        monthlyImages: '90',
        annualImages: '900',
        annualSaving: '17%',
        monthlyKey: 'pro_monthly',
        annualKey: 'pro_annual',
        popular: true,
        features: [
            'Generador de Miniaturas IA',
            'Títulos virales con IA',
            'Comunidad privada de WhatsApp',
            '🎁 Formación: Miniaturas virales',
            '🎁 Formación: Títulos virales',
        ],
        agencyOnly: [],
    },
    {
        name: 'Agency',
        monthlyPrice: '79,99',
        annualPrice: '799',
        monthlyCredits: '1.800',
        annualCredits: '18.000',
        monthlyImages: '180',
        annualImages: '1.800',
        annualSaving: '17%',
        monthlyKey: 'agency_monthly',
        annualKey: 'agency_annual',
        popular: false,
        features: [
            'Generador de Miniaturas IA',
            'Títulos virales con IA',
            'Comunidad privada de WhatsApp',
            '🎁 Formación: Miniaturas virales',
            '🎁 Formación: Títulos virales',
        ],
        agencyOnly: [
            '⚡ Soporte VIP dedicado',
            '🚀 Acceso prioritario a nuevas funciones',
        ],
    },
];

const PricingSection = ({ onSelectPlan }: { onSelectPlan: (key: string) => void }) => {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <section id="pricing" className="py-32 px-6 max-w-7xl mx-auto relative">
            <div className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                        Elige tu plan y empieza a <span className="text-[#ff0000]">escalar</span> hoy
                    </h2>
                    <p className="text-[#a1a1aa] text-lg mb-10">
                        10 créditos = 1 miniatura generada. Cancela o pausa cuando quieras.
                    </p>

                    {/* Toggle Monthly / Annual */}
                    <div className="inline-flex items-center bg-[#141414] border border-[#1e1e1e] rounded-full p-1.5 gap-1">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${!isAnnual
                                ? 'bg-[#ff0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]'
                                : 'text-[#a1a1aa] hover:text-white'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isAnnual
                                ? 'bg-[#ff0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]'
                                : 'text-[#a1a1aa] hover:text-white'
                                }`}
                        >
                            Anual
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                                -17%
                            </span>
                        </button>
                    </div>
                </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
                {plans.map((plan, i) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className={`rounded-[28px] p-[1px] ${plan.popular
                            ? 'bg-gradient-to-b from-[#ff0000] via-[#ff0000]/50 to-transparent shadow-[0_0_40px_rgba(255,0,0,0.15)]'
                            : 'bg-[#1e1e1e]'
                            }`}
                    >
                        <div className={`bg-[#0f0f0f] rounded-[27px] p-8 flex flex-col h-full relative ${plan.popular ? 'pt-12' : ''
                            }`}>
                            {plan.popular && (
                                <div className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ff0000] text-white text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full shadow-[0_0_25px_rgba(255,0,0,0.5)]">
                                    ⭐ Más Popular
                                </div>
                            )}

                            <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>

                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-4xl md:text-5xl font-black text-white leading-none">
                                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}€
                                </span>
                                <span className="text-[#a1a1aa] font-bold text-sm mb-1.5">
                                    /{isAnnual ? 'año' : 'mes'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-[#ff0000] font-black text-lg">
                                    {isAnnual ? plan.annualCredits : plan.monthlyCredits} créditos
                                </span>
                                <span className="text-[#555] text-xs">
                                    ({isAnnual ? plan.annualImages : plan.monthlyImages} imágenes)
                                </span>
                            </div>

                            {isAnnual && (
                                <div className="inline-flex self-start bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-4">
                                    Ahorras {plan.annualSaving}
                                </div>
                            )}

                            <ul className="space-y-3 mb-4 flex-grow">
                                {plan.features.map((f, j) => (
                                    <li key={j} className="flex items-start gap-3 text-sm text-[#d4d4d8]">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                                {plan.agencyOnly.map((f, j) => (
                                    <li key={`a-${j}`} className="flex items-start gap-3 text-sm text-white font-semibold">
                                        <CheckCircle2 className="w-4 h-4 text-[#ff0000] shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {isAnnual && (
                                <div className="bg-gradient-to-r from-[#ff0000]/10 to-transparent border border-[#ff0000]/20 rounded-xl p-3 mb-6 flex items-center gap-3">
                                    <span className="text-lg">🎓</span>
                                    <p className="text-xs text-[#d4d4d8] font-medium leading-snug">
                                        <strong className="text-white">REGALO:</strong> Consultoría 30 min con experto en YouTube
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => onSelectPlan(isAnnual ? plan.annualKey : plan.monthlyKey)}
                                className={`w-full py-4 rounded-2xl font-black text-base transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 ${plan.popular
                                    ? 'bg-[#ff0000] hover:bg-[#cc0000] text-white shadow-[0_0_25px_rgba(255,0,0,0.3)] hover:shadow-[0_0_35px_rgba(255,0,0,0.5)]'
                                    : 'bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]'
                                    }`}>
                                Empezar ahora <ArrowRight className="w-4 h-4" />
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-[#555] font-medium">
                                <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> Pago seguro</div>
                                <div className="w-1 h-1 rounded-full bg-[#333]" />
                                <div>Sin permanencia</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default function Landing() {
    const { user, loading } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const scrollToPricing = () => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (!loading && user) {
        return <Navigate to="/app" replace />;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#f4f4f5] font-sans selection:bg-red-500/40 selection:text-white">
            {/* Spectacular Animated Background Effects */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/30 mix-blend-screen blur-[120px] rounded-full pointer-events-none z-0 animate-blob" />
            <div className="fixed top-[20%] right-[-20%] w-[40%] h-[40%] bg-red-800/20 mix-blend-screen blur-[120px] rounded-full pointer-events-none z-0 animate-blob animation-delay-2000" />
            <div className="fixed bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-[#ff0000]/10 mix-blend-screen blur-[150px] rounded-full pointer-events-none z-0 animate-blob animation-delay-4000" />

            {/* Navbar */}
            <header className="relative z-50 border-b border-[#1e1e1e] bg-[#0a0a0a]/80 backdrop-blur-lg sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AppLogo />
                        <span className="text-xl font-extrabold tracking-tight text-white">MiniaturIA</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#a1a1aa]">
                        <a href="#features" className="hover:text-white transition-colors">Funciones</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">Cómo Funciona</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link to="/auth" className="text-sm font-semibold text-white hover:text-[#ff0000] transition-colors hidden sm:block">
                            Iniciar Sesión
                        </Link>
                        <button
                            onClick={scrollToPricing}
                            className="glow-btn px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Empieza Gratis
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 w-full overflow-hidden">
                {/* HERO SECTION */}
                <section className="pt-24 pb-32 px-6 relative max-w-7xl mx-auto flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-xs font-semibold mb-8 uppercase tracking-wider"
                    >
                        <Zap className="w-3.5 h-3.5" /> La herramienta secreta de los Top YouTubers
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-6xl lg:text-[4.5rem] xl:text-[5rem] font-black text-white tracking-tight w-full max-w-[1400px] leading-[1.05] mb-8"
                    >
                        Generar miniaturas virales <br className="hidden md:block" /> en menos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0000] to-[#f87171]">30 segundos</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-[#a1a1aa] max-w-2xl mb-12"
                    >
                        Multiplica tu CTR x3 usando IA. Analizamos lo que funciona en YouTube y generamos miniaturas y títulos virales en segundos para tus videos.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="mt-12 w-full max-w-5xl rounded-2xl border border-[#2a2a2a] bg-[#141414] p-2 shadow-2xl relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10 rounded-2xl pointer-events-none" />
                        <img
                            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop"
                            alt="MiniaturIA Dashboard"
                            className="rounded-xl object-cover w-full h-[300px] sm:h-[500px] opacity-80"
                            style={{ filter: 'grayscale(0.2) contrast(1.2)' }}
                        />
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                                <AppLogo />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="flex justify-center w-full mt-12"
                    >
                        <a
                            href="#pricing"
                            className="w-full sm:w-auto glow-btn px-12 py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-3 transform hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:shadow-[0_0_40px_rgba(255,0,0,0.5)]"
                        >
                            <Sparkles className="w-6 h-6" />
                            Comprar Ahora
                        </a>
                    </motion.div>
                </section>

                {/* RESULTS GALLERY */}
                <section className="py-16 border-y border-[#1e1e1e] bg-[#0f0f0f]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
                                Resultados generados con <span className="text-[#ff0000]">MiniaturIA</span>
                            </h2>
                        </div>
                        <div className="relative w-full overflow-hidden mask-fade-edges py-4">
                            <div className="animate-marquee gap-4">
                                {/* Duplicate the array for a seamless loop */}
                                {[
                                    '/results/1.jpg', '/results/2.jpg', '/results/3.jpg', '/results/4.png',
                                    '/results/1.jpg', '/results/2.jpg', '/results/3.jpg', '/results/4.png'
                                ].map((src, i) => (
                                    <div
                                        key={i}
                                        className="w-[280px] md:w-[350px] shrink-0 aspect-video rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#141414] shadow-lg cursor-pointer group hover:border-[#ff0000]/50 transition-colors"
                                    >
                                        <img
                                            src={src}
                                            alt={`Resultado generado por IA`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE LETTER (Problem & Paradigm Shift - Techain Style) */}
                <section className="py-24 px-6 max-w-4xl mx-auto relative mt-10">
                    <div className="bg-[#f2f2f2] rounded-[32px] p-8 md:p-16 text-black relative overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.1)]">

                        {/* Header letter */}
                        <div className="flex items-center gap-4 mb-10 pb-10 border-b border-black/10">
                            <div className="w-14 h-14 bg-[#ff0000] rounded-full flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-red-500/30">
                                M
                            </div>
                            <div>
                                <h3 className="font-bold text-lg md:text-xl">Desde el escritorio de MiniaturIA</h3>
                                <p className="text-black/60 text-sm font-medium">Re: El CTR de tus vídeos depende de esto</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-6 text-base md:text-lg text-black/80 font-medium leading-relaxed">
                            <p>
                                Si creas contenido en YouTube, aceptá la verdad: <span className="bg-[#ff0000]/10 font-bold px-1 rounded text-black shadow-[inset_0_-8px_0_rgba(255,0,0,0.2)]">La retención no sirve de nada si nadie hace clic.</span> El creativo lo es todo.
                            </p>
                            <p>Pero hoy estás trabado:</p>

                            <div className="bg-white rounded-2xl p-6 md:p-8 space-y-6 my-8 shadow-sm border border-black/5">
                                <div className="flex gap-4 items-start">
                                    <span className="text-2xl mt-1">⏳</span>
                                    <p><strong className="text-black">Perdés horas</strong> buscando la idea perfecta y diseñando en Photoshop a mano para lograr resultados mediocres.</p>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <span className="text-2xl mt-1">🎲</span>
                                    <p><strong className="text-black">Testeás poco</strong> (1 miniatura por vídeo) y rezás que funcione, jugándotela a la ruleta rusa con tu canal.</p>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <span className="text-2xl mt-1">📉</span>
                                    <p><strong className="text-black">No tienes datos reales</strong> porque nunca tienes volumen de variantes A/B suficiente para saber qué gusta.</p>
                                </div>
                            </div>

                            <h3 className="text-3xl md:text-4xl font-black text-black pt-4 pb-2 tracking-tight">Necesitás volumen.</h3>

                            <p>La matemática en YouTube es cruda: <strong className="text-black">Los canales top generan hasta 20 opciones por vídeo.</strong></p>

                            <div className="space-y-2 mt-8 bg-black/5 p-6 rounded-2xl border-l-4 border-[#ff0000]">
                                <p className="font-bold text-black/70">Si testeás 1 o 2 miniaturas, es lotería.</p>
                                <p className="font-bold text-[#ff0000] text-xl">Si generás variaciones en 30 segundos cada una, es estadística.</p>
                            </div>

                            <div className="pt-12 flex justify-center">
                                <button onClick={scrollToPricing} className="bg-[#ff0000] hover:bg-[#cc0000] text-white px-8 md:px-12 py-5 rounded-2xl font-black text-lg transition-all shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:shadow-[0_0_40px_rgba(255,0,0,0.5)] transform hover:-translate-y-1 flex items-center justify-center gap-2">
                                    ELEGIR MI PLAN <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">El <span className="text-[#ff0000]">Arsenal</span> Completo</h2>
                        <p className="text-[#a1a1aa] max-w-2xl mx-auto">Todo lo que necesitas para que tu canal explote, en un solo lugar.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#141414] border border-[#1e1e1e] hover:border-[#ff0000]/50 transition-colors p-8 rounded-[24px]">
                            <div className="w-14 h-14 bg-[#ff0000]/10 rounded-2xl flex items-center justify-center mb-6">
                                <ImageIcon className="w-7 h-7 text-[#ff0000]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Generador de Miniaturas IA</h3>
                            <p className="text-[#a1a1aa] mb-6 leading-relaxed">Sube tu cara, elige el estilo, añade tu idea y la IA se encarga de aplicar los mismos filtros, iluminación y composición de los YouTubers virales.</p>
                            <ul className="space-y-3">
                                {['Remoción de fondo automática', 'Estilos: Gaming, Finanzas, Reacciones', 'Ajuste de luz y saturación viral'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-[#d4d4d8]">
                                        <CheckCircle2 className="w-5 h-5 text-[#ff0000]" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[#141414] border border-[#1e1e1e] hover:border-[#ff0000]/50 transition-colors p-8 rounded-[24px]">
                            <div className="w-14 h-14 bg-[#ff0000]/10 rounded-2xl flex items-center justify-center mb-6">
                                <Type className="w-7 h-7 text-[#ff0000]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Títulos de Alta Retención</h3>
                            <p className="text-[#a1a1aa] mb-6 leading-relaxed">No más "Mi primer vlog". Nuestro modelo entiendo de curiosidad, urgencia y emociones para darte títulos que la gente no puede evitar clickear.</p>
                            <ul className="space-y-3">
                                {['Análisis de competencia en tiempo real', 'Variantes clickbait (pero ético)', 'A/B Testing Simulator'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-[#d4d4d8]">
                                        <CheckCircle2 className="w-5 h-5 text-[#ff0000]" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section id="how-it-works" className="py-32 px-6 bg-[#111] border-y border-[#1e1e1e]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Tu Miniatura en <span className="text-[#ff0000]">3 Pasos</span></h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {[
                                {
                                    step: '01',
                                    title: 'Añade tu referencia',
                                    desc: 'Sube tu foto con cara de sorpresa o simplemente pon el link del video de tu youtuber favorito como base.',
                                    icon: <Layers className="w-6 h-6 text-[#ff0000]" />
                                },
                                {
                                    step: '02',
                                    title: 'Chatea con la IA',
                                    desc: 'Dile qué quieres. "Añade un destello rojo atrás, exagera mis ojos y pon texto de Impact font de oro".',
                                    icon: <Bot className="w-6 h-6 text-[#ff0000]" />
                                },
                                {
                                    step: '03',
                                    title: 'Descarga y triunfa',
                                    desc: 'Obtienes un render ultra-realista 4K, listo para subir a YouTube y empezar a sumar visualizaciones.',
                                    icon: <Download className="w-6 h-6 text-[#ff0000]" />
                                }
                            ].map((s, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center text-center p-6">
                                    <div className="w-16 h-16 bg-[#141414] border border-[#1e1e1e] rounded-full flex items-center justify-center mb-4 text-[#ff0000] font-black text-xl shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                        {s.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                                    <p className="text-[#a1a1aa] leading-relaxed">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* TESTIMONIALS (WALL OF LOVE) */}
                <section className="py-32 px-6 max-w-7xl mx-auto relative">
                    <div className="text-center mb-16 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff0000]/10 text-[#ff0000] text-xs font-bold mb-6"
                        >
                            <Star className="w-4 h-4 fill-current" /> CASOS DE ÉXITO
                        </motion.div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Canales que ya la están <span className="text-[#ff0000]">rompiendo</span></h2>
                        <p className="text-[#a1a1aa] max-w-2xl mx-auto text-lg">No lo decimos nosotros. Lo dicen los CTR de los creadores que ya usan MiniaturIA.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 relative z-10">
                        {[
                            {
                                name: "Alex Costa", handle: "@alexcosta_oficial", subs: "1.2M Subs",
                                text: "Antes tardaba 4 horas en encargar una miniatura, mandar revisiones, y si el video no pegaba el bajón era terrible. Ahora genero opciones yo mismo en segundos y testeo cuál pega más. Mi CTR subió del 4% al 11.2%. Loco.",
                                pfp: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100&h=100"
                            },
                            {
                                name: "Sandra Invest", handle: "@sandrainvesting", subs: "450k Subs",
                                text: "En finanzas y cripto, si la miniatura no da 'urgencia' no te ve nadie. MiniaturIA entiende perfectamente los gatillos visuales que necesito. He duplicado las views de mi canal este mes, puro ROI.",
                                pfp: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100"
                            },
                            {
                                name: "Matias Gameplay", handle: "@matygamesxd", subs: "280k Subs",
                                text: "Bro, literal usé la herramienta para resubir un video que había muerto con 2k views. Le cambié la miniatura con IA por una súper saturada y le metí un título que me escupió el bot... Boom, 150k en 3 días. Es magia negra.",
                                pfp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100"
                            }
                        ].map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                                className="gradient-border-card p-8 group overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <MessageSquare className="w-16 h-16 text-white" />
                                </div>
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <img src={t.pfp} alt={t.name} className="w-12 h-12 rounded-full border-2 border-[#1e1e1e] group-hover:border-[#ff0000] transition-colors" />
                                    <div>
                                        <h4 className="font-bold text-white leading-tight">{t.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#a1a1aa] text-sm">{t.handle}</span>
                                            <span className="text-xs bg-[#2a2a2a] text-[#d4d4d8] px-2 py-0.5 rounded-full">{t.subs}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 mb-4 text-[#ff0000]">
                                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-[#d4d4d8] leading-relaxed relative z-10 italic">"{t.text}"</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* PRICING - 3 TIER + TOGGLE */}
                <PricingSection onSelectPlan={setSelectedPlan} />

                {/* FAQ SECTION */}
                <section className="py-32 px-6 border-y border-[#1e1e1e] bg-[#0a0a0a] relative z-10">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-16 relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1e1e] text-[#a1a1aa] text-xs font-bold mb-6"
                            >
                                <MessageSquare className="w-4 h-4 fill-current" /> DUDAS SOLUCIONADAS
                            </motion.div>
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Preguntas <span className="text-[#ff0000]">Frecuentes</span></h2>
                            <p className="text-[#a1a1aa] text-lg">Resolvemos tus dudas antes de que des el salto al próximo nivel.</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    q: "¿De verdad vale la pena pagar por esto si puedo usar Canva o Photoshop gratis?",
                                    a: "Claro que puedes. Y seguirás tardando 2-4 horas por miniatura con Photoshop, probando una sola versión por vídeo, y rezando para que funcione. Con MiniaturIA generas una miniatura profesional en 30 segundos. En el tiempo que tardas en abrir Photoshop, ya tienes 5 opciones listas para testear. No compites contra Canva: compites contra los canales que ya usan IA para iterar más rápido que tú. La pregunta es cuánto te cuesta en views NO usarla."
                                },
                                {
                                    q: "Ya tengo un diseñador, ¿para qué necesito MiniaturIA?",
                                    a: "Tu diseñador es genial para la miniatura final. Pero, ¿te genera varias opciones para testear cuál tiene mejor CTR? ¿En minutos? ¿A las 3 de la mañana cuando se te ocurre una idea? MiniaturIA no sustituye a tu diseñador: multiplica su trabajo. Generas una miniatura cada 30 segundos, acumulas opciones rápido, y luego tu diseñador perfecciona la ganadora."
                                },
                                {
                                    q: "¿Cómo funciona el sistema de créditos? ¿Me van a alcanzar?",
                                    a: "Cada imagen generada cuesta 10 créditos. Con el plan Starter (400 créditos) generas 40 miniaturas al mes. Si subes 2 vídeos por semana y haces 5 variaciones por vídeo, te sobran créditos. Los títulos virales también usan créditos pero cuestan mucho menos. Y si necesitas más volumen, el plan Pro (900 créditos) o Agency (1.800 créditos) te dan margen de sobra."
                                },
                                {
                                    q: "¿Las miniaturas generadas tienen problemas de Copyright?",
                                    a: "Cero. Las imágenes son 100% originales, generadas por IA a partir de tus referencias. Te pertenecen completamente y tienes todos los derechos comerciales. Puedes monetizarlas en YouTube, usarlas en redes sociales, o donde quieras sin ningún riesgo legal."
                                },
                                {
                                    q: "No sé nada de IA ni de Prompts, ¿es difícil de usar?",
                                    a: "Es literal chatear. Subes tu foto de referencia, le explicas tu idea ('quiero una miniatura tipo MrBeast con cara de sorpresa'), y la IA hace el resto. Además, con tu suscripción recibes formación gratuita sobre cómo crear miniaturas virales y títulos que explotan el CTR. Y si te atascas, la comunidad de WhatsApp te echa una mano al momento."
                                },
                                {
                                    q: "¿Puedo cancelar cuando quiera o hay permanencia?",
                                    a: "Sin permanencia, sin contratos, sin llamadas de retención. Cancelas con 2 clics desde tu panel y sigues usando tus créditos hasta el final de tu período de facturación. Si luego quieres volver, tu cuenta y tus generaciones anteriores siguen ahí esperándote."
                                },
                                {
                                    q: "¿Qué es la comunidad de WhatsApp y la formación incluida?",
                                    a: "Todos los planes incluyen acceso a nuestra comunidad privada de WhatsApp donde creadores comparten sus resultados, estrategias de CTR y se ayudan mutuamente. Además, recibes formación exclusiva sobre cómo diseñar miniaturas que generan clics y cómo escribir títulos virales. No es un curso genérico: son las técnicas exactas que usan canales con millones de subs."
                                },
                                {
                                    q: "¿Qué ventaja tiene el plan anual frente al mensual?",
                                    a: "Ahorras un 17% respecto al precio mensual (eso son hasta 2 meses gratis en el plan Agency). Pero lo mejor es el regalo exclusivo: una consultoría personalizada de 30 minutos con un experto en YouTube que analiza tu canal, tus miniaturas y te da un plan de acción concreto para escalar. Solo por elegir anual."
                                },
                            ].map((faq, i) => (
                                <FAQItem key={i} question={faq.q} answer={faq.a} delay={i * 0.06} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 px-6 relative overflow-hidden bg-[#ff0000]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-multiply" />
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">El próximo millón de views empieza con la miniatura.</h2>
                        <button onClick={scrollToPricing} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-black hover:text-white border hover:border-white rounded-full text-base font-bold transition-all transform hover:scale-105 shadow-xl">
                            <Sparkles className="w-5 h-5" /> Entrar a MiniaturIA Hoy
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#0a0a0a] border-t border-[#1e1e1e] py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <AppLogo />
                        <span className="text-lg font-bold text-white tracking-tight">MiniaturIA</span>
                    </div>
                    <p className="text-sm text-[#777]">
                        © {new Date().getFullYear()} MiniaturIA. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-4 text-sm text-[#777]">
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-white transition-colors">Contacto</a>
                    </div>
                </div>
            </footer>

            {/* Checkout/Signup Modal */}
            {selectedPlan && (
                <CheckoutSignupModal
                    planKey={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                />
            )}
        </div>
    );
}
