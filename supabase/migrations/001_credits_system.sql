-- ============================================
-- MiniaturIA: Sistema de Créditos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla de perfiles de usuario con créditos
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    credits INTEGER DEFAULT 0,   -- 0 créditos: deben suscribirse para usar
    plan TEXT DEFAULT 'free',     -- free, starter, pro, agency
    plan_period TEXT DEFAULT NULL, -- monthly, annual
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de historial de uso de créditos
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,          -- positivo = añadir, negativo = gastar
    type TEXT NOT NULL,                -- 'generation', 'subscription', 'bonus', 'refund'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario solo ve/edita su propio perfil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Políticas: cada usuario solo ve su historial de créditos
CREATE POLICY "Users can view own transactions"
    ON credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Función: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: ejecutar al crear nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Función: descontar créditos (usada desde el frontend)
CREATE OR REPLACE FUNCTION public.use_credits(amount INTEGER, description TEXT DEFAULT 'Generación de imagen')
RETURNS JSON AS $$
DECLARE
    current_credits INTEGER;
    user_id UUID;
BEGIN
    user_id := auth.uid();
    
    -- Obtener créditos actuales
    SELECT credits INTO current_credits FROM profiles WHERE id = user_id;
    
    IF current_credits IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;
    
    IF current_credits < amount THEN
        RETURN json_build_object('success', false, 'error', 'Créditos insuficientes', 'credits', current_credits);
    END IF;
    
    -- Descontar créditos
    UPDATE profiles SET credits = credits - amount, updated_at = NOW() WHERE id = user_id;
    
    -- Registrar transacción
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (user_id, -amount, 'generation', description);
    
    RETURN json_build_object('success', true, 'credits', current_credits - amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
