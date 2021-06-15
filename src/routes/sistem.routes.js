const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
//const upload = multer({ dest: 'public/uploads/' });
const upload = multer({});
const router = express.Router();
const Sessions = require("../sessions.js");

bodyParser.json({ limit: "50mb" });
bodyParser.urlencoded({
  extended: false,
  limit: "50mb",
});

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
//
// ------------------------------------------------------------------------------------------------//
//
//
//
router.post("/Start", async (req, res, next) => {
  //
  var session = await Sessions.start(req.body.SessionName);
  //    console.log(req);
  if (["CONNECTED"].includes(session.state)) {
    res.status(200).json({
      result: "success",
      state: session.state,
      status: session.status,
      message: "Sistema iniciado",
    });
  } else if (["STARTING"].includes(session.state)) {
    res.status(200).json({
      result: "info",
      state: session.state,
      status: session.status,
      message: "Sistema iniciando",
    });
  } else if (["QRCODE"].includes(session.state)) {
    res.status(200).json({
      result: "warning",
      state: session.state,
      status: session.status,
      message: "Sistema aguardando leitura do QR-Code",
    });
  } else {
    res.status(200).json({
      result: "error",
      state: session.state,
      status: session.status,
      message: "Sistema Off-line",
    });
  }
  //
});
//
//
// ------------------------------------------------------------------------------------------------------- //
//
//
router.post("/QRCode", async (req, res, next) => {
  //
  var session = Sessions.getSession(req.body.SessionName);
  console.log('SESSAO', session);
  if (session != false) {
    if (
      (session.state != "CONNECTED" && session.status != "inChat") ||
      session.status != "isLogged"
    ) {
      if (req.body.View == "True" || req.body.View == "true") {
        if(session.qrcode){
          session.qrcode = session.qrcode.replace("data:image/png;base64,", "");
          const imageBuffer = Buffer.from(session.qrcode, "base64");
          res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": imageBuffer.length,
          });
          res.end(imageBuffer);
        }else{
          res.status(404).json({
            result: "warning",
            state: session.state,
            status: session.status,
            qrcode: 'Não encontrado',
            message: "Sistema aguardando QR-Code",
          });
        }
      } else {
        res.status(200).json({
          result: "warning",
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          message: "Sistema aguardando leitura do QR-Code",
        });
      }
    } else {
      if (["CONNECTED"].includes(session.state)) {
        res.status(200).json({
          result: "success",
          state: session.state,
          status: session.status,
          message: "Sistema iniciado",
        });
      } else if (["STARTING"].includes(session.state)) {
        res.status(200).json({
          result: "info",
          state: session.state,
          status: session.status,
          message: "Sistema iniciando",
        });
      }
    }
  } else {
    res.status(200).json({
      result: "error",
      state: "NOTFOUND",
      state: "notLogged",
      message: "Sistema Off-line",
    });
  }
  //
});
//
//
// ------------------------------------------------------------------------------------------------------- //
//
//
router.post("/Close", async (req, res, next) => {
  var result = await Sessions.closeSession(req.body.SessionName);
  res.json(result);
}); //close
//
//
// ------------------------------------------------------------------------------------------------//
//
// Device Functions
//
router.post("/killServiceWorker", async (req, res, next) => {
  var result = await Sessions.killServiceWorker(req.body.SessionName);
  res.json(result);
}); //killServiceWorker
//
router.post("/restartService", async (req, res, next) => {
  var result = await Sessions.restartService(req.body.SessionName);
  res.json(result);
}); //restartService
//
router.post("/getHostDevice", async (req, res, next) => {
  var result = await Sessions.getHostDevice(req.body.SessionName);
  res.json(result);
}); //getHostDevice
//
router.post("/getConnectionState", async (req, res, next) => {
  var result = await Sessions.getConnectionState(req.body.SessionName);
  res.json(result);
}); //getConnectionState
//
router.post("/getBatteryLevel", async (req, res, next) => {
  var result = await Sessions.getBatteryLevel(req.body.SessionName);
  res.json(result);
}); //getBatteryLevel
//
router.post("/isConnected", async (req, res, next) => {
  var result = await Sessions.isConnected(req.body.SessionName);
  res.json(result);
}); //isConnected
//
router.post("/getWAVersion", async (req, res, next) => {
  var result = await Sessions.getWAVersion(req.body.SessionName);
  res.json(result);
}); //getWAVersion

