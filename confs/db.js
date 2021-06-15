'use strict' 
var qs = require('querystring');
/* link painel do db online: https://cloud.mongodb.com/v2/ */
var credencials = {
        "host":"localhost",
        "porta":"27017",
        "user":"viapratica",
        "passwd": "MUDAR",
        "db":"whatsapp"
}

var config = {

        'uriExterno': 'mongodb+srv://'+ credencials.user +':' + qs.escape(credencials.passwd) + '@'+ credencials.host +'/'+ credencials.db +'?retryWrites=true&w=majority',
        'uriLocal':'mongodb://localhost:'+ credencials.porta +'/'+credencials.db               
};

module.exports = config
