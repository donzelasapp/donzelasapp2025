-- Garantir que a coluna account_type existe e tem o tipo correto
ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_type;
ALTER TABLE public.profiles ADD COLUMN account_type TEXT CHECK (account_type IN ('donzela', 'plebeu'));

-- Atualizar a função de atualização de perfil
CREATE OR REPLACE FUNCTION public.update_profile(
  user_id UUID,
  name TEXT,
  account_type TEXT,
  city TEXT,
  phone TEXT,
  birthdate DATE
)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE profiles
  SET
    name = COALESCE($2, name),
    account_type = COALESCE($3, account_type),
    city = COALESCE($4, city),
    phone = COALESCE($5, phone),
    birthdate = COALESCE($6, birthdate),
    updated_at = NOW()
  WHERE id = $1
  RETURNING *;
END;
$$; 