router.post("/getAuth", async (req, res, next) => {
  var result = await Sessions.getAuth(req.body.SessionName);
  res.json(result);
});

router.post("/qrcode_update", async (req, res, next) => {
  var result = await Sessions.qrcode_update(req.body.SessionName);
  res.json(result);
});

router.post("/foto_perfil", async (req, res, next) => {
  var result = await Sessions.foto_perfil(
    req.body.SessionName,
    req.body.whatsapp
  );
  res.json(result);
});

//
//
// ------------------------------------------------------------------------------------------------//
//
// Funções básicas (uso)
router.post("/sendText", async (req, res, next) => {
  var result = await Sessions.sendText(
    req.body.SessionName,
    soNumeros(req.body.phonefull),
    req.body.msg
  );
  //console.log(result);
  res.json(result);
}); //sendText

/* função para envio de mensagem autodetectável (texto ou mídia) */
router.post("/sendAnyTypesMsg", async (req, res, next) => {
  console.log(req.body);
  var result = await Sessions.sendAnyTypesMessages(req.body);
  //console.log(result);
  res.json(result);
});

//
router.post(
  "/sendTextMult",
  upload.single("sendTextMassaContato"),
  async (req, res, next) => {
    var result = await Sessions.sendTextMult(
      req.body.SessionName,
      req.file.buffer.toString("base64"),
      req.file.mimetype,
      req.file.originalname,
      req.body.msgtxtmass
    );
    //console.log(result);
    res.json(result);
  }
); //sendText
//
router.post("/sendTextGrupo", async (req, res, next) => {
  var result = await Sessions.sendTextGroup(
    req.body.SessionName,
    req.body.TextGrupo,
    req.body.TextGrupoMsg
  );
  res.json(result);
}); //sendText
//
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/sendImage", upload.single("fileimg"), async (req, res, next) => {
  console.log(req.body);
  var result = await Sessions.sendImage(
    req.body.SessionName,
    soNumeros(req.body.phonefull),
    req.file.buffer.toString("base64"),
    req.file.originalname,
    req.body.msgimg
  );
  //console.log(result);
  res.json(result);
}); //sendImage
//
var cpUpload = upload.fields([
  {
    name: "sendImageMassaContato",
    maxCount: 1,
  },
  {
    name: "FileImageMassa",
    maxCount: 1,
  },
]);
router.post("/sendImageMult", cpUpload, async (req, res, next) => {
  var result = await Sessions.sendImageMult(
    req.body.SessionName,
    //
    req.files["sendImageMassaContato"][0].buffer.toString("base64"),
    req.files["sendImageMassaContato"][0].originalname,
    //
    req.files["FileImageMassa"][0].buffer.toString("base64"),
    req.files["FileImageMassa"][0].originalname,
    //
    req.body.msgimgmass
  );
  //console.log(result);
  res.json(result);
}); //sendImage
//
router.post(
  "/sendImageGrupo",
  upload.single("FileImageGrupo"),
  async (req, res, next) => {
    var result = await Sessions.sendImageGrup(
      req.body.SessionName,
      req.body.ImgGrupo,
      req.file.buffer.toString("base64"),
      req.file.originalname,
      req.body.msgimg
    );
    //console.log(result);
    res.json(result);
  }
); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
//
router.get("/sendFile", async (req, res, next) => {
  var result = await Sessions.sendFile(
    req.body.SessionName,
    soNumeros(req.body.phonefull),
    req.body.base64Data,
    req.body.fileName,
    req.body.caption
  );
  res.json(result);
}); //sendFile
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getSessionTokenBrowser", async (req, res, next) => {
  var result = await Sessions.getSessionTokenBrowser(req.body.SessionName);
  res.json(result);
}); //getBlockList
//
// ------------------------------------------------------------------------------------------------//
//
// Recuperando Dados
//
router.post("/getBlockList", async (req, res, next) => {
  var result = await Sessions.getBlockList(req.body.SessionName);
  res.json(result);
}); //getBlockList
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getAllContacts", async (req, res, next) => {
  var result = await Sessions.getAllContacts(req.body.SessionName);
  res.json(result);
}); //getAllContacts
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/loadAndGetAllMessagesInChat", async (req, res, next) => {
  var result = await Sessions.loadAndGetAllMessagesInChat(
    req.body.SessionName,
    soNumeros(req.body.phonefull)
  );
  res.json(result);
}); //loadAndGetAllMessagesInChat
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getStatus", async (req, res, next) => {
  var result = await Sessions.getStatus(
    req.body.SessionName,
    soNumeros(req.body.phonefull)
  );
  res.json(result);
}); //getStatus
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getNumberProfile", async (req, res, next) => {
  var result = await Sessions.getNumberProfile(
    req.body.SessionName,
    soNumeros(req.body.phonefull)
  );
  res.json(result);
}); //getNumberProfile
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getAllUnreadMessages", async (req, res, next) => {
  var result = await Sessions.getAllUnreadMessages(req.body.SessionName);
  res.json(result);
}); //getAllUnreadMessages
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getAllChats", async (req, res, next) => {
  var result = await Sessions.getAllChats(req.body.SessionName);
  res.json(result);
}); //getAllChats
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getAllGroups", async (req, res, next) => {
  var result = await Sessions.getAllGroups(req.body.SessionName);
  res.json(result);
}); //getAllGroups
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getProfilePicFromServer", async (req, res, next) => {
  var result = await Sessions.getProfilePicFromServer(
    req.body.SessionName,
    soNumeros(req.body.phonefull)
  );
  res.json(result);
}); //getProfilePicFromServer
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/getChat", async (req, res, next) => {
  var result = await Sessions.getChat(req.body.SessionName);
  res.json(result);
}); //getChat
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/checkNumberStatus", async (req, res, next) => {
  var result = await Sessions.checkNumberStatus(
    req.body.SessionName,
    soNumeros(req.body.phonefull)
  );
  res.json(result);
}); //checkNumberStatus
//
router.post(
  "/checkNumberStatusMult",
  upload.single("checkNumberStatusMassaContato"),
  async (req, res, next) => {
    var result = await Sessions.checkNumberStatusMult(
      req.body.SessionName,
      req.file.buffer.toString("base64"),
      req.file.mimetype,
      req.file.originalname
    );
    //console.log(result);
    res.json(result);
  }
); //sendText
//
// ------------------------------------------------------------------------------------------------//
//
// Funções de Grupo
//
router.post("/leaveGroup", async (req, res, next) => {
  var result = await Sessions.leaveGroup(
    req.body.SessionName,
    req.body.groupId
  );
  res.json(result);
}); //close
//
router.post("/getGroupMembers", async (req, res, next) => {
  var result = await Sessions.getGroupMembers(
    req.body.SessionName,
    req.body.groupId
  );
  res.json(result);
}); //close
//
//
// ------------------------------------------------------------------------------------------------//
//
//
router.post("/testArry", async (req, res, next) => {
  /*
    var result = await Sessions.testArry(
        req.file.buffer.toString('base64'),
        req.file.mimetype,
        req.file.originalname
    );
    */
  //console.log(result);
  res.json(req.body.testArry);
}); //sendText
//
/*
var fs = require('fs');
fs.readFile('file.txt', function(err, data) {
    if(err) throw err;
    var array = data.toString().split("\n");
    for(i in array) {
        console.log(array[i]);
    }
});
*/
//
module.exports = router;
