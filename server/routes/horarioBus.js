const express = require('express');
const app = express();
const Usuario = require('../models/usuario');
const HorarioBus = require('../models/horarioBus');
// const axios = require('axios');
// const Entrada = require('../models/entrada');


app.post('/bus/registrar_viaje/', function(req, res) {

    for (var i in req.body.horarios) {
        let horario = new HorarioBus({
            usuario: req.body.horarios[i].usuario,
            dia: req.body.horarios[i].dia,
            mes: req.body.horarios[i].mes,
            hora: req.body.horarios[i].hora,
            minuto: req.body.horarios[i].minuto,
            destino: req.body.horarios[i].destino
        });
        horario.save();
    }

    res.json({
        ok: true,
        message: 'Registro completado'
    });

});














module.exports = app;