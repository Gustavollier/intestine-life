# Sincronizar Projeto com GitHub

## Objetivo
Exportar o código completo do Intestine Life para um repositório GitHub e habilitar sincronização bidirecional.

## Tipo de integração
Usar o **Git sync** do Lovable (não o connector da API do GitHub). Isso cria um repositório no GitHub com todo o código do projeto e mantém alterações sincronizadas nos dois sentidos.

## Passos

1. **Abrir o menu de conexão**
   - No editor do Lovable, clicar no botão **Plus (+)** no canto inferior esquerdo do chat.
   - Selecionar **GitHub → Connect project**.

2. **Autorizar o Lovable GitHub App**
   - Na tela de autorização do GitHub, permitir que o app da Lovable acesse a conta/organização desejada.

3. **Escolher conta/organização**
   - Selecionar a conta pessoal ou organização onde o repositório será criado.

4. **Criar o repositório**
   - Clicar em **Create Repository** no Lovable.
   - O repositório será criado já com o código atual do projeto.

5. **Confirmar sincronização**
   - Verificar no GitHub se o repositório foi criado e se os arquivos estão lá.
   - A partir daí, alterações no Lovable são enviadas automaticamente para o GitHub e vice-versa.

## Observações
- Não é possível importar um repositório GitHub existente diretamente para o Lovable. A conexão cria um repositório novo.
- Dados do banco não são exportados com o código; eles precisam ser exportados separadamente em Cloud → Advanced settings → Export data, se necessário.
- Caso prefira não conectar, o código pode ser baixado manualmente via Code Editor → Download codebase (plano pago) ou pelo repositório após a conexão.
