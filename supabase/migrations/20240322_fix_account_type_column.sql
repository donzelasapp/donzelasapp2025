-- Primeiro, copiar os dados de tipo_de_conta para account_type onde account_type é nulo
UPDATE public.profiles 
SET account_type = tipo_de_conta 
WHERE account_type IS NULL AND tipo_de_conta IS NOT NULL;

-- Depois, remover a coluna tipo_de_conta
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tipo_de_conta;

-- Garantir que account_type tenha a constraint correta
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
CHECK (account_type IN ('donzela', 'plebeu')); 