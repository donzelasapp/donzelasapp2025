-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Donzelas veem apenas plebeus de sua cidade" ON public.profiles;
DROP POLICY IF EXISTS "Plebeus veem apenas donzelas" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;

-- Criar uma política que permite todas as operações
CREATE POLICY "Permitir todas as operações" ON public.profiles
FOR ALL
USING (true)
WITH CHECK (true); 