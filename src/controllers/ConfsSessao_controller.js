'use strict'
const confs = require('../models/ConfsSessao_model');


exports.get = async function(filter){

    
    var result = await confs.get(filter).then( async function(dados){

        return dados;
    });

    return result    

}
