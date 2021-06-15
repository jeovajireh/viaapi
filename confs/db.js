'use strict' 
var qs = require('querystring');
/* link painel do db online: https://cloud.mongodb.com/v2/ */
var credencials = {
        "host":"cluster0.oktlk.mongodb.net",
        "porta":"27017",
        "user":"joao",
        "passwd": "pUW8rr2v9xgEBfJ",
        "db":"api"
}

var config = {

        'uriExterno': 'mongodb+srv://'+ credencials.user +':' + qs.escape(credencials.passwd) + '@'+ credencials.host +'/'+ credencials.db +'?retryWrites=true&w=majority',
        'uriLocal':'mongodb://localhost:'+ credencials.porta +'/'+credencials.db               
};

module.exports = config
