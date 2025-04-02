-- Remover constraints existentes
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_de_conta_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Renomear coluna tipo_de_conta para account_type se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'tipo_de_conta'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN tipo_de_conta TO account_type;
    END IF;
END $$;

-- Garantir que a coluna account_type existe e tem o tipo correto
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'account_type'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN account_type TEXT;
    END IF;
END $$;

-- Adicionar a constraint correta
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
CHECK (account_type IN ('donzela', 'plebeu'));

-- Atualizar as políticas de segurança
DROP POLICY IF EXISTS "Donzelas veem apenas plebeus da sua cidade" ON public.profiles;
DROP POLICY IF EXISTS "Plebeus veem apenas donzelas" ON public.profiles;

CREATE POLICY "Donzelas veem apenas plebeus da sua cidade"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'donzela' AND
    account_type = 'plebeu' AND
    city = (SELECT city FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Plebeus veem apenas donzelas"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'plebeu' AND
    account_type = 'donzela'
); 