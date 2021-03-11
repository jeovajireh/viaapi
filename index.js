// Record Audio
// https://blog.addpipe.com/using-recorder-js-to-capture-wav-audio-in-your-html5-web-site/
//
// https://expressjs.com/pt-br/advanced/best-practice-security.html
// Configuração dos módulos
const fs = require('fs');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser')
const web = express();
const cors = require('cors');
const sistem = require("./src/routes/sistem.routes");

const ssl = process.env.HTTPS || true;
const hostname = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 9001;
const ssl_key = process.env.KEY || '/etc/letsencrypt/live/api.ispservicos.com.br/privkey.pem';
const ssl_cert = process.env.CERT || '/etc/letsencrypt/live/api.ispservicos.com.br/fullchain.pem';

web.use(cors());
web.use(express.json());
//
// Configuração

// Body Parser
web.use(bodyParser.json());
web.use(bodyParser.urlencoded({
    extended: true
}));
//
// Rotas
web.use("/sistem", sistem);
//
// Start the server web
if (ssl === true) { //with ssl
    https.createServer({
            key: fs.readFileSync(ssl_key, 'utf8'),
            cert: fs.readFileSync(ssl_cert, 'utf8')
        },
        web).listen(port, hostname, () => {
        console.log("Web rodando na porta :" + port);
    });
} else { //http
    web.listen(port, hostname, () => {
        console.log("Web rodando na porta:" + port);
    });
} // End the server web
//
// Nome de sessão de teste
//Sessions.start('c002928a-ff53-46c1-99f1-b2622d7fe84a');
//
/*
web.post('/file_upload', upload.single('file'), (req, res, next) => {
    // encoded has the base64 of your file
    res.status(200).json({
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        destination: req.file.destination,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        base64Data: req.file.buffer.toString('base64')
    });
});
*/
//
//
process.stdin.resume(); //so the program will not close instantly
//
async function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log("- Cleanup");
        await Sessions.getSessions().forEach(async session => {
            await Sessions.closeSession(session.sessionName);
        });
    }
    if (exitCode || exitCode === 0) {
        console.log(exitCode);
    }
    //
    if (options.exit) {
        process.exit();
    }
} //exitHandler
//
//do something when sistema is closing
process.on('exit', exitHandler.bind(null, {
    cleanup: true
}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
    exit: true
}));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {
    exit: true
}));
process.on('SIGUSR2', exitHandler.bind(null, {
    exit: true
}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
    exit: true
}));
//
// ------------------------------------------------------------------------------------------------//
//
//
