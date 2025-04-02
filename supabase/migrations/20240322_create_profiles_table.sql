-- Drop table if exists
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    account_type TEXT CHECK (account_type IN ('donzela', 'plebeu')),
    city TEXT,
    birthdate DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuários podem criar seus próprios perfis"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

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