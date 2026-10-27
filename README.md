# NEX3 Tecnologia · site institucional

Site estático (HTML, CSS e JS, sem build). Logo: opção A · Refinamento.

## Arquivos
- `index.html`, `estilo.css`, `app.js`
- `assets/nex3-simbolo.svg`: símbolo da logo em vetor
- `assets/favicon.svg`, `assets/apple-touch-icon.png`, `assets/og-image.png`

## Publicar
Publicar os arquivos na raiz do mesmo servidor do site atual, mantendo:
- `POST /api/contato`: recebe JSON com `nome`, `email`, `empresa`, `assunto`, `mensagem`,
  `privacidade` ("on") e `website` (anti-robô, deve vir vazio). Em erro, pode responder `{ "erro": "mensagem" }`.
- `/privacidade`: página do Aviso de Privacidade (linkada no formulário e no rodapé).

## Rodar localmente
```
python -m http.server 4175
```
O formulário só envia de verdade no servidor que tem o `/api/contato`.
