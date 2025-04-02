-- Remover o índice antigo
DROP INDEX IF EXISTS idx_profiles_tipo_conta;

-- Criar o novo índice com o nome correto
CREATE INDEX idx_profiles_account_type ON public.profiles USING btree (account_type); 