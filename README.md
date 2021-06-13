# Via API
 Este projeto usa como base o [My Whats](https://github.com/AlanMartines/mywhats-api-node), que por sua vez é um fork do projeto [myzap](https://github.com/billbarsch/myzap "myzap") do [@billbarsch](https://github.com/billbarsch "@billbarsch").

Ele tem por motor o [Venom-bot](https://github.com/orkestral/venom "Venom-bot"), um navegador virtual sem interface gráfica que abre o whatsapp web e executa todos os comandos via código possibilitando assim a automação de todas as funções.


## Dependências
```bash
$ sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget build-essential apt-transport-https libgbm-dev mongodb
```
<br>
Node 12<br>
Mongodb
<br>


## Detalhes da instalação <br>

Criar o banco de dados com o dump da pasta db <br>
Modificar os dados de conexão no arquivo confs/db.js <br>
Ajustar o endereço do endpoint em base_url no arquivo confs/api.js <br><br>

#### Iniciar sessão whatsapp (POST method)
```node
router.post("/Start", (req, res, next) => {
  const response = await fetch('http://localhost:9000/sistem/Start', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
        {
            sessionName: req.body.SessionName
        }
    )
  });
  const content = await response.json();
  return content;
});
```

####  Exibir QR-Code no navegador (POST method)
```node
router.post("/QRCode", (req, res, next) => {
  const response = await fetch('http://localhost:9000/sistem/QRCode', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
        {
            sessionName: req.body.SessionName,
            View: "true"
        }
    )
  });
  const content = await response.json();
  return content;
});
```

####  Retorna json com (base64) do QR-Code (POST method)
```node
router.post("/QRCode", (req, res, next) => {
  const response = await fetch('http://localhost:9000/sistem/QRCode', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
        {
            sessionName: req.body.SessionName,
            View: "false"
        }
    )
  });
  const content = await response.json();
  return content;
});
```

#### Fecha sessão whatsapp (POST method)
```node
router.post("/Close", (req, res, next) => {
  const response = await fetch('http://localhost:9000/sistem/Close', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
        {
            sessionName: req.body.SessionName
        }
    )
  });
  const content = await response.json();
  return content;
});
```

## Em desenvolvimento
Este projeto se encontra em desenvolvimento, então pode (pode? contém erros!) conter erros.



# Bug conhecido

Perde a sessão do usuário com o tempo, impossibilitando o uso e a leitura de um novo QR, para isso é preciso remover o arquivo de sessão.

## License

This file is part of Via API.

MIT License

Copyright (c) 2018 Thai Pangsakulyanont

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
