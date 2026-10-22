# ReciclaPlus — Landing page

Página de apresentação do [ReciclaPlus](https://github.com/MaxRbrt/ReciclaPlus), um aplicativo para encontrar, cadastrar e compartilhar pontos de coleta de materiais recicláveis.

## Executar

Requer Node.js 22.12 ou superior.

```sh
npm install
npm run dev
```

Abra o endereço exibido no terminal. Para gerar e conferir a versão final:

```sh
npm run build
npm run preview
```

A pasta `dist/` contém os arquivos estáticos para hospedagem. O build usa caminhos relativos para permitir publicação em subdiretórios. A página precisa ser servida por HTTP; abrir o HTML diretamente pelo explorador de arquivos não executa os módulos.

## Publicar no GitHub Pages

O workflow fica em `.github/workflows/publicar-landing.yml`, na raiz do repositório.
Ele instala as dependências de `landing/`, gera o build e publica somente `landing/dist/`.

1. No repositório do GitHub, abra **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Envie as alterações para a branch `main`. Mudanças em `landing/` ou no workflow
   iniciam a publicação automaticamente.
4. Acompanhe em **Actions → Publicar landing no GitHub Pages**. Para publicar
   manualmente, use **Run workflow** com a branch `main`.

Após a primeira publicação bem-sucedida, a landing estará em
[maxrbrt.github.io/ReciclaPlus/](https://maxrbrt.github.io/ReciclaPlus/).

## Estrutura

- `index.html`: conteúdo, navegação, telas do aplicativo, tour do app, separação animada e perguntas frequentes.
- `src/estilos.css`: tokens, identidade visual, telas do aplicativo e adaptação para celulares e tablets.
- `src/principal.js`: carrega fontes e estilos, inicia os módulos e cuida do ciclo de vida da página.
- `src/interacoes.js`: menu, materiais, filtro do mapa, troca de telas, passeio da maquete e legenda das lixeiras.
- `src/animacoes.js`: animações GSAP com ScrollTrigger (abertura, telas fixas, máscaras, imagem que expande, parallax e botões magnéticos).
- `src/cenario.js`: cena Three.js da abertura, com roteiro de câmera ligado à rolagem (visão geral, giro, paradas nas lixeiras com rota tracejada e vista de cima), construção dos prédios, pausa fora da tela e descarte de recursos.
- `src/maquete3d.js`: cidade com prédios do City Kit da Kenney, asfalto com faixas, calçadas, praças, árvores instanciadas, ecopontos com 4 lixeiras e lixeiras avulsas para as demais categorias.
- `public/modelos/cidade/`: modelos `.glb` e textura do City Kit Commercial (Kenney, CC0); a licença está em `LICENCA-KENNEY.txt`.
- `public/imagens/`: fotos da abertura, materiais, comunidade e broto; capturas das telas do app (`app-*.webp`). `coleta.webp` aparece na tela de detalhe do ponto.
- `public/favicon.svg`: ícone da página.

## Sistema visual

Página de produto com a estrutura das páginas da Apple (uma ideia por tela, títulos grandes, frase em negrito seguida de continuação em cinza) e as cores da coleta seletiva. Cada seção tem uma cor: verde-floresta do app em "Como funciona", azul em "Explore o app", amarelo nos números, vermelho na separação, laranja nos benefícios, marrom na renovação e verde-névoa nas perguntas. Em "Materiais", o fundo acompanha o material escolhido. O fundo base é o verde-claro do app (`#EFF6EC`). Nenhum fundo fica liso: todos levam um padrão de folhas, mini lixeiras e setas de reciclagem (`--padrao-claro` e `--padrao-escuro`) e as seções escuras usam as formas orgânicas do app.

Os tokens ficam no `:root` de `src/estilos.css`: `--rec-*` para as cores da coleta e `--cat-*` para as cores do app, usadas só nas telas do aplicativo. Títulos em Inter; as telas do app usam Fredoka e Nunito, como no app, montadas em 390 px e reduzidas por escala.

Movimento: entradas com `power3.out`, transições de 200 a 900 ms e cenas ligadas à rolagem. A abertura passeia pela maquete e muda a cor da página a cada lixeira; "Como funciona" e "Explore o app" ficam fixos enquanto as telas trocam; a foto de materiais abre em círculo; a foto da comunidade cresce até ocupar a tela.

## Comportamento

Na abertura, a rolagem dissolve a foto da floresta e ergue a cidade. A câmera dá meia volta, mergulha nas lixeiras azul (papel), vermelha (plástico), verde (vidro) e amarela (metal), desenhando a rota até cada uma, e termina numa vista de cima com a legenda das 9 categorias. A cor da página acompanha cada parada. As lixeiras mostram a categoria ao passar o cursor ou tocar. Com movimento reduzido ou sem WebGL, a maquete não carrega e a página mostra a foto e a legenda.

Em "Explore o app", cada tela entra sozinha, grande, com destaques ligados por linhas a partes da interface. Em telas menores, as telas aparecem em sequência, com os destaques em lista.

Em "Como funciona", as etapas trocam a tela do celular entre Mapa, Detalhe do ponto e Comunidade. Em telas a partir de 961 × 720 px, sem preferência por movimento reduzido, a rolagem conduz a sequência; os botões das etapas funcionam sempre, inclusive pelo teclado.

As telas do celular e as capturas do carrossel foram reconstruídas a partir das rotas e componentes do aplicativo. São prévias, não capturas de uma sessão real: pessoas, locais, distâncias e totais são ilustrativos.

O filtro da tela Mapa altera os pinos demonstrativos. A seleção de materiais mostra orientações gerais de preparo e a cor da categoria no app. Em "Cada coisa no seu lugar", a rolagem leva cada item até a lixeira certa: a tampa abre, o item cai e o contador sobe. Com movimento reduzido, a seção fica parada. A página não se conecta à API, não solicita localização e não armazena dados pessoais.

Os botões de acesso levam ao repositório e às instruções de execução do app. Para divulgar uma versão publicada, substitua os destinos quando houver URLs oficiais de acesso ou download.

As fontes Inter, Fredoka e Nunito são servidas localmente. A cena 3D pausa quando a abertura sai da tela ou a aba fica oculta. Ela é carregada em um módulo separado; o build pode avisar que esse arquivo ultrapassa 500 KB antes da compressão.

## Padrões de código

Identificadores internos em português. Funções com uma responsabilidade. Comentários somente em caixas de seção acima de funções e blocos, nunca dentro do corpo das funções.

Prettier configurado com dois espaços, ponto e vírgula, aspas simples e largura de 100 colunas. Para conferir a formatação:

```sh
npm run format:check
```

Para formatar alterações, passe ao Prettier apenas os arquivos editados:

```sh
npx prettier --write src/principal.js src/estilos.css
```

## Referências

- [Projeto ReciclaPlus](https://github.com/MaxRbrt/ReciclaPlus)
- [City Kit Commercial, Kenney (CC0)](https://kenney.nl/assets/city-kit-commercial)
- [GSAP matchMedia](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [GSAP Draggable](https://gsap.com/docs/v3/Plugins/Draggable/)
- [Three.js](https://threejs.org/docs/)
