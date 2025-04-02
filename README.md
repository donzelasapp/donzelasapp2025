# Donzelas App

## Padrões de Desenvolvimento

### Storage Buckets
Os nomes dos buckets do Supabase Storage são definidos como constantes em `src/lib/constants.ts`.
Sempre use estas constantes ao invés de strings literais para garantir consistência.
O nome do bucket de fotos de perfil é fixo como 'profile-photos' e não deve ser alterado. 