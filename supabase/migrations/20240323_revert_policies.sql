-- Remover as políticas que causaram o erro
DROP POLICY IF EXISTS "Donzelas veem todos os plebeus" ON public.profiles;
DROP POLICY IF EXISTS "Plebeus veem todas as donzelas" ON public.profiles;

-- Recriar as políticas originais
CREATE POLICY "Donzelas veem apenas plebeus da sua cidade"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE account_type = 'donzela'
  )
  AND account_type = 'plebeu'
  AND city IN (
    SELECT city FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Plebeus veem apenas donzelas"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE account_type = 'plebeu'
  )
  AND account_type = 'donzela'
); 