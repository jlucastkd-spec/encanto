# Encanto de Brownie — site "Chocolate Experience"

Site estático (HTML + CSS + JavaScript puro, sem build e sem dependências).
Basta abrir `index.html` ou publicar a pasta em qualquer hospedagem estática
(Vercel, Netlify, GitHub Pages, Hostinger etc.).

```
index.html        estrutura das seções
js/pedidos.js     carrinho e envio de pedidos pelo site
painel/           painel do dono (app instalável no celular, com notificações)
api/              servidor dos pedidos (funções da Vercel)
lib/              regras dos pedidos, armazenamento e notificações
css/style.css     identidade visual, layout e animações
js/config.js      ← ÚNICO arquivo a editar: contatos, fotos e produtos
js/main.js        interações (cursor, parallax, partículas, vitrine, rolagem)
assets/logo.png   logo da marca (recortado do arquivo enviado)
assets/fotos/     fotos de destaque (hero, textura, marca)
assets/produtos/  fotos dos produtos
```

## Colocando os dados reais

1. **Contato** — em `js/config.js`, preencha `contato.whatsapp` (ex.: `5511999998888`),
   `instagram`, `email`, `cidade`, `horario`. O que ficar vazio não aparece.
   Com WhatsApp preenchido, todos os botões de pedido abrem a conversa com uma
   mensagem pronta (e "Quero experimentar" já cita o nome do produto).
2. **Fotos de destaque** — salve em `assets/fotos/` e informe em `fotos.hero`,
   `fotos.textura` e `fotos.marca`. Enquanto estiverem `null`, aparece uma
   ilustração marcada como **"Foto provisória"**.
   Sugestão: hero vertical ~1200×1500, textura horizontal ~2000×1300 (close bem
   próximo do brownie), marca vertical ~1000×1300. Use JPG/WebP com ~200–400 KB.
3. **Produtos** — adicione objetos em `produtos: [...]` (modelo comentado no arquivo).
   - Categorias, busca e filtros são criados automaticamente a partir do catálogo
     (a busca só aparece com 6+ produtos — ajuste em `minimoParaFiltros`).
   - `preco`, `descricao` e `disponivel` só aparecem quando preenchidos.
   - `destaque: true` deixa o card maior na grade editorial.
4. **Antes de publicar** — defina `modoDesenvolvimento: false`. Assim os cards de
   exemplo nunca vão ao ar; sem produtos cadastrados, o site mostra um aviso
   elegante de "cardápio em breve".

## Acessibilidade e desempenho

- `prefers-reduced-motion` desliga parallax, partículas, cursor e animações longas.
- Cursor personalizado e botões magnéticos só em dispositivos com mouse; o cursor
  nativo volta sobre campos de texto.
- Partículas em canvas pausam quando o hero sai da tela; imagens com `loading="lazy"`.
- Navegação por teclado, link "pular para o conteúdo" e menu móvel com `Esc`.

---

# Sistema de pedidos

O cliente escolhe os sabores, preenche nome, telefone e entrega ou retirada, e
envia o pedido pelo próprio site. O pedido fica salvo no servidor e o dono recebe
uma **notificação no celular** na hora. Não usa WhatsApp nem Telegram.

- **Cliente:** recebe um código (ex.: `#H3VS`) e acompanha o status pelo site
  (Recebido → Confirmado → Em preparo → Pronto → Concluído).
- **Dono:** usa o painel em `seusite.com/painel/`, que pode ser instalado como app.
  Lá ele vê os pedidos, liga ou chama o cliente e muda o status com um toque.
- **Segurança:** os preços são conferidos no servidor a partir do `js/config.js`
  (ninguém altera valor pelo navegador). O painel é protegido por senha e os
  pedidos ficam em armazenamento privado. Há proteção básica contra robôs e excesso de envios.

## Colocar no ar (Vercel, plano gratuito)

1. Crie uma conta em vercel.com e envie esta pasta como um projeto
   (pelo GitHub ou com `npx vercel` dentro da pasta).
2. No projeto: **Storage → Create → Blob** e conecte ao projeto. Isso cria
   sozinho a variável `BLOB_READ_WRITE_TOKEN`. Se aparecer a opção de acesso,
   escolha **Private**.
3. No computador, dentro da pasta, rode `npm install` e depois `npm run chaves`.
   Copie as variáveis exibidas (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT`, `PAINEL_SENHA`) para **Settings → Environment Variables**.
   Guarde a senha do painel.
4. Faça um novo deploy (Deployments → Redeploy).

## Configurar o celular do dono

1. Abra `https://seusite.com/painel/` e entre com a senha.
2. Instale o painel como app:
   - **Android (Chrome):** menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
   - **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*, e abra pelo
     ícone criado (no iPhone as notificações só funcionam assim, iOS 16.4+).
3. No painel, toque em ⋮ → **Ativar neste aparelho** → permita as notificações →
   **Enviar teste**. Pode ativar em mais de um celular.

## Antes de lançar

- Cadastre os produtos reais em `js/config.js`, **cada um com um `id` único**.
- Coloque `modoDesenvolvimento: false`. Em desenvolvimento, os cards de exemplo
  podem ser pedidos e chegam marcados como **TESTE** no painel.
- Para desligar os pedidos pelo site e voltar ao WhatsApp: `pedidos.ativo: false`.

## Testar no computador

```
npm install
npm run chaves      # copie as linhas para um arquivo .env (veja .env.example)
npm run dev         # site em http://localhost:3000 · painel em /painel/
```
Sem a Vercel, os pedidos ficam na pasta `.dados/`.
