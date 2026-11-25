# Coupé Tower · Landing page + CRM

Landing page de alto padrão do **Coupé Tower** (RJZ Cyrela, powered by Porsche Consulting), na Barra da Tijuca, com CRM de leads próprio. As imagens e os textos foram tirados do book do cliente e da ficha técnica.

Corretora: **Carla Jansen** · CRECI 94120 · (21) 98379-9691

## Estrutura
```
index.html            página única
assets/css/style.css  estilos (responsivo)
assets/js/config.js   ⚙️ WhatsApp, corretora, CRECI, Pixel e Google Ads
assets/js/main.js     popup do WhatsApp, formulários, abas, galerias, lightbox
assets/img/           imagens recortadas do book
src/worker.js         Worker: site + API de leads + CRM em /admin
src/admin.html        painel do CRM (pipeline)
src/meta.js           API de Conversões da Meta (opcional)
migrations/           estrutura do banco D1
```

## Captura de leads
Todos os botões de WhatsApp abrem um **popup que pede nome, telefone e e-mail**. Ao enviar:
1. o lead é gravado no CRM (`POST /api/leads`), com a origem (seção e botão clicado), UTMs, gclid e fbclid;
2. o WhatsApp da corretora abre com a mensagem pronta.

O formulário de contato no fim da página segue o mesmo fluxo. O CRM agrupa os leads pelo telefone, então a mesma pessoa não vira dois leads.

## CRM (`/admin`)
- Login padrão **admin / admin**. Para trocar, crie o Secret `CRM_SENHA` (e, se quiser, `CRM_USUARIO`).
- **Pipeline padrão:** Novo lead → Tentando contato → Consegui falar → Marcou visita → Visitou → Fez proposta → Venda fechada / Perdido. Os cards mudam de etapa arrastando.
- Ficha do lead com dados, unidade, valor, visita, próxima ação, motivo de perda, observações, histórico e atalhos de WhatsApp, ligação e e-mail.
- Visão em lista, busca, filtros, exportação CSV e CSV de conversões off-line do Google Ads.
- `LEAD_WEBHOOK_URL` (opcional): envia cada lead em JSON para Make, Zapier, n8n ou Slack.

## Publicar no Cloudflare (Workers)
1. Crie o banco: `npx wrangler d1 create coupe-crm` e cole o `database_id` em `wrangler.jsonc`. O Worker cria as tabelas sozinho.
2. Workers Builds: comando de build `npm run build`, comando de deploy `npx wrangler deploy`.
3. Ajuste o `canonical` em `index.html` e, se quiser, `SITE_URL` em `wrangler.jsonc` para o domínio final.

## Anúncios (opcional)
- **Meta:** preencha `metaPixelId` em `config.js`. Para a API de Conversões (Lead e cada etapa do CRM pelo servidor), preencha também `META_PIXEL_ID` em `wrangler.jsonc` e crie o Secret `META_CAPI_TOKEN`.
- **Google Ads:** preencha `googleAdsId` e `googleAdsLeadLabel` em `config.js`.

Com os campos vazios, nenhuma tag é carregada.

## Testar localmente
```bash
npm run build
npx wrangler dev --local
```
Acesse http://localhost:8787 e http://localhost:8787/admin (admin/admin).
