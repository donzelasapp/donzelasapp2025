-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir visualização de perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Acesso público para login" ON public.profiles;
DROP POLICY IF EXISTS "Donzelas veem apenas plebeus da sua cidade" ON public.profiles;
DROP POLICY IF EXISTS "Plebeus veem apenas donzelas" ON public.profiles;

-- Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de perfil
CREATE POLICY "Permitir inserção de perfil"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Política para permitir atualização do próprio perfil
CREATE POLICY "Permitir atualização do próprio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Política para permitir leitura de perfis
CREATE POLICY "Permitir leitura de perfis"
ON public.profiles
FOR SELECT
USING (true); 