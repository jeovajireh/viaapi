
//
const os = require('os');
const fs = require('fs');
const path = require('path');
const venom = require('venom-bot');
const axios = require('axios');
const qs = require('qs');
var mime = require('mime-types')
var decryptar = require('@open-wa/wa-decrypt');


var errosn = "";

/* arquivos iternos (import) */
const util = require('./controllers/Endpoints_controller');
const ctrFile = require('./controllers/Files_controller');
const confsSess = require('./controllers/ConfsSessao_controller');


const {
    async
} = require('rxjs');

/*
async function get(){
var rs = await confsSess.get({"client_id":"cid6001b88be6355"});
console.log(rs);
}
get(); return; */

//
//
// ------------------------------------------------------------------------------------------------------- //
//
//
function apenasNumeros(str) {
    str = typeof str.toString();
    return str.replace(/\D+/g, "");
}
//
function soNumeros(string) {
    var numsStr = String(string).replace(/\D+/g, "");
    return parseInt(numsStr);
}
//
module.exports = class Sessions {
    //


    static async start(sessionName) {

//       Usado para testar diretamente o banco de dados
//        sessionName = 'cid6001b88be6355';
        console.log("- Criando sessão "+ sessionName);
        Sessions.sessions = Sessions.sessions || []; //start array

        var session = false;

        console.log("Verificando se a sessão existe no Banco de Dados...");

        /* ============ verificar se sessão existe no banco de dados ============ */
        var existSessDB = await util.getSessionDB(sessionName);
        console.log(existSessDB);
        /* se a sessão existir no banco então permitir criar sessão whatsapp */
        if (existSessDB == true) {

            session = Sessions.getSession(sessionName);

        } else {

            console.log("❌SESSÃO NÃO SERÁ CRIADA = MOTIVO: A sessão não existe no banco de dados.");
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: '❌SESSÃO NÃO SERÁ CRIADA = MOTIVO: A sessão não existe no banco de dados.'
            };
        }
        /* ============ FIM - verificar se sessão existe no banco de dados ============ */


        if (session == false) {
            //create new session
            session = await Sessions.addSesssion(sessionName);
        } else if (["CLOSED"].includes(session.state)) {
            //restart session
            console.log("- State: CLOSED");
            session.state = "STARTING";
            session.status = "notLogged";
            session.attempts = 0;
            session.client = Sessions.initSession(sessionName);
            Sessions.setup(sessionName);
        } else if (["CONFLICT", "UNPAIRED", "UNLAUNCHED", "UNPAIRED_IDLE"].includes(session.state)) {
            session.status = 'notLogged';
            console.log('- Status do sistema:', session.state);
            console.log('- Status da sessão:', session.status);
            console.log("- Client UseHere");
            session.client.then(client => {
                client.useHere();
            });
            session.client = Sessions.initSession(sessionName);
        } else {
            console.log('- Nome da sessão:', session.name);
            console.log('- State do sistema:', session.state);
            console.log('- Status da sessão:', session.status);
        }
        return session;
    } //start
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    static async addSesssion(sessionName) {

        console.log("- Adicionando sessão");
        var newSession = {
            name: sessionName,
            qrcode: false,
            client: false,
            status: 'notLogged',
            state: 'STARTING',
            attempts: ''
        }
        Sessions.sessions.push(newSession);
        console.log("- Nova sessão: " + newSession.state);

        //setup session
        newSession.client = Sessions.initSession(sessionName);
        Sessions.setup(sessionName);

        return newSession;
    } //addSession






    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    static getSession(sessionName) {
        var foundSession = false;
        if (Sessions.sessions)
            Sessions.sessions.forEach(session => {
                if (sessionName == session.name) {
                    foundSession = session;
                }
            });
        return foundSession;
    } //getSession
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    static getSessions() {
        if (Sessions.sessions) {
            return Sessions.sessions;
        } else {
            return [];
        }
    } //getSessions
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    static async initSession(sessionName) {
        console.log("- Iniciando sistema");
        var session = Sessions.getSession(sessionName);
        const client = await venom.create(session.name, (base64Qrimg, asciiQR, attempts, urlCode) => {
            console.log('- Nome da sessão:', session.name);
            //
            session.state = "QRCODE";
            //
            console.log('- Number of attempts to read the qrcode: ', attempts);
            session.attempts = attempts;
            //
            console.log("- Captura do QR-Code");
            //console.log(base64Qrimg);
            session.qrcode = base64Qrimg;
            //
            console.log("- Captura do asciiQR");
            // Registrar o QR no terminal
            //console.log(asciiQR);
            session.CodeasciiQR = asciiQR;
            //
            console.log("- Captura do urlCode");
            // Registrar o QR no terminal
            //console.log(urlCode);
            session.CodeurlCode = urlCode;
            /*
            // Para escrevê-lo em outro lugar em um arquivo
            //exportQR(base64Qrimg, './public/images/marketing-qr.png');
            var matches = base64Qrimg.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
                response = {};

            if (matches.length !== 3) {
                return new Error('- Invalid input string');
            }
            response.type = matches[1];
            response.data = new Buffer.from(matches[2], 'base64');
            
            // Gerar o arquivo png
            var imageBuffer = response;
            require('fs').writeFile('./public/images/marketing-qr.png',
                imageBuffer['data'],
                'binary',
                function(err) {
                    if (err != null) {
                        console.log(err);
                    }
                }
            );
            */
        }, (statusSession, session_venom) => {
            console.log('- Status da sessão:', statusSession);
            //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
            //Create session wss return "serverClose" case server for close
            console.log('- Session name: ', session_venom);

            if (statusSession == 'isLogged' || statusSession == 'inChat') {
                session.state = "CONNECTED";
            } else if (statusSession == 'qrReadSuccess') {
                session.state = "CONNECTED";
            } else if (statusSession == 'qrReadFail' || statusSession == 'notLogged') {
                session.state = "STARTING";
            }
            session.status = statusSession;
        }, {
            folderNameToken: "tokens", //folder name when saving tokens
            mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
            headless: true, // Headless chrome
            devtools: false, // Open devtools by default
            useChrome: false, // If false will use Chromium instance
            debug: false, // Opens a debug session
            logQR: true, // Logs QR automatically in terminal
            browserWS: '', // If u want to use browserWSEndpoint
            //browserArgs: [''], // Parameters to be added into the chrome browser instance
            //https://peter.sh/experiments/chromium-command-line-switches/
            browserArgs: [
                '--log-level=3',
                '--no-default-browser-check',
                '--disable-site-isolation-trials',
                '--no-experiments',
                '--ignore-gpu-blacklist',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-default-apps',
                '--enable-features=NetworkService',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                // Extras
                '--disable-webgl',
                '--disable-threaded-animation',
                '--disable-threaded-scrolling',
                '--disable-in-process-stack-traces',
                '--disable-histogram-customizer',
                '--disable-gl-extensions',
                '--disable-composited-antialiasing',
                '--disable-canvas-aa',
                '--disable-3d-apis',
                '--disable-accelerated-2d-canvas',
                '--disable-accelerated-jpeg-decoding',
                '--disable-accelerated-mjpeg-decode',
                '--disable-app-list-dismiss-on-blur',
                '--disable-accelerated-video-decode',
            ],
            disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
            disableWelcome: true, // Will disable the welcoming message which appears in the beginning
            updates: true, // Logs info updates automatically in terminal
            autoClose: false, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
        });
        return client;
    } //initSession
    //
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    static async setup(sessionName) {
        console.log("- Sistema iniciado!");
        var session = Sessions.getSession(sessionName);
        console.log(session);
        await session.client.then(client => {


            // Listen to messages
            client.onMessage(async (message) => {
                //  console.log("Teste Client =====================>", message);
                /* algumas vezes api reporta extenção errada do arquivo por isso precisa tratar antes de enviar para o endpoint */

                //console.log(message);
                /* if (message.type == "document") {
 
                     var count = message.filename.length;
                     var ext_ = message.filename.substr(count - 3, count);
 
                     message.mimetype = "application/" + ext_;
 
                 } */

console.log(">>>>>>>>>>>>>>>>>>>", message.type);


                if (message.type == "chat") {
                    var type = "mensagem";
                    var midia = "chat";
                } else if (message.type == "ptt") {
                    var type = "mensagem";
                    var midia = "ptt";
                    var ext = "ogg";
                } else if (message.mimetype == "image/jpeg") {
                    var midia = "image";
                    var ext = "jpg";
                } else if (message.type == "document") {

                    var type = "mensagem";
                    var midia = "document";

                    var ext = mime.extension(message.mimetype);

                } else {
                    var type = "mensagem";
                    var midia = "chat";
                }
                // acho que porque ele não entrou em lugar nenhum, vai como o ultimo que é mensgem 





                /* SEND WEBHOOK */
                /* if (!message.sender.isMe) { // somente mensagens não enviadas por mim }*/
                //console.log("Teste =====================>" + message.type);
                // console.log("Teste =====================>" + message.content);


                /* verificar se  */


                // Tira tudo


               



                if (message.type !== "chat") {

                    //const buffer = await client.decryptFile(message);
                    //const buffer = await decryptar.decryptMedia(message);
                    /*const buffer = await client.downloadMedia(message.id);
                     */

                    
                 
                    /*  */
                    const buffer = await client.decryptFile(message);
                    /* criar o base64 */
                    let base64data = Buffer.from(buffer).toString('base64');
                    let imagebase64 = 'data:' + message.mimetype + ';base64,' + base64data;
                    
                    var telefone = ((String(`${message.from}`).split('@')[0]).substr(2));
                    let date_ob = new Date();
                    let date = ("0" + date_ob.getDate()).slice(-2);
                    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                    let year = date_ob.getFullYear();
                    let miliseconds = date_ob.getMilliseconds();
                    const fileName = `${telefone}-${year}${month}${date}-${miliseconds}`;
                    const file = `${fileName}.${mime.extension(message.mimetype)}`;
                    try {
                        fs.writeFileSync(`./public/uploads/${file}`, buffer);

                    }catch(error){
                        console.log("Erro ao processar o arquivo: ",error)
                        return;
                    }

                    /* upload file */
                  /*  ext = mime.extension(message.mimetype);
                    var now = new Date();   
                    var  fileName = "FILE_TESTE_" + now.getSeconds() + "." + ext;
                    await fs.writeFileSync("./public/uploads" + fileName, imagebase64); */


                    var msgaudio = {

                        "tipo": "mensagem",
                        "whatsapp": "" + message.from.split('@')[0] + "",
                        "mensagem": message.content,
                        "horario_unix": "" + message.timestamp + "",
                        "idmsg": message.id.split('@c.us_')[1],
                        "nome_cliente": message.sender.verifiedName,
                        "nome_agenda": message.chat.id.split('@')[0],
                        "midia": midia,
                        "mimetype": message.mimetype,
                        "width": "" + message.width + "",
                        "height": "" + message.height + "",
                        "size": "" + message.size + "",
                        "legenda": message.caption,
                        "referencia": message.id.split('@c.us_')[1] + "." + ext

                    }
                    var msgptt = await util.send_post(msgaudio, sessionName, 'message');

                    //console.log(msgaudio);

                    var dadosaudio = qs.stringify({

                        'tipo': 'arquivo',
                        'referencia': message.id.split('@c.us_')[1] + "." + ext,
                        'base64': imagebase64

                    });

                    //var msgptt = await util.send_post(msgaudio,'message');


                    var arqptt = await util.send_postAudio(dadosaudio, sessionName, 'arquivo');


                } else {

                    var params = {

                        "tipo": type,
                        "whatsapp": message.from.split('@')[0],
                        "mensagem": message.content,
                        "horario_unix": message.timestamp,
                        "idmsg": message.id.split('@c.us_')[1],
                        "nome_cliente": message.sender.verifiedName,
                        "nome_agenda": message.chat.id.split('@')[0],
                        "midia": midia
                    };

                    var retorno = await util.send_post(params, sessionName, 'message');
console.log("################### POSTOU");


                }


            });


            // Fim webhook

            // State change
            client.onStateChange((state) => {
                console.log('- State changed: ', state);
                session.state = state;
                // force whatsapp take over
                if ('CONFLICT'.includes(state)) client.useHere();
                // detect disconnect on whatsapp
                if ('UNPAIRED'.includes(state)) console.log('- Logout');
            });
            //
            // function to detect incoming call
            client.onIncomingCall(async (call) => {
                console.log(call);
                client.sendText(call.peerJid, "Desculpe, ainda não consigo atender chamadas");
            });
            // Listen to ack's
            client.onAck((ack) => {
                //
                const jsonStr = JSON.stringify(obj);
                //console.log(JSON.parse(jsonStr));
                const retur_ack = JSON.parse(jsonStr);
                //
                if (retur_ack.ack == '-7') {
                    var str_ack = "MD_DOWNGRADE";
                } else if (retur_ack.ack == '-6') {
                    var str_ack = "INACTIVE";
                } else if (retur_ack.ack == '-5') {
                    var str_ack = "CONTENT_UNUPLOADABLE";
                } else if (retur_ack.ack == '-4') {
                    var str_ack = "CONTENT_TOO_BIG";
                } else if (retur_ack.ack == '-3') {
                    var str_ack = "CONTENT_GONE";
                } else if (retur_ack.ack == '-2') {
                    var str_ack = "EXPIRED";
                } else if (retur_ack.ack == '-1') {
                    var str_ack = "FAILED";
                } else if (retur_ack.ack == '0') {
                    var str_ack = "CLOCK";
                } else if (retur_ack.ack == '1') {
                    var str_ack = "SENT";
                } else if (retur_ack.ack == '2') {
                    var str_ack = "RECEIVED";
                } else if (retur_ack.ack == '3') {
                    var str_ack = "READ";
                } else if (retur_ack.ack == '4') {
                    var str_ack = "PLAYED";
                } else {
                    var str_ack = "DESCONHECIDO";
                }
                console.log('- Listen to acks:', str_ack);
            });
            // Listen when client has been added to a group
            client.onAddedToGroup((chatEvent) => {
                console.log('- Listen when client has been added to a group:', chatEvent);
            });
        });



    } //setup

    /* função para envio de mensagem autodetectável (texto ou mídia) */
    /* ======= funções utilizadas para envio de mensagem ======== */

    static async sendAnyTypesMessages(params) {

        var session = Sessions.getSession(params.SessionName);
        var TypeFile = false;

        /* verificar se possui arquivo na mensagem */
        if (params.url_imagem !== undefined && params.url_imagem !== "") {

            if (params.url_imagem.length > 0) {
                TypeFile = true;
            }

        }

        console.log("✅ - Enviando menssagem de texto! " + params.mensagem + params.whatsapp + params.SessionName);

        if (session) {
            if (session.state == "CONNECTED") {
                var resultSend = await session.client.then(async client => {

                    if (TypeFile == false) {

                        console.log("👉🏻 tipo de mensagem a ser enviada: " + TypeFile);
                        /* enviar mensagem de texto */
                        return await client.sendText(soNumeros(params.whatsapp) + '@c.us', params.mensagem).then((result) => {

                        }).then((retorno) => {
                            /* sucesso */

                            return {
                                result: retorno,
                                state: session.state,
                                status: session.status,
                                message: "Mensagem enviada com sucesso!",
                                erro: "nao"
                            };

                        }, (erro) => {
                            /* caso haja erro */
                            return {
                                result: erro,
                                state: session.state,
                                status: session.status,
                                message: "Erro ao tentar enviar a mensagem.",
                                erro: "sim"
                            };

                        });


                    } else if (TypeFile == true) {

                        var pars = {
                            "arquivo": params.url_imagem
                        };

                        return await ctrFile.formatFilesSend(pars).then(async function (res) {
                            console.log("👉🏻 resultado geração de arquivo: " + res.dirFile);
                            if (res.dirFile) {
                                console.log(res);
                                /* enviar mensagem de com arquivo */
                                return await client.sendFile(soNumeros(params.whatsapp) + '@c.us', res.dirFile, res.filename, params.mensagem).then((res) => {

                                    return {
                                        result: res,
                                        state: session.state,
                                        status: session.status,
                                        message: "Mensagem com arquivo enviada com sucesso!",
                                        erro: "nao"
                                    };
                                }).catch((erro) => {
                                    console.error('Error when sending: ', erro); //return object error
                                    return {
                                        result: erro,
                                        state: session.state,
                                        status: session.status,
                                        message: "Erro ao tentar enviar o arquivo.",
                                        erro: "sim"
                                    };
                                });

                            }

                        })

                    }
                });
                return resultSend;
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }






    }



    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    static async closeSession(sessionName) {
        console.log("- Fechando sessão");
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client) {
                    await session.client.then(async client => {
                        try {
                            await client.close();
                        } catch (error) {
                            console.log("- Erro ao fechar sistema:", error.message);
                        }
                        session.state = "CLOSED";
                        session.status = "notLogged";
                        session.client = false;
                        console.log("- Sistema fechado");
                    });
                    return {
                        result: "success",
                        state: session.state,
                        status: session.status,
                        message: "Sistema fechado"
                    };
                }
            } else { //close
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //closeSession
    //
    //
    // ------------------------------------------------------------------------------------------------//
    //
    // Device Functions
    // Delete the Service Worker
    static async killServiceWorker(sessionName) {
        console.log("- killServiceWorker");
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client) {
                    var resultkillServiceWorker = await session.client.then(async client => {
                        return await client.killServiceWorker();
                    });
                    return resultkillServiceWorker;
                }
            } else { //close
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //killServiceWorker
    //
    // Load the service again
    static async restartService(sessionName) {
        console.log("- restartService");
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client) {
                    var resultrestartService = await session.client.then(async client => {
                        return await client.restartService();
                    });
                    return resultrestartService;
                }
            } else { //close
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //restartService
    //
    // Get device info
    static async getHostDevice(sessionName) {
        console.log("- getHostDevice");
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client) {
                    var resultgetHostDevice = await session.client.then(async client => {
                        return await client.getHostDevice();

                    });


                    var retorno = resultgetHostDevice;
                    //console.log("numero =====> " + retorno.wid.user);
                    // console.log("- getHostDevice", retorno);


                    if (retorno.id == "1" && retorno.connected == "1") { var errosn = "nao"; var logado = "sim"; var pronto = "sim"; } else { var errosn = "sim"; var logado = "nao"; var pronto = "nao"; };


                    //                    return  resultgetHostDevice;

                    //var retorno = resultgetHostDevice;
                    // Ricardo RBS


                    /*
                    
                    
                            $erro= $retorno->erro;
                            $sobre_o_erro= $retorno->sobre_o_erro;
                            $logado= $retorno->logado;
                            $pronto= $retorno->pronto;
                            $nome= $retorno->nome;
                            $telefone= $retorno->telefone;
                            $bateria= $retorno->bateria;
                    */



                    return {
                        erro: errosn,
                        sobre_o_erro: "nada",
                        logado: logado,
                        pronto: pronto,
                        nome: retorno.pushname,
                        telefone: retorno.wid.user,
                        bateria: retorno.battery,

                    };


                }
            } else { //close
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getHostDevice
    //
    // Get connection state
    static async getConnectionState(sessionName) {
        console.log("- getConnectionState");
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client) {

                    var resultisConnected = await session.client.then(async client => {
                        return await client.getConnectionState();
                    });
                    return resultisConnected;
                }
            } else { //close
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getConnectionState
    //
    // Get battery level
    static async getBatteryLevel(sessionName) {
        console.log("- getBatteryLevel");
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client) {
                    var resultgetBatteryLevel = await session.client.then(async client => {
                        return await client.getBatteryLevel();
                    });
                    return resultgetBatteryLevel;
                }
            } else { //close
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getBatteryLevel
    //

    //RBS

    /*
    
       static async getAuth(sessionName) {
     var session = Sessions.getSession(sessionName);
            console.log("- Adicionando sessão");
            var newAuth = {
                sucesso: 'sim',
                qrcode: session.qrcode,
                auth: '\/gerenciamento_geral.php?auth=094f15d1005f770c0f70e83f2b685fb2'
            }
     //       Sessions.sessions.push(newAuth);
     //       console.log("- Nova sessão: " + newAuth.state);
    
            //setup session
     //       newSession.client = Sessions.initSession(sessionName);
     //       Sessions.setup(sessionName);
    
            return newAuth;
    
    }
    
    */




    static async getAuth(sessionName) {
        var session = Sessions.getSession(sessionName);
        console.log("- Adicionando sessão");

        if (session.qrcode == null) { var sucesso = "nao"; var qrauth = "-"; var sobre_o_erro = "não startado"; } else { var sucesso = "sim"; var sobre_o_erro = "sem erros"; qrauth = session.qrcode; };


        if (session.state !== "CLOSED") {
            await Sessions.start(sessionName);
            // Sessions.setup(sessionName);
        }


        var newAuth = {
            sucesso: 'sim',
            qrcode: session.qrcode,
            auth: '\/gerenciamento_geral.php?auth=094f15d1005f770c0f70e83f2b685fb2'
        }

        return newAuth;

    }









    /*
    
    $rt['sobre_o_erro']= "{$debug->sobre_o_erro}";
    $rt['conectado']= "{$debug->conectado}";
    $rt['qrcode']= "{$debug->qrcode}";
    $rt['nome']= "{$debug->nome}";
    $rt['telefone']= "{$debug->telefone}";
    $rt['htmladd']= "{$debug->interface}";
    
    
                            erro: errosn,
                            sobre_o_erro: "nada",
                            logado: logado,
                            pronto: pronto,
                            nome: retorno.pushname,
                            telefone: retorno.user,
                            bateria: retorno.battery,
    
    */

    // Ricardo Inicio






    static async qrcode_update(sessionName) {
        var session = Sessions.getSession(sessionName);

        var retorno = false;
        var newQRup = {};


// Teste
        if (session.state == "CONNECTED") {

//        if (retorno.connected == "1") {

            var resultgetHostDevice = await session.client.then(async client => {
                return await client.getHostDevice();
            });

            var retorno = resultgetHostDevice;

            console.log("- Adicionando sessão");

            newQRup = {
                erro: "nao",
                sobre_o_erro: "sem erros",
                conectado: "sim",
                qrcode: "",
                nome: retorno.pushname,
                telefone: retorno.user,
                telefone: retorno.wid.user,
                bateria: retorno.battery,
                htmladd: "<html> CONECTADO </html>"

            }
            return newQRup;

        } else {
            //console.log(session);


            newQRup = {
                erro: "nao",
                sobre_o_erro: "desconectado",
                conectado: "nao",
                qrcode: session.qrcode,
                nome: "desconectado",
                telefone: "0000000000000",
                htmladd: "<html> DESCONECTADO </html>"
            }


            return newQRup;

        }

    }


    static async foto_perfil(sessionName, whatsapp) {
        var session = Sessions.getSession(sessionName);

        //if (retorno.id == "1" && retorno.connected  == "1") {  var erro = "nao"; var conectado = "sim"; var sobre_o_erro = "sem erro"; } else { var erro = "sim"; var conectado = "nao";  var sobre_o_erro = "desconectado"; };
//        console.log("Whats", whatsapp);

        if (session.state == "CONNECTED") {
        
//	console.log("RESULTADO EM FOTO PERFIL AGORA", session.state);

     console.log("RESULTADO WhatsApp", whatsapp);
     console.log("RESULTADO SESSÃO", sessionName);

            if (whatsapp != '' && sessionName != '') {

     console.log("RESULTADO" );

                /* pegar dados do perfil do contato */
                var perfilImg = await session.client.then(async client => {


    console.log("RESULTADO EM FOTO PERFIL AGORA", session.client);



                    return await client.getProfilePicFromServer(soNumeros(whatsapp) + '@c.us').then((result) => {

                        return result;


                    }).catch((erro) => {
                        console.error('Error when sending: ', erro); //return object error
                        console.log("👉Erro ao consultar a imagem de pergil do contato!", erro);
                        return false;
                    });
                });

                var res = { result: false, erro: " erro ao enviar o post ao endpoint." };

                if (perfilImg) {
                    var params = {
                        "whatsapp": whatsapp,
                        "tipo": "perfil",
                        "img_icone": perfilImg
                    };
        console.log("FOTO", perfilImg);
                    /* enviar dados de perfil ao endpoint: retorno.php */
                    res = await util.send_post(params, sessionName, 'perfil');

                    console.log("👍Consulta de imagem de perfil do contato, enviado com êxito." + whatsapp + ".", res, params);
                }


                if (res.result == false) {

                    var newQRup = {
                        erro: 'sim',
                        sobre_o_erro: "Erro no envio de dados ao endpoint retorno.php."
                    }

                    if (res.erro !== undefined) {

                        newQRup.sobre_o_erro = res.erro;
                    }

                } else {

                    var newQRup = {
                        erro: 'nao',
                        sobre_o_erro: "sem erros.",
                        status: 'webhook'
                    }

                }

                return newQRup;
            } else {

                var newQRup = {
                    erro: 'sim',
                    sobre_o_erro: 'campos de parametros vaazios, favor verifique!'
                }
                return newQRup;
            }

        }/* verificar se conectado */
        else {

            var newQRup = {
                erro: 'sim',
                sobre_o_erro: 'sessão não está conectada.'
            }

            return newQRup;
        }


    }





    // Ricardo final do bloco

    // Is Connected
    static async isConnected(sessionName) {
        console.log("- isConnected");
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client) {
                    var resultisConnected = await session.client.then(async client => {
                        return await client.isConnected();
                    });
                    return resultisConnected;
                }
            } else { //close
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //isConnected
    //
    // Get whatsapp web version
    static async getWAVersion(sessionName) {
        console.log("- getWAVersion");
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client) {
                    var resultgetWAVersion = await session.client.then(async client => {
                        return await client.getWAVersion();
                    });
                    return resultgetWAVersion;
                }
            } else { //close
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getWAVersion
    //
    //
    // ------------------------------------------------------------------------------------------------//
    //
    // Funções básicas (uso)
    //
    static async sendText(sessionName, number, text) {
        console.log("- Enviando menssagem de texto! " + text + number + sessionName);
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendText = await session.client.then(async client => {

                    return await client.sendText(number + '@c.us', text).then((result) => {
                        //console.log("Result: ", result); //return object success
                        //return { result: "success", state: session.state, message: "Sucesso ao enviar menssagem" };
                        return (result);
                    }).catch((erro) => {
                        //console.error("Error when sending: ", erro); //return object error
                        //return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
                        return (erro);
                    });
                });
                return resultSendText;
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //sendText
    //
    static async sendTextMult(sessionName, base64Data, mimetype, originalname, msgtxtmass) {
        console.log("- Enviando menssagem texto lista de conatos!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                //
                var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                var filePath = path.join(folderName, originalname);
                fs.writeFileSync(filePath, base64Data, 'base64');
                console.log(filePath);
                //
                var jsonStr = '{"sendResult":[]}';
                var obj = JSON.parse(jsonStr);
                //
                var arrayNumbers = fs.readFileSync(filePath, 'utf-8').toString().split(/\r?\n/);
                for (var i in arrayNumbers) {
                    //console.log(arrayNumbers[i]);
                    var numero = arrayNumbers[i];
                    //
                    if (numero != null || numero != '') {
                        var resultsendTextMult = await session.client.then(async (client) => {
                            // Send basic text
                            return await client.sendText(soNumeros(numero) + '@c.us', msgtxtmass).then((result) => {
                                //console.log(result); //return object success
                                return {
                                    erro: false,
                                    status: 'OK',
                                    number: numero,
                                    menssagem: 'Menssagem envida com sucesso'
                                };
                            }).catch((erro) => {
                                //console.error(erro); //return object error
                                return {
                                    erro: true,
                                    status: '404',
                                    number: numero,
                                    menssagem: 'Erro ao enviar menssagem'
                                };
                            });

                        });
                        //return resultsendTextMult;
                        //
                        obj['sendResult'].push(resultsendTextMult);
                    }
                }
                //
                jsonStr = JSON.stringify(obj);
                //console.log(JSON.parse(jsonStr));
                return JSON.parse(jsonStr);
                //
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //sendTextMult
    //
    static async sendTextGroup(sessionName, number, text) {
        console.log("- Enviando menssagem de pexto para grupo!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendText = await session.client.then(async client => {
                    // Send basic text
                    return await client.sendText(number + '@g.us', text).then((result) => {
                        //console.log("Result: ", result); //return object success
                        //return { result: "success", state: session.state, message: "Sucesso ao enviar menssagem" };
                        return (result);
                    }).catch((erro) => {
                        //console.error("Error when sending: ", erro); //return object error
                        //return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
                        return (erro);
                    });
                });
                return resultSendText;
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //sendText
    //
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    static async sendImage(sessionName, number, base64Data, fileName, caption) {
        console.log("- Enviando imagem!");
        console.log(caption);
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultsendImage = await session.client.then(async (client) => {
                    var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                    var filePath = path.join(folderName, fileName);
                    fs.writeFileSync(filePath, base64Data, 'base64');
                    console.log(filePath);
                    return await client.sendImage(number + '@c.us', filePath, fileName, caption).then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultsendImage;
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //sendImage
    //
    static async sendImageMult(sessionName, base64DataContato, originalnameContato, base64DataImagem, originalnameImagem, msgimgmass) {
        console.log("- Enviando imagem lista de contatos!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultsendImage = await session.client.then(async (client) => {
                    //
                    var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                    var filePathContato = path.join(folderName, originalnameContato);
                    fs.writeFileSync(filePathContato, base64DataContato, 'base64');
                    console.log(filePathContato);
                    //
                    //
                    var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                    var filePathImagem = path.join(folderName, originalnameImagem);
                    fs.writeFileSync(filePathImagem, base64DataImagem, 'base64');
                    console.log(filePathImagem);
                    //
                    var jsonStr = '{"sendResult":[]}';
                    var obj = JSON.parse(jsonStr);
                    //
                    var arrayNumbers = fs.readFileSync(filePathContato, 'utf-8').toString().split(/\r?\n/);
                    for (var i in arrayNumbers) {
                        //console.log(arrayNumbers[i]);
                        var numero = arrayNumbers[i];
                        //
                        if (numero != null || numero != '') {
                            var resultsendTextMult = await session.client.then(async (client) => {
                                // Send basic text
                                return await client.sendImage(soNumeros(numero) + '@c.us', filePathImagem, originalnameImagem, msgimgmass).then((result) => {
                                    //console.log(result); //return object success
                                    return {
                                        erro: false,
                                        status: 'OK',
                                        number: numero,
                                        menssagem: 'Menssagem envida com sucesso'
                                    };
                                }).catch((erro) => {
                                    //console.error(erro); //return object error
                                    return {
                                        erro: true,
                                        status: '404',
                                        number: numero,
                                        menssagem: 'Erro ao enviar menssagem'
                                    };
                                });

                            });
                            //return resultsendTextMult;
                            //
                            obj['sendResult'].push(resultsendTextMult);
                        }
                    }
                    //
                    jsonStr = JSON.stringify(obj);
                    //console.log(JSON.parse(jsonStr));
                    return JSON.parse(jsonStr);
                    //
                });
                return resultsendImage;
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //sendImage
    //
    static async sendImageGrup(sessionName, number, base64Data, fileName, caption) {
        console.log("- Enviando imagem para grupo!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultsendImage = await session.client.then(async (client) => {
                    var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                    var filePath = path.join(folderName, fileName);
                    fs.writeFileSync(filePath, base64Data, 'base64');
                    console.log(filePath);
                    return await client.sendImage(number + '@g.us', filePath, fileName, caption).then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultsendImage;
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //sendImageGrup
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    static async sendFile(sessionName, number, base64Data, fileName, caption) {
        console.log("- Enviando documento!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendFile = await session.client.then(async (client) => {
                    var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                    var filePath = path.join(folderName, fileName);
                    fs.writeFileSync(filePath, base64Data, 'base64');
                    console.log(filePath);
                    return await client.sendFile(number + '@c.us', filePath, fileName, caption).then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                }); //client.then(
                return {
                    resultSendFile
                };
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //sendFile
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Returns browser session token
    static async getSessionTokenBrowser(sessionName) {
        console.log("- Obtendo lista de bloqueados!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetSessionTokenBrowser = await session.client.then(async client => {
                    return await client.getSessionTokenBrowser().then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetSessionTokenBrowser;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getSessionTokenBrowser
    //
    // ------------------------------------------------------------------------------------------------//
    //
    // Recuperando Dados
    //
    // Chama sua lista de contatos bloqueados (retorna uma matriz)
    static async getBlockList(sessionName) {
        console.log("- Obtendo lista de bloqueados!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetBlockList = await session.client.then(async client => {
                    return await client.getBlockList().then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetBlockList;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getBlockList
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Retrieve contacts
    static async getAllContacts(sessionName) {
        console.log("- Obtendo todos os contatos!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetAllContacts = await session.client.then(async client => {
                    return await client.getAllContacts().then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetAllContacts;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getAllContacts
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Recupere todas as mensagens no chat
    static async loadAndGetAllMessagesInChat(sessionName, numero) {
        console.log("- Obtendo todas as mensagens no chat!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultloadAndGetAllMessagesInChat = await session.client.then(async client => {
                    return await client.loadAndGetAllMessagesInChat(soNumeros(numero) + '@g.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultloadAndGetAllMessagesInChat;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //loadAndGetAllMessagesInChat
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Recuperar status de contato
    static async getStatus(sessionName, numero) {
        console.log("- Obtendo status!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetStatus = await session.client.then(async client => {
                    return await client.getStatus(soNumeros(numero) + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetStatus;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getStatus
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Recuperar perfil de usuário
    static async getNumberProfile(sessionName, numero) {
        console.log("- Obtendo o perfil do número!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetNumberProfile = await session.client.then(async client => {
                    return await client.getNumberProfile(soNumeros(numero) + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetNumberProfile;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getNumberProfile
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Recupera todas as mensagens não lidas
    static async getAllUnreadMessages(sessionName) {
        console.log("- Obtendo todas as mensagens não lidas!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetAllUnreadMessages = await session.client.then(async client => {
                    return await client.getAllUnreadMessages().then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetAllUnreadMessages;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getAllUnreadMessages
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Recuperar todos os chats
    static async getAllChats(sessionName) {
        console.log("- Obtendo todos os chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetAllChats = await session.client.then(async client => {
                    return await client.getAllChats().then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetAllChats;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getAllChats
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Recuperar todos os grupos
    static async getAllGroups(sessionName) {
        console.log("- Obtendo todos os grupos!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetAllGroups = await session.client.then(async client => {
                    return await client.getAllGroups().then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetAllGroups;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getAllGroups
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Recuperar fic de perfil (como url)
    static async getProfilePicFromServer(sessionName, numero) {
        console.log("- Obtendo a foto do perfil do servidor!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetProfilePicFromServer = await session.client.then(async client => {
                    return await client.getProfilePicFromServer(soNumeros(numero) + '@g.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetProfilePicFromServer;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getProfilePicFromServer
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Recuperar chat / conversa
    static async getChat(sessionName, numero) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetChat = await session.client.then(async client => {
                    return await client.getChat(soNumeros(numero) + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetChat;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getChat
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
    // Verifique se o número existe
    static async checkNumberStatus(sessionName, numero) {
        console.log("- Verifique se o número existe!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultcheckNumberStatus = await session.client.then(async client => {
                    return await client.checkNumberStatus(soNumeros(numero) + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                var checkNumberStatus = resultcheckNumberStatus;
                checkNumberStatus['number'] = soNumeros(numero);
                return checkNumberStatus;
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //checkNumberStatus
    //
    static async checkNumberStatusMult(sessionName, base64Data, mimetype, originalname) {
        console.log("- Enviando menssagem!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                //
                var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                var filePath = path.join(folderName, originalname);
                fs.writeFileSync(filePath, base64Data, 'base64');
                console.log(filePath);
                //
                var jsonStr = '{"sendResult":[]}';
                var obj = JSON.parse(jsonStr);
                //
                var arrayNumbers = fs.readFileSync(filePath, 'utf-8').toString().split(/\r?\n/);
                for (var i in arrayNumbers) {
                    //console.log(arrayNumbers[i]);
                    var numero = arrayNumbers[i];
                    //
                    if (numero != null || numero != '') {
                        //
                        var resultcheckNumberStatus = await session.client.then(async client => {
                            return await client.checkNumberStatus(soNumeros(numero) + '@c.us').then((result) => {
                                //console.log('Result: ', result); //return object success
                                return result;
                            }).catch((erro) => {
                                //console.error('Error when sending: ', erro); //return object error
                                return erro;
                            });
                        });
                        //
                        var checkNumberStatus = resultcheckNumberStatus;
                        checkNumberStatus['number'] = soNumeros(numero);
                        //return checkNumberStatus;

                        obj['sendResult'].push(checkNumberStatus);
                    }
                }
                //
                jsonStr = JSON.stringify(obj);
                //console.log(JSON.parse(jsonStr));
                return JSON.parse(jsonStr);
                //
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //sendTextMult
    //
    // ------------------------------------------------------------------------------------------------//
    //
    // Funções de Grupo
    //
    // Deixar o grupo
    static async leaveGroup(sessionName, groupId) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultleaveGroup = await session.client.then(async client => {
                    return await client.leaveGroup(groupId + '@g.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultleaveGroup;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //leaveGroup
    //
    // Obtenha membros do grupo
    static async getGroupMembers(sessionName, groupId) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetGroupMembers = await session.client.then(async client => {
                    return await client.getGroupMembers(groupId + '@g.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetGroupMembers;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getGroupMembers
    //
    // Obter IDs de membros do grupo
    static async getGroupMembersIds(sessionName, groupId) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetGroupMembersIds = await session.client.then(async client => {
                    return await client.getGroupMembersIds(groupId + '@g.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetGroupMembersIds;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getGroupMembersIds
    //
    // Gerar link de url de convite de grupo
    static async getGroupInviteLink(sessionName, groupId) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetGroupInviteLink = await session.client.then(async client => {
                    return await client.getGroupInviteLink(groupId + '@g.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetGroupInviteLink;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getGroupInviteLink
    //
    // Criar grupo (título, participantes a adicionar)
    static async createGroup(sessionName, groupId, contatos) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetGroupInviteLink = await session.client.then(async client => {
                    return await client.createGroup(groupId, [
                        '111111111111@c.us',
                        '222222222222@c.us',
                    ]).then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetGroupInviteLink;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //createGroup
    //
    // Remove participant
    static async removeParticipant(sessionName, groupoid, contato) {
        console.log("- removeParticipant");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultremoveParticipant = await session.client.then(async client => {
                    return await client.removeParticipant(groupoid + '@g.us', contato + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultremoveParticipant;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //removeParticipant
    //
    //
    // Add participant
    static async addParticipant(sessionName, groupoid, contato) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultaddParticipant = await session.client.then(async client => {
                    return await client.addParticipant(groupoid + '@g.us', contato + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultaddParticipant;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //addParticipant
    //
    //
    // Promote participant (Give admin privileges)
    static async promoteParticipant(sessionName, groupoid, contato) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultpromoteParticipant = await session.client.then(async client => {
                    return await client.promoteParticipant(groupoid + '@g.us', contato + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultpromoteParticipant;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //promoteParticipant
    //
    //
    // Demote particiapnt (Revoke admin privileges)
    static async demoteParticipant(sessionName, groupoid, contato) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultdemoteParticipant = await session.client.then(async client => {
                    return await client.demoteParticipant(groupoid + '@g.us', contato + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultdemoteParticipant;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //demoteParticipant
    //
    //
    // Get group admins
    static async getGroupAdmins(sessionName, groupoid, contato) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetGroupAdmins = await session.client.then(async client => {
                    return await client.getGroupAdmins(groupoid + '@g.us', contato + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetGroupAdmins;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getGroupAdmins
    //
    //
    // Return the group status, jid, description from it's invite link
    static async getGroupInfoFromInviteLink(sessionName, groupoid, contato) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetGroupInfoFromInviteLink = await session.client.then(async client => {
                    return await client.createGroup(groupoid + '@g.us', contato + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultgetGroupInfoFromInviteLink;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //getGroupInfoFromInviteLink
    //
    //
    // Join a group using the group invite code
    static async joinGroup(sessionName, groupoid, contato) {
        console.log("- Obtendo chats!");
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultjoinGroup = await session.client.then(async client => {
                    return await client.joinGroup(groupoid + '@g.us', contato + '@c.us').then((result) => {
                        //console.log('Result: ', result); //return object success
                        return result;
                    }).catch((erro) => {
                        //console.error('Error when sending: ', erro); //return object error
                        return erro;
                    });
                });
                return resultjoinGroup;
                //return { result: "success" };
            } else {
                if (session.state == "STARTING") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema iniciando"
                    };
                } else if (session.state == "QRCODE") {
                    return {
                        result: "warning",
                        state: session.state,
                        status: session.status,
                        message: "Sistema aguardando leitura do QR-Code"
                    };
                } else if (session.state == "CLOSED") {
                    return {
                        result: "info",
                        state: session.state,
                        status: session.status,
                        message: "Sistema encerrado"
                    };
                }
            }
        } else {
            return {
                result: 'error',
                state: 'NOTFOUND',
                status: 'notLogged',
                message: 'Sistema Off-line'
            };
        }
    } //joinGroup
    //
    //
    // ------------------------------------------------------------------------------------------------//
    //
    //
}
