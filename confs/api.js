'use strict'
const confsDB = require('../src/controllers/ConfsSessao_controller');

/* ex.: endpoint:  http://localhost/mywhats-api/endpoints/message.php */

//const base_url = "https://webhook.site/ef01c564-7cea-4b81-bfec-8a9c9abd8f76";

const base_url = "https://MUDAR.requestcatcher.com/";

const token = "NQfhAnM58ThYybXV119BYrLP";

/* consultar no banco de dados do cliente o webhook retorno */



const config = {
    "SEND_HTTPS":true,
    "ENDPOINTS":{
        "mensagem":{
            "ativo":true,
            "url":{
            "link": base_url + "/retorno.php",
//             "link": base_url + "/",
                "autenticar":false,
                "token":token
            }
        },
        "perfil_data":{
            "ativo":true,
            "url":{
            "link": base_url + "/retorno.php",
//             "link": base_url + "/",
                "autenticar":false,
                "token":token
            }
        },
        "add_contato":{
            "ativo":false,
            "url":{
                "link": base_url + "/api/v1/accounts/1/contacts",
                "autenticar":true,
                "token": token
            }
        }
    }

}



module.exports = config;
