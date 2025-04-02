-- Remover políticas antigas
DROP POLICY IF EXISTS "Donzelas veem apenas plebeus da sua cidade" ON public.profiles;
DROP POLICY IF EXISTS "Plebeus veem apenas donzelas" ON public.profiles;

-- Novas políticas para visualização de perfis
CREATE POLICY "Donzelas veem todos os plebeus"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Usuário atual é donzela e está tentando ver um plebeu
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND account_type = 'donzela'
  )
  AND account_type = 'plebeu'
);

CREATE POLICY "Plebeus veem todas as donzelas"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Usuário atual é plebeu e está tentando ver uma donzela
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND account_type = 'plebeu'
  )
  AND account_type = 'donzela'
); 