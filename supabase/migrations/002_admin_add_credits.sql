-- ============================================
-- Función admin para añadir créditos (usada por webhooks)
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_add_credits(
    target_user_id UUID,
    amount INTEGER,
    description TEXT DEFAULT 'Créditos añadidos'
)
RETURNS VOID AS $$
BEGIN
    -- Añadir créditos al perfil
    UPDATE profiles
    SET credits = credits + amount,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Registrar transacción
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (target_user_id, amount, 'purchase', description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
