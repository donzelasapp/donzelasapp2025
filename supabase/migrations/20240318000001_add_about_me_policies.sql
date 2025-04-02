-- Políticas para o campo about_me
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permitir leitura do campo about_me para todos os usuários autenticados
CREATE POLICY "Usuários podem ver about_me de qualquer perfil"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Permitir atualização do campo about_me apenas pelo próprio usuário
CREATE POLICY "Usuários podem atualizar seu próprio about_me"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir inserção do campo about_me apenas uma vez durante o cadastro
CREATE POLICY "Usuários podem inserir about_me durante o cadastro"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id); 