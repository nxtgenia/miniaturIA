import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react';

export default function Auth() {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [isReset, setIsReset] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        if (isReset) {
            const result = await resetPassword(email);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccessMessage('Si el correo existe, hemos enviado un enlace para restablecer la contraseña.');
            }
        } else if (isLogin) {
            const result = await signInWithEmail(email, password);
            if (result.error) {
                setError(result.error);
            } else {
                navigate('/app');
            }
        } else {
            if (password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres');
                setLoading(false);
                return;
            }
            const result = await signUpWithEmail(email, password, name);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccessMessage('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#ff0000]/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#ff0000]/5 rounded-full blur-[100px]" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-10 h-10 bg-[#ff0000] rounded-xl flex items-center justify-center">
                        <span className="text-white font-black text-sm">IA</span>
                    </div>
                    <span className="text-white font-black text-2xl tracking-tight">MiniaturIA</span>
                </Link>

                {/* Card */}
                <div className="bg-[#141414] border border-[#1e1e1e] rounded-3xl p-8 shadow-2xl">
                    <h1 className="text-2xl font-black text-white text-center mb-2">
                        {isReset ? 'Recuperar Contraseña' : isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
                    </h1>
                    <p className="text-[#a1a1aa] text-center text-sm mb-8">
                        {isReset
                            ? 'Te enviaremos un email con un enlace para crear una nueva contraseña.'
                            : isLogin
                                ? 'Inicia sesión para seguir creando miniaturas virales'
                                : 'Empieza a generar miniaturas que explotan el CTR'
                        }
                    </p>

                    {/* Google Sign In */}
                    {!isReset && (
                        <button
                            onClick={signInWithGoogle}
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-bold py-3.5 rounded-2xl transition-all mb-6"
                        >
                            <Chrome className="w-5 h-5" />
                            Continuar con Google
                        </button>
                    )}

                    {/* Divider */}
                    {!isReset && (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-[#1e1e1e]" />
                            <span className="text-[#555] text-xs font-medium">o con email</span>
                            <div className="flex-1 h-px bg-[#1e1e1e]" />
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
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
                        )}

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

                        {!isReset && (
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl py-3.5 pl-11 pr-12 text-white placeholder:text-[#555] focus:outline-none focus:border-[#ff0000]/50 transition-colors text-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
                                {successMessage}
                            </div>
                        )}

                        {isLogin && !isReset && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsReset(true);
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="text-xs text-[#a1a1aa] hover:text-white focus:outline-none"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ff0000] hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isReset ? 'Enviar Enlace' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="text-center text-[#a1a1aa] text-sm mt-6">
                        {isReset ? (
                            <button
                                onClick={() => {
                                    setIsReset(false);
                                    setIsLogin(true);
                                    setError('');
                                    setSuccessMessage('');
                                }}
                                className="text-[#ff0000] font-bold hover:underline"
                            >
                                Volver al inicio de sesión
                            </button>
                        ) : (
                            <>
                                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                                <button
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="text-[#ff0000] font-bold hover:underline"
                                >
                                    {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
                                </button>
                            </>
                        )}
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-[#555] text-xs mt-6">
                    Al continuar, aceptas nuestros <a href="#" className="underline hover:text-[#a1a1aa]">Términos</a> y <a href="#" className="underline hover:text-[#a1a1aa]">Política de Privacidad</a>
                </p>
            </div>
        </div>
    );
}
