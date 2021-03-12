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

Via API is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

Via API is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with Via API. If not, see https://www.gnu.org/licenses/.
