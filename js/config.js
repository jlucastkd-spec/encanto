/* ==========================================================================
   ENCANTO DE BROWNIE — CONFIGURAÇÃO DO SITE
   --------------------------------------------------------------------------
   Este é o ÚNICO arquivo que você precisa editar para colocar o site no ar
   com os dados reais da doceria. Nenhuma informação comercial foi inventada:
   tudo o que estiver vazio ("") ou null simplesmente não aparece no site.
   ========================================================================== */

window.ENCANTO_CONFIG = {

  /* ------------------------------------------------------------------------
     MODO DE DESENVOLVIMENTO
     true  → mostra cards de EXEMPLO (claramente marcados) quando ainda não
             houver produtos cadastrados, para visualizar o layout.
     false → em produção. Sem produtos, o site mostra um aviso elegante
             de "cardápio em breve" — nunca produtos de mentira.
     ⚠️  Antes de publicar, deixe SEMPRE como false.
     ------------------------------------------------------------------------ */
  modoDesenvolvimento: true,

  /* ------------------------------------------------------------------------
     CONTATO E PEDIDOS
     whatsapp: somente números, com DDI + DDD. Ex.: "5511999998888"
     Se ficar vazio, os botões de pedido levam para a seção de contato.
     ------------------------------------------------------------------------ */
  contato: {
    whatsapp: "",
    mensagemPadrao: "Olá! Vim pelo site da Encanto de Brownie e gostaria de fazer um pedido.",
    instagram: "",          // apenas o usuário, sem @. Ex.: "encantodebrownie"
    email: "",
    cidade: "",             // Ex.: "São Paulo — SP" (só aparece se preenchido)
    horario: "",            // Ex.: "Seg a Sáb, 9h às 19h"
  },

  /* ------------------------------------------------------------------------
     PEDIDOS PELO SITE (chegam no Telegram do dono)
     ativo: true  → "Quero experimentar" adiciona ao carrinho e o cliente
                    envia o pedido por um formulário no próprio site.
     ativo: false → os botões levam para o WhatsApp (se preenchido).
     O envio só funciona com o site publicado na Vercel e com as variáveis
     TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID configuradas (veja o README).
     ------------------------------------------------------------------------ */
  pedidos: {
    ativo: true,
    endpoint: "/api/pedido",
    permitirEntrega: true,
    permitirRetirada: true,
    avisoEntrega: "",       // Ex.: "Entregamos apenas na região central." (opcional)
  },

  /* ------------------------------------------------------------------------
     FOTOGRAFIAS DE DESTAQUE
     Coloque os arquivos em assets/fotos/ e informe o caminho.
     Enquanto estiver null, o site exibe uma ilustração provisória
     identificada como "Foto provisória".
     ------------------------------------------------------------------------ */
  fotos: {
    hero: null,             // Ex.: "assets/fotos/hero-brownie.jpg"  (vertical, ~1200x1500)
    textura: null,          // Ex.: "assets/fotos/textura.jpg"        (horizontal, ~2000x1300)
    marca: null,            // Ex.: "assets/fotos/momento.jpg"        (vertical, ~1000x1300)
  },

  /* ------------------------------------------------------------------------
     CATÁLOGO DE PRODUTOS
     Adicione um objeto por produto. Apenas "nome" e "foto" são essenciais.
     Campos opcionais que ficarem vazios NÃO aparecem no card.

     {
       id: "brownie-tradicional",        // único, sem espaços
       nome: "Nome do produto",
       categoria: "Brownies",            // as categorias do filtro são criadas
                                         // automaticamente a partir daqui
       descricao: "",                    // opcional
       preco: null,                      // número (ex.: 12.5) ou null
       unidade: "",                      // opcional. Ex.: "unidade", "caixa c/ 6"
       foto: "assets/produtos/arquivo.jpg",
       disponivel: null,                 // true, false ou null (= não exibir)
       destaque: false,                  // true deixa o card maior na grade
     }
     ------------------------------------------------------------------------ */
  produtos: [
    // Ainda sem produtos reais cadastrados.
  ],

  /* A busca e os filtros só aparecem a partir desta quantidade de produtos. */
  minimoParaFiltros: 6,
};
