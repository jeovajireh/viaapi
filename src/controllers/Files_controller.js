'use strict'

const confApi = require('../../confs/api');
/* converter url para base64 */
const imageToBase64 = require('image-to-base64');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

/* ======= funções úteis ======== */
exports. formatFilesSend = async function(params){

    /* 
         PARAMETROS DA FUNÇÃO:
            arquivo (url)
    */

    var fileName = "";
    var now = new Date();    
    var bitmap;
    var image;
    var count = params.arquivo.length;
    var ext = params.arquivo.substr(count -3,count);
    var audio = false;

    if(params.arquivo == undefined || !params.arquivo){
        return {"retorno":"arquivo inexistente"};      
    }

     /* verificar configuração para envio para url HTTPS OU HTTP */
  if(confApi.SEND_HTTPS == false){
    params.arquivo = params.arquivo.replace("https:", "http:");
  }

    /* pegar extenção do arquivo na url */
    fileName = "FILE_" + now.getSeconds() + "." + ext;    

    var dirFile = './public/uploads/' + fileName;
    
    console.log("Extenção do arquivo: " + ext)

    return new Promise( async (resolve, reject) => {
            if(ext == 'pdf'){
            /* converter arquivo (url) em base64 */
                    await imageToBase64(params.arquivo) // Image URL
                        .then(
                            (response) => {
                            // console.log("imagem:  " + response);
                            image = response;
                            bitmap = new Buffer(image, 'base64');
                            }
                        )
                        .catch(
                            (error) => {
                                result = "⛔️ Erro ao ler a url do arquivo a ser enviado: " + error; // Logs an error if there was one                               
                                reject({'retorno':result});
                                return;
                            }
                        )
                        
                }else{
                        /* converter arquivo (url) em base64 */
                    await imageToBase64(params.arquivo) // Image URL
                    .then(
                        (response) => {
                            // console.log("imagem:  " + response);
                            image = response;
                            bitmap = new Buffer(image, 'base64');
                        }
                    )
                    .catch(
                        (error) => {
                            result = "⛔️ Erro ao ler a url do arquivo a ser enviado: " + error; 
                            reject({'retorno':result});
                            return;
                        }
                    )

                }

                 // write buffer to file
                await fs.writeFileSync(dirFile, bitmap);

                    /* se for audio conveerter para mp3 */
                    if(ext == "ogg" || ext == "oga" || ext == "mp3" || ext == "wav"){
                        audio = true;
                        fileName = "AUDIO_" + now.getSeconds() + ".mp3";
                        var dirDest = './public/uploads/' + fileName;
                        var result = false;
                        result = await setupAudio(dirFile, dirDest).then(async function(res){
                              //  console.log("arquivo de audio convertido...");
                              //  console.log(res);
                                return res;
                        });
    
                       // console.log(result);
    
                       /* gerar aquivo na pasta downloads */
                      
                        resolve({"retorno":result,"dirFile":dirDest,"filename":fileName,"audio":audio});
                        return;
    
                    }else if(ext == "mp3"){
                        // converter buffer to file
                        await fs.writeFileSync(dirFile, bitmap);
                        resolve({"retorno":true,"dirFile":dirFile,"filename":fileName,"audio":audio});
                        return;
                    }
    
    
                    /* sucesso */
                    resolve({"retorno":true,"dirFile":dirFile,"filename":fileName});
                    return;

        });


}


async function setupAudio(dirOrigem, dirDestino){
    /* SOMENTE AUDIO 
        parametros:
             dirOrigen (local do arquivo de origem)
             dirDestino (local do arquivo de destino a ser gerado)
    */

    return new Promise( async (resolve, reject) => {
        try {
           
            ffmpeg(dirOrigem)
            .output(dirDestino)
            .on('end', function() {                    
                console.log('conversão concluida!');
                resolve(true);
            }).on('error', function(e){
                console.log('error: ', e);
                reject(false);
            }).run();

        } catch (e) {
            console.log(e.code);
            console.log(e.msg);
            reject(false)
        }

    });


}