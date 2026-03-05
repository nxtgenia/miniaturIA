import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, X, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/config';

interface CheckoutSignupModalProps {
    planKey: string;
    onClose: () => void;
}

export default function CheckoutSignupModal({ planKey, onClose }: CheckoutSignupModalProps) {
    const { signUpWithEmail, signOut, user: existingUser, session } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mapa de enlaces de pago directos de Stripe (Payment Links)
    const PAYMENT_LINKS: Record<string, string> = {
        'pack_micro': 'https://buy.stripe.com/fZu6oH8SFdIXc7Rfyq0RG00',
        'pack_basic': 'https://buy.stripe.com/14AeVd7OB6gvefZdqi0RG01',
        'pack_plus': 'https://buy.stripe.com/3cIeVd3yl7kzfk32LE0RG02',
        'pack_boost': 'https://buy.stripe.com/28E3cv8SF6gv3Bl0Dw0RG03',
        'pack_ultra': 'https://buy.stripe.com/7sY7sL7OB6gv3Bl2LE0RG04',
        'starter_monthly': 'https://buy.stripe.com/9B600j1qd20f5Jt4TM0RG05',
        'starter_annual': 'https://buy.stripe.com/6oU6oHd8V6gv9ZJae60RG06',
        'pro_monthly': 'https://buy.stripe.com/dRmeVd1qdeN1go70Dw0RG07',
        'pro_annual': 'https://buy.stripe.com/fZu5kD2uh6gv9ZJ9a20RG08',
        'agency_monthly': 'https://buy.stripe.com/6oU14n5Gt0Wbc7Reum0RG09',
        'agency_annual': 'https://buy.stripe.com/6oU00j4Cp6gvb3Nbia0RG0a'
    };

    const handleStripeRedirect = async (userId: string, userEmail: string) => {
        const paymentLink = PAYMENT_LINKS[planKey];
        if (!paymentLink) {
            setError('Error: Enlace de pago no configurado aún para este plan.');
            setLoading(false);
            return;
        }

        // Pasamos el ID del usuario como client_reference_id para poder darle los créditos luego por webhook
        const url = new URL(paymentLink);
        url.searchParams.set('client_reference_id', userId);
        url.searchParams.set('prefilled_email', userEmail || '');

        window.location.href = url.toString();

        // Simular que está cargando mientras redirige
        setTimeout(() => setLoading(false), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (existingUser) {
            setLoading(true);
            try {
                await handleStripeRedirect(existingUser.id, existingUser.email || '');
            } catch (err: any) {
                setError('Error de conexión: ' + err.message);
                setLoading(false);
            }
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { error: signUpErr, user } = await signUpWithEmail(email, password, name);

            if (signUpErr) {
                setError(signUpErr);
                setLoading(false);
                return;
            }

            if (!user) {
                setError('Error al crear el usuario. Inténtalo de nuevo.');
                setLoading(false);
                return;
            }

            await handleStripeRedirect(user.id, email);
        } catch (err: any) {
            setError('Error de conexión: ' + err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#1e1e1e] rounded-3xl w-full max-w-md p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#ff0000]/10 rounded-full blur-[80px]" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-[#555] hover:text-white transition-colors z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-white text-center mb-2">
                        {existingUser ? 'Confirmar Compra' : 'Casi estamos'}
                    </h2>
                    <p className="text-[#a1a1aa] text-center text-sm mb-8">
                        {existingUser
                            ? `Hola ${existingUser.user_metadata?.full_name || 'de nuevo'}, vamos a Stripe para procesar tu plan.`
                            : 'Crea tu cuenta segura para asociar tus créditos e ir al pago.'
                        }
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!existingUser ? (
                            <>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <input
                                        type="text"
                                        placeholder="Tu nombre"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#555] focus:outline-none focus:border-[#ff0000]/50 transition-colors text-sm"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <input
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#555] focus:outline-none focus:border-[#ff0000]/50 transition-colors text-sm"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <input
                                        type="password"
                                        placeholder="Crea una contraseña segura"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-[#555] focus:outline-none focus:border-[#ff0000]/50 transition-colors text-sm"
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-6 text-center">
                                    <p className="text-white font-bold text-sm mb-1">{existingUser.email}</p>
                                    <p className="text-[#555] text-xs">Pago asociado a esta cuenta</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => signOut()}
                                    className="w-full text-[#555] hover:text-[#ff0000] text-xs transition-colors py-2"
                                >
                                    ¿Quieres usar otra cuenta? Cerrar sesión
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-sm text-red-400 leading-snug">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ff0000] hover:bg-[#cc0000] disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,0,0.2)] mt-6"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Preparando pasarela...
                                </>
                            ) : (
                                <>
                                    {existingUser ? 'Pagar Ahora' : 'Continuar al Pago Seguro'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[#555] text-[10px] mt-6 leading-relaxed">
                        Procesado con máxima seguridad por <br />
                        <span className="font-bold text-white/50">Stripe</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
