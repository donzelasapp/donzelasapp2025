-- Permitir leitura pública de arquivos
CREATE POLICY "Permitir leitura pública" ON storage.objects FOR SELECT
USING (true);

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Permitir upload de usuários autenticados" ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização de usuários autenticados" ON storage.objects FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Permitir deleção para usuários autenticados
CREATE POLICY "Permitir deleção de usuários autenticados" ON storage.objects FOR DELETE
USING (auth.role() = 'authenticated');

-- Função para configurar políticas de storage
create or replace function public.configure_storage_policies()
returns void as $$
begin
  -- Habilitar RLS para a tabela de objetos
  alter table storage.objects enable row level security;

  -- Remover políticas existentes
  drop policy if exists "Permitir leitura pública" on storage.objects;
  drop policy if exists "Permitir upload de usuários autenticados" on storage.objects;
  drop policy if exists "Permitir atualização de usuários autenticados" on storage.objects;
  drop policy if exists "Permitir deleção de usuários autenticados" on storage.objects;

  -- Criar novas políticas
  create policy "Permitir leitura pública"
    on storage.objects for select
    using (true);

  create policy "Permitir upload de usuários autenticados"
    on storage.objects for insert
    with check (
      auth.role() = 'authenticated'
    );

  create policy "Permitir atualização de usuários autenticados"
    on storage.objects for update
    using (
      auth.role() = 'authenticated'
    )
    with check (
      auth.role() = 'authenticated'
    );

  create policy "Permitir deleção de usuários autenticados"
    on storage.objects for delete
    using (
      auth.role() = 'authenticated'
    );
end;
$$ language plpgsql security definer; 