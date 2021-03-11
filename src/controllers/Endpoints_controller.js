'use strict'
var request = require('request');
var axios = require('axios');
var qs = require('qs');



const confApi = require('../../confs/api');
const confsDB = require('./ConfsSessao_controller');


// RBS Ricardo envio de arquivo

exports.send_postAudio = async function (dadosaudio,sessao, type) {

  var remote = await confsDB.get({"client_id":sessao});
  var url_ = undefined;

  if(remote.length == 0){
    console.log("👉👉cliente não possui dados na tabela usuarios.");
    return { "result": false, "erro":"cliente não possui dados na tabela usuarios." };
  }

  if (type == "arquivo") {
    //postConf = confApi.ENDPOINTS.mensagem;
    url_ = remote[0].webhooks;

  } else {
    console.log("Tipo de arquivo tratado nesta função.")
    return { "result": false };
  }

  console.log(remote[0].webhooks);

  if (url_ == undefined || url_ == "") {
    return;
  }

  /* verificar configuração para envio para url HTTPS OU HTTP */
  if(confApi.SEND_HTTPS == false){
    url_ = url_.replace("https:", "http:");
  }

  var config = {
    method: 'post',
    url: url_,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': 'laravel_session=04RhGmoEK36zJnUUbAGQVdPyBcc6OZH9i1tKiAuS'
    },
    data: dadosaudio
  };

  //console.log(config);

  await axios(config)
    .then(function (response) {
      console.log("---------------------------");
    //  console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });

}

// End




/* enviar um post para php */
exports.send_post = async function (params,sessao, type) {

  console.log("dados da sessao:", sessao)
  
  var remote = await confsDB.get({"client_id":sessao});
  var url_ = undefined;
  var autenticar = false;
  var postConf = undefined;
  console.log("Dados do endpoint para envio de mensagem:")
//  console.log(remote);

  if(remote.length == 0){
    return { "result": false, "erro":"cliente não possui dados na tabela usuarios." };
  }

  

  if (type == "add_contact") {

    postConf = confApi.ENDPOINTS.add_contato;
    url_ = postConf.url.link;
    /* verificar se precisa de autenticação */
    autenticar = postConf.autenticar;
    
  }else if(type == "message") {

    postConf = confApi.ENDPOINTS.mensagem;
    url_ = remote[0].webhooks; /* link do banco de dados usuaros (remoto) */

  }else if(type == "perfil"){
  
    postConf = confApi.ENDPOINTS.perfil_data;
    url_ = postConf.url.link;
  
  }  else {
    return { "result": false };
  }

  
  //console.log(params);
  if (url_ == undefined || url_ == "") {
    return;
  }
 

  var auth = "";
  var header = { 
    'Content-Type': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  if (autenticar == true) {

    //  auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
    auth = { 'api_access_token': postConf.url.token };
    header.push(auth);

  }

   /* verificar configuração para envio para url HTTPS OU HTTP */
  if(confApi.SEND_HTTPS == false){
    url_ = url_.replace("https:", "http:");
  }


  return new Promise(async (resolve, reject) => {

    var options = {
      'method': 'POST',
      'url': url_,
      'headers': header,
      body: JSON.stringify(params)
    };

   console.log(options);

    request(options, function (error, response, body) {
      if (error) {
        console.log("Ocorreu um erro : 👉🏻👉🏻" + error);
        reject({ "result": false, "info": error });
        return;

      };
      console.log("Retorno do endpoint: 👉🏻👉🏻" + body.substr(1, 50) + "...")
      resolve({ "result": true, "info": body.substr(1, 500) });
    });


  });

}

/* consultar sessao no banco de dados mongoDB */
exports.getSessionDB = async function(sessao){
  
  var sessionBD = await confsDB.get({"client_id":sessao});
  var foundSession = false;
  console.log(sessionBD);
  sessionBD.forEach(session => {
      if (sessao == session.client_id) {
          foundSession = true;
      }
  });

  return foundSession;

}

