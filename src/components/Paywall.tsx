import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Sparkles, ShoppingCart, Loader2 } from 'lucide-react';
import { useCredits } from '../contexts/CreditsContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/config';

interface PaywallProps {
    onClose?: () => void;
}

const creditPacks = [
    { key: 'pack_micro', name: 'Micro', emoji: '⚡', credits: 50, images: 5, price: '4,99' },
    { key: 'pack_basic', name: 'Basic', emoji: '🔥', credits: 100, images: 10, price: '7,99' },
    { key: 'pack_plus', name: 'Plus', emoji: '💎', credits: 250, images: 25, price: '14,99', popular: true },
    { key: 'pack_boost', name: 'Boost', emoji: '🚀', credits: 500, images: 50, price: '24,99' },
    { key: 'pack_ultra', name: 'Ultra', emoji: '👑', credits: 1000, images: 100, price: '44,99' },
];

const subscriptionPlans = [
    { key: 'starter_monthly', name: 'Starter', price: '19,99€/mes', credits: '400 créditos', images: '40 imágenes' },
    { key: 'pro_monthly', name: 'Pro', price: '39,99€/mes', credits: '900 créditos', images: '90 imágenes', popular: true },
    { key: 'agency_monthly', name: 'Agency', price: '79,99€/mes', credits: '1.800 créditos', images: '180 imágenes' },
];

const Paywall: React.FC<PaywallProps> = ({ onClose }) => {
    const { credits, plan } = useCredits();
    const { user, signOut, session } = useAuth();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const hasSubscription = plan !== 'free';

    const handleCheckout = async (planKey: string) => {
        if (!user || !session?.access_token) return;
        setLoadingPlan(planKey);

        try {
            const response = await fetch(`${API_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    planKey,
                    userId: user.id,
                    userEmail: user.email,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('No checkout URL:', data.error);
                alert('Error al crear el checkout. Inténtalo de nuevo.');
            }
        } catch (err: any) {
            console.error('Checkout error detail:', err);
            alert(`Error de conexión: ${err.message || 'Desconocido'}. Inténtalo de nuevo.`);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`bg-[#141414] border border-[#1e1e1e] rounded-3xl w-full p-8 relative overflow-hidden ${hasSubscription ? 'max-w-2xl' : 'max-w-lg'}`}>
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#ff0000]/10 rounded-full blur-[80px]" />

                <div className="relative z-10 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-[#ff0000]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        {hasSubscription
                            ? <ShoppingCart className="w-8 h-8 text-[#ff0000]" />
                            : <Zap className="w-8 h-8 text-[#ff0000]" />
                        }
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-white mb-3">
                        {hasSubscription
                            ? '¿Necesitas más créditos?'
                            : '¡Te has quedado sin créditos!'
                        }
                    </h2>

                    {/* Description */}
                    <p className="text-[#a1a1aa] text-sm mb-6 leading-relaxed max-w-md mx-auto">
                        {hasSubscription
                            ? 'No quieres esperar a que se renueve tu suscripción. Compra un pack de créditos extra y sigue creando ahora mismo.'
                            : 'Para empezar a generar miniaturas virales que explotan el CTR, elige el plan que mejor se adapte a tu canal.'
                        }
                    </p>

                    {/* Credit counter */}
                    <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
                        <Sparkles className="w-5 h-5 text-[#ff0000]" />
                        <span className="text-white font-bold">Créditos restantes:</span>
                        <span className="text-[#ff0000] font-black text-xl">{credits}</span>
                    </div>

                    {hasSubscription ? (
                        /* ========== CREDIT PACKS (for subscribers) ========== */
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                {creditPacks.map((pack) => (
                                    <button
                                        key={pack.key}
                                        onClick={() => handleCheckout(pack.key)}
                                        disabled={loadingPlan !== null}
                                        className={`relative text-left p-4 rounded-2xl border transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${pack.popular
                                            ? 'border-[#ff0000]/50 bg-[#ff0000]/5 hover:bg-[#ff0000]/10'
                                            : 'border-[#1e1e1e] bg-[#0a0a0a] hover:bg-[#111]'
                                            }`}
                                    >
                                        {pack.popular && (
                                            <span className="absolute -top-2 right-3 text-[9px] font-black bg-[#ff0000] text-white px-2.5 py-0.5 rounded-full uppercase">
                                                Popular
                                            </span>
                                        )}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="flex items-center gap-2">
                                                <span className="text-lg">{pack.emoji}</span>
                                                <span className="font-bold text-white text-sm">{pack.name}</span>
                                            </span>
                                            {loadingPlan === pack.key ? (
                                                <Loader2 className="w-5 h-5 text-[#ff0000] animate-spin" />
                                            ) : (
                                                <span className="text-[#ff0000] font-black text-lg">{pack.price}€</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#555] text-xs">{pack.credits} créditos</span>
                                            <span className="text-[#777] text-xs">{pack.images} imágenes</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <p className="text-[#444] text-[10px] mb-4">
                                Los créditos comprados no expiran y se suman a los de tu suscripción.
                            </p>
                        </>
                    ) : (
                        /* ========== SUBSCRIPTION PLANS (for free users) ========== */
                        <div className="space-y-3 mb-6">
                            {subscriptionPlans.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => handleCheckout(p.key)}
                                    disabled={loadingPlan !== null}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${p.popular
                                        ? 'border-[#ff0000]/50 bg-[#ff0000]/5 hover:bg-[#ff0000]/10'
                                        : 'border-[#1e1e1e] bg-[#0a0a0a] hover:bg-[#111]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-white text-sm">{p.name}</span>
                                        {p.popular && (
                                            <span className="text-[9px] font-black bg-[#ff0000] text-white px-2 py-0.5 rounded-full uppercase">
                                                Popular
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        {loadingPlan === p.key ? (
                                            <Loader2 className="w-5 h-5 text-[#ff0000] animate-spin" />
                                        ) : (
                                            <div>
                                                <span className="text-white font-black text-sm">{p.price}</span>
                                                <p className="text-[#555] text-[10px]">{p.credits} · {p.images}</p>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Dismiss or Return to Home */}
                    <div className="mt-6 flex flex-col items-center gap-4">
                        {onClose && credits > 0 && (
                            <button
                                onClick={onClose}
                                className="text-[#555] hover:text-white text-sm transition-colors"
                            >
                                Cerrar
                            </button>
                        )}

                        <Link
                            to="/"
                            className="text-[#444] hover:text-[#ff0000] text-xs transition-colors underline underline-offset-4"
                        >
                            Volver a la web principal
                        </Link>

                        <button
                            onClick={() => signOut()}
                            className="text-[#ff0000]/60 hover:text-[#ff0000] text-xs transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>

                    {/* Upgrade hint for subscribers */}
                    {hasSubscription && (
                        <p className="mt-4 text-[#555] text-xs">
                            ¿Necesitas más cada mes?{' '}
                            <Link to="/#precios" className="text-[#ff0000] hover:underline font-bold">
                                Haz upgrade de tu plan
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Paywall;
