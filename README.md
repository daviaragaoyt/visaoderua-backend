# visaoderua-backend

API da loja Visão de Rua: catálogo, checkout (PIX e cartão via Mercado Pago) e webhook de pagamento.

Stack: **Express 5 · Prisma · Postgres · Mercado Pago SDK · Zod**.

## Rotas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/products` | Produtos ativos com estoque |
| `POST` | `/api/orders/checkout` | Cria pedido e inicia pagamento. Retorna `orderId`, `orderNumber`, `totalAmount`, `discountAmount`, `amountToCharge`, `paymentResult` |
| `GET` | `/api/orders/:id/status` | Status do pedido (`PENDING`, `PAID`, `CANCELLED`) |
| `POST` | `/api/webhooks/payment` | Webhook do Mercado Pago |

Pagamentos PIX recebem o desconto de `PIX_DISCOUNT_RATE` (5% por padrão); o valor cobrado é `amountToCharge`.

## Rodando localmente

```bash
cp .env.example .env   # preencha DATABASE_URL e MP_ACCESS_TOKEN
npm install
npx prisma db push     # cria as tabelas
npx prisma db seed     # produtos iniciais
npm run dev            # http://localhost:3333
```

Para um Postgres local rápido: `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16` e `DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"`.

## Deploy na Vercel

O banco precisa ser um Postgres hospedado. SQLite em arquivo não funciona: o sistema de arquivos da função é somente leitura, o que causava o erro `Unable to open the database file` em `/api/products`.

1. Crie um banco (Neon tem plano gratuito) e copie a connection string.
2. Na Vercel, em Settings → Environment Variables, defina `DATABASE_URL`, `MP_ACCESS_TOKEN` e, se quiser, `PIX_DISCOUNT_RATE`.
3. Rode uma vez, da sua máquina, apontando para o banco de produção:
   ```bash
   DATABASE_URL="..." npx prisma db push
   DATABASE_URL="..." npx prisma db seed
   ```
4. Faça o redeploy.
5. No painel do Mercado Pago, configure o webhook para `https://<seu-dominio>/api/webhooks/payment` (evento `payment`).
