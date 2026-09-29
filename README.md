# Di Vino — Loja Virtual (Projeto P1)

Frontend de loja virtual de vinhos desenvolvido em **Angular** (standalone components) + **Bootstrap 5**, seguindo o mockup fornecido em aula.

## Telas implementadas

| Wireframe        | Rota            | Componente               |
|-------------------|-----------------|---------------------------|
| Vitrine            | `/`             | `pages/vitrine`           |
| Cadastro / Login   | `/login`        | `pages/login-cadastro`    |
| Esqueci a senha    | `/esqueci-senha`| `pages/esqueci-senha`     |
| Detalhe do produto | `/produto/:id`  | `pages/detalhe`           |
| Cesta (carrinho)   | `/cesta`        | `pages/cesta`             |
| Busca              | `/busca?q=...`  | `pages/busca`             |

## Funcionalidades

- Formulários reativos (`ReactiveFormsModule`) com validação: campos obrigatórios, e-mail, senha mínima, confirmação de senha, CPF e telefone com padrão (regex).
- CSS responsivo com Bootstrap 5 (grid, breakpoints) — testado em mobile, tablet e desktop.
- Carrinho de compras reativo usando Angular Signals (`CarrinhoService`), com adicionar, remover, alterar quantidade e cálculo automático do total.
- Busca de produtos por nome, tipo, país ou uva.
- Filtro por categoria (tinto, branco, rosé, espumante) a partir do menu.
- Identidade visual própria (paleta bordô/dourado, tipografia Playfair Display + Inter).

## Como rodar

```bash
npm install
npm start
```

A aplicação abre em `http://localhost:4200`.

## Build de produção

```bash
npm run build
```

Os arquivos finais ficam em `dist/vinho-loja/`.

## Estrutura

```
src/app/
  models/produto.ts          -> interface do produto
  services/produto.service.ts -> dados mockados dos vinhos
  services/carrinho.service.ts-> lógica da cesta (signals)
  services/auth.service.ts    -> login/cadastro simulados
  shared/header/              -> cabeçalho reutilizável (logo, busca, cadastro, cesta)
  pages/                      -> as 6 telas do mockup
```

## Observações

- Não há backend: os dados dos vinhos são mockados no `ProdutoService` e o login/cadastro são simulados no `AuthService`, apenas para fins de front-end (conforme escopo do projeto P1).
- As fotos dos produtos usam um serviço de placeholder (picsum.photos) — podem ser substituídas por imagens reais dos vinhos.
