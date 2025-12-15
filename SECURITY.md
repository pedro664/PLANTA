**Segurança e gestão de segredos**

Este repositório foi preparado para reduzir o risco de vazamento de segredos antes de ser enviado ao controle de versão ou ao serviço de build.

O que foi feito
- Arquivo `.env` sensível foi limpo: chaves como `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` foram removidas.
- `.gitignore` atualizado para ignorar `.env` e `.env.*` (exceto `.env.example`).
- Script `scripts/strip-secrets.js` criado para gerar `.env.clean` sem as chaves sensíveis.

Instruções rápidas
1. Restaurar localmente (se necessário)
   - Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` ou `DATABASE_URL` no repositório.
   - Para desenvolvimento local, crie um arquivo `.env.local` (ou use seu gerenciador de segredos) com:
     - `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
     - `DATABASE_URL=postgresql://user:pass@host:5432/dbname`

2. Para builds no EAS/CI
   - Configure secrets via o serviço (EAS secrets, GitHub Actions secrets, etc.).
   - Exemplo EAS (no host):
     - `eas secret:create --name SUPABASE_SERVICE_ROLE_KEY --value <value>`
     - `eas secret:create --name DATABASE_URL --value <value>`

3. Para limpar rapidamente antes de commitar/compartilhar
   - Rode `node scripts/strip-secrets.js` para gerar `.env.clean` sem as chaves sensíveis.

Recomendações
- Rotacione qualquer chave que possa ter sido exposta (especialmente `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL`).
- Use apenas chaves públicas (anon key) no cliente; mantenha chaves de serviço em servidores/CI.
- Use um gerenciador de segredos para produção (HashiCorp Vault, AWS Secrets Manager, EAS secrets, GitHub Secrets).

Se quiser, eu posso:
- Comitar essas mudanças (se aprovar),
- Criar um script `prepare-release` que substitui `.env` pelo `.env.clean` automaticamente antes do build,
- Ajudar a configurar os secrets no EAS/GitHub Actions.
