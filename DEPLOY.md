# Guia de Deploy - API Poke (Ubuntu VPS)

Este guia detalha os passos necessários para realizar o deploy do backend NestJS com Prisma em uma VPS rodando Ubuntu.

## 1. Atualizar Pacotes do Sistema

Acesse sua VPS via SSH e atualize os pacotes do sistema:

```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Instalar Node.js e NPM

O projeto possui pacotes e tipagens recomendados para Node.js 22.

```bash
# Instalar curl caso não tenha
sudo apt install curl -y

# Baixar o setup do repositório NodeSource (Node.js 22.x)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Instalar Node.js (já inclui o utilitário npm)
sudo apt install -y nodejs

# Verificar instalações
node -v
npm -v
```

## 3. Instalar PM2 Globalmente

O PM2 vai atuar como o gerenciador de processos para manter o app vivo em backgroud e gerenciar as reinicializações.

```bash
sudo npm install -g pm2
```

## 4. Clonar o Projeto e Instalar Dependências

No seu servidor VPS, desça o código pra uma pasta de sua escolha (ex: `/var/www/backpoke`). 

```bash
# Entrar no diretório de destino
cd /var/www

# Clonar o repositório 
# (Se for um repositório privado, as chaves SSH do GitHub precisarão ser criadas e cadastradas no servidor)
git clone https://github.com/Adrianhenrrique/pokevic backpoke
cd backpoke

# Instalar dependências da API
npm install
```

## 5. Configurar Variáveis de Ambiente

Crie o arquivo contendo todas as chaves privadas do ambiente local do projeto e não expostos no github.

```bash
nano .env
```

Insira as configurações (Ajuste o host/senha de banco de dados conforme as chaves da VPS):

```env
# Configurações do Banco de Dados
DATABASE_URL="postgresql://usuario_bd:senha_bd@localhost:5432/pokevic_db?schema=public"

# Configurações da API NestJS
PORT=4000
NODE_ENV=production
```
*(Para salvar no nano em um servidor Ubuntu: `Ctrl + O`, `Enter` para confirmar nome do arquivo, e `Ctrl + X` para sair).*

## 6. Configurar e Rodar o Prisma

Com banco definido e variáveis locais lidas, prepare o cliente Prisma e rode as migrações:

```bash
# Transpilar a CLI do prisma e mapear os schema models
npx prisma generate

# Aplicar em produção as migrações já existentes sem dropar dados
npx prisma migrate deploy
```

> **Atenção:** Seu gerenciador de dados como PostgreSQL já precisa estar configurado em um host e ligado para a porta 5432 e batendo com a chave `DATABASE_URL` recém configurada no .env.

## 7. Compilar e Executar a API com PM2

```bash
# Building NestJS application
npm run build
```
Depois da build (criação da pasta `/dist/`), inicialize a aplicação Nest:
```bash
# Executar a aplicação dando o nome "apipoke" na listagem
pm2 start dist/main.js --name "apipoke"

# Para garantir que inicie após falhas de luz ou reinicios na VPS:
pm2 startup
# (Ao rodar esse commando, um script em shell será sugerido para copiar e colar na sua CLI)

# Salvar o estado em lista do PM2
pm2 save
```

## 8. Configurar Nginx como Proxy Reverso

Instale o Nginx:

```bash
sudo apt install nginx -y
```

Abra a pasta de sites disponíveis e crie um proxy novo de configuração local:

```bash
sudo nano /etc/nginx/sites-available/apipoke
```

Cole este bloco, direcionando as requisições vindo da internet (Porta HTTP 80) para a sua API interna na Porta 4000:

```nginx
server {
    listen 80;
    server_name apipoke.thunderbot.com.br;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Habilite o config recém criado em "sites-enabled" e reinicie o nginx webserver:

```bash
sudo ln -s /etc/nginx/sites-available/apipoke /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 9. Configurar Firewall Portas (UFW)

Para garantir segurança, nós evitamos conflitos e abrimos as passagens no firewall das portas web e do serviço da API.

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 4000/tcp  # Opcional, libera acesso direto sem a URL do Nginx
sudo ufw allow 4001/tcp  # Exemplo caso tenha outros serviços rodando
sudo ufw enable
sudo ufw status
```

Com todos os passos configurados será possível acessar a URL da API em `http://apipoke.thunderbot.com.br`. 
*(Observação: Recomenda-se utilizar "certbot" da LetsEncrypt para assinar um SSL posteriormente para fornecer navegação segura rodando HTTPS)*.
