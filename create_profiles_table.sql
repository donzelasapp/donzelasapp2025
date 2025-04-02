-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  birthdate DATE,
  phone TEXT,
  city TEXT,
  account_type TEXT CHECK (account_type IN ('donzela', 'plebeu')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
-- Permitir leitura do próprio perfil
CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para permitir que donzelas vejam apenas perfis de plebeus de sua cidade
CREATE POLICY "Donzelas veem apenas plebeus de sua cidade" 
  ON public.profiles 
  FOR SELECT 
  USING (
    (auth.uid() != id) AND 
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'donzela' AND 
    account_type = 'plebeu' AND 
    city = (SELECT city FROM public.profiles WHERE id = auth.uid())
  );

-- Política para permitir que plebeus vejam apenas perfis de donzelas
CREATE POLICY "Plebeus veem apenas donzelas" 
  ON public.profiles 
  FOR SELECT 
  USING (
    (auth.uid() != id) AND 
    (SELECT account_type FROM public.profiles WHERE id = auth.uid()) = 'plebeu' AND 
    account_type = 'donzela'
  );

-- Permitir criação do próprio perfil
CREATE POLICY "Usuários podem criar seus próprios perfis"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permitir atualização do próprio perfil
CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Função para criar automaticamente um perfil quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função quando um novo usuário é criado
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para verificar se um email já existe
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = email_to_check
  );
END;
$$; 