require('./config/config');

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
    // parse application/json
app.use(bodyParser.json())


console.log('Llega la peticion');
//indice de rutas
app.use(require('./routes/evento'));
app.use(require('./routes/usuario'));
app.use(require('./routes/horarioBus'));
// app.use(require('./server_persona/server_persona'));
// app.use(require('./server_usuario/server_usuario'));
// app.use(require('./server_contacto/server_contacto'));


mongoose.connect(process.env.URLDB, (err, res) => {
    if (err) throw err;
    console.log('Base de datos ONLINE');
});

app.listen(process.env.PORT, () => {
    console.log('Usuario Escuchando el puerto ', process.env.PORT);
    console.log('Ambiente: ' + process.env.NODE_ENV);
    console.log('URL del servicio: ' + process.env.URL_SERVICE);
    console.log('Puerto escuchando: ' + process.env.PORT);
    console.log('URL base de datos: ' + process.env.URLDB);
});