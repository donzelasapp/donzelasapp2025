-- Adiciona o campo about_me na tabela profiles
ALTER TABLE profiles
ADD COLUMN about_me TEXT;

-- Atualiza a função de atualização de perfil para incluir o novo campo
CREATE OR REPLACE FUNCTION public.update_profile(
  user_id UUID,
  name TEXT,
  account_type TEXT,
  city TEXT,
  phone TEXT,
  birthdate DATE,
  hobbies TEXT[],
  interests TEXT[],
  about_me TEXT
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
    hobbies = COALESCE($7, hobbies),
    interests = COALESCE($8, interests),
    about_me = COALESCE($9, about_me),
    updated_at = NOW()
  WHERE id = $1
  RETURNING *;
END;
$$; 