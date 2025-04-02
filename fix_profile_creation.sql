-- Desabilitar temporariamente RLS para debug
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Recriar a função handle_new_user com mais logs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar uma nova política mais permissiva
CREATE POLICY "Permitir todas operações em profiles"
  ON public.profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 