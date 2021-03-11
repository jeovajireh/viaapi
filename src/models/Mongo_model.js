const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = require('../../confs/db');

/* url de conexão com banco (realizar conexao) */
const uriDb = db.uriLocal; /* local ou externo */

mongoose.connect(uriDb, { 
    useNewUrlParser: true
}, function(err, db) {

    if(err){
        console.log("Ocorreu um erro na conexão: " + err.toString());
        return;
    }
    //console.log(db.connections);
   
});

/* criar funções de funcionalidades para o banco de dados (FUNÇÕES COMUNS) */
const schema = new Schema({
    'nome':{
        type:String,
        required:true,
        trim:true
    },
    'email':{
        type:String,
        required:true,
        trim:true
    },
    'senha':{
        type:String,
        required:true,
        trim:true
    },
    'saldo':{
        type:Number,
        required:true,
        trim:true
    },
    'client_id':{
        type:String,
        required:true,
        trim:true
    },
    'secret':{
        type:String,
        required:true,
        trim:true
    },
    'data_cadastro':{
        type:Date,
        required:true,
        trim:true
    },
    'webhooks':{
        type:String,
        required:true,
        trim:true
    },
    'codigo_confirmacao':{
        type:String,
        required:true,
        trim:true
    },
    'solicitou_recuperacao':{
        type:Boolean,
        required:true,
        trim:true
    },
    'ativo':{
        type:Boolean,
        required:true,
        trim:true
    }
});

module.exports = mongoose.model('usuarios',schema);
