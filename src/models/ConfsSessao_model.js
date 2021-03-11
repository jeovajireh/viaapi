const modAutor = require('./Mongo_model');

/* add */
exports.post = async function(req, res){

    var params = req.body;

  //  console.log(params); return;


    var Autoresp = new modAutor(params);

    Autoresp.save().then( x => {

        res.status(200).send({"retorno":"Registro inserido com êxito."});

    }).catch( e => {
        
        /* tratar erro ao gravar no banco */
        res.status(400).send({"retorno":"Erro ao adicionar o registro.","erro":e});

    });
       

}

/* listar item */
exports.get = async (req,res, next) => {

    var params = req;    

    /* obrigar a pesquisa ser realizada por instancia */
  /*  if(params.nome == undefined){
        return {"retorno":false,"erro":"Obrigatório informar o campos Instãncia, para a pesquisa."};
    } */ 
    return new Promise((resolve, reject)=>{
            
            modAutor.find(params,'nome email saldo client_id data_cadastro webhooks ativo').then( async dados => {
                
                resolve(dados);

            }).catch( e => {
                
                /* tratar erro ao gravar no banco */
                reject({retorno:e});

            });
    });
    

}

/* update */
exports.update = (req, res, next) => {

    var params = req.body;

    modAutor.findByIdAndUpdate(req.params.id,{

        $set: {
            'pchaves': params.pchaves,
            'mensagem':params.mensagem,
            'status': params.status,
            'arquivo':params.arquivo
        } /* bbjeto contendo os dados */

    }).then( rs => {

        res.status(200).send({"retorno":true});

    }).catch( e => {
        
        /* tratar erro ao gravar no banco */
        res.status(400).send({"retorno":false,"erro":e});

    });


}

/* update por parametro adverso */
exports.updateWhere = (req, res, next) => {

    var params = req.body;

   
                /* Exemplo = object params:{id_ext:'1009'} */
    modAutor.update(params.where,{

        $set: {
            'pchaves': params.pchaves,
            'mensagem':params.mensagem,
            'status': params.status,
            'arquivo':params.arquivo
        } /* bbjeto contendo os dados */

    }).then( rs => {

        res.status(200).send({"retorno":true});

    }).catch( e => {
        
        /* tratar erro ao gravar no banco */
        res.status(400).send({"retorno":false,"erro":e});

    });


}

/* remove */
exports.remove = (req, res, next) => {

    var params = req.body;

    modAutor.findOneAndRemove(req.params.id).then( rs => {

        res.status(200).send({"retorno":true});

    }).catch( e => {
        
        /* tratar erro ao gravar no banco */
        res.status(400).send({"retorno":false,"erro":e});

    });


}

/* remove por parametro adverso */
exports.removeWhere = (req, res, next) => {

    var params = req.body;

    modAutor.findOneAndRemove(req.params.where).then( rs => {

        res.status(200).send({"retorno":true});

    }).catch( e => {
        
        /* tratar erro ao gravar no banco */
        res.status(400).send({"retorno":false,"erro":e});

    });


}