import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, X, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/config';

interface CheckoutSignupModalProps {
    planKey: string;
    onClose: () => void;
}

export default function CheckoutSignupModal({ planKey, onClose }: CheckoutSignupModalProps) {
    const { signUpWithEmail } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            // 1. Create the user in Supabase
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

            // 2. Immediately create Stripe checkout session with the new user's ID
            const response = await fetch(`${API_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planKey,
                    userId: user.id,
                    userEmail: email,
                }),
            });

            const data = await response.json();

            if (data.url) {
                // 3. Redirect perfectly to Stripe
                window.location.href = data.url;
            } else {
                setError('Error al generar la pasarela de pago: ' + (data.error || 'Desconocido'));
                setLoading(false);
            }
        } catch (err: any) {
            setError('Error de conexión: ' + err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#1e1e1e] rounded-3xl w-full max-w-md p-8 relative overflow-hidden shadow-2xl">
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
                        Casi estamos
                    </h2>
                    <p className="text-[#a1a1aa] text-center text-sm mb-8">
                        Crea tu cuenta segura para asociar tus créditos e ir al pago.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                    Continuar al Pago Seguro
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
