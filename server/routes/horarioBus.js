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
            destino: req.body.horarios[i].destino,
            origen: req.body.horarios[i].origen
        });
        horario.save();
        if (req.body.horarios[i].telefono) {
            //actualizo el numero de celular del usuario
            Usuario.findOneAndUpdate({ _id: req.body.horarios[i].usuario }, { $set: { telefono: req.body.horarios[i].telefono } },
                function(err, success) {

                    if (err) {
                        console.log('Salto un error en la actualizacion del telefono: ' + err.message);
                        // return res.status(400).json({
                        //     ok: false,
                        //     message: 'No se pudo agregar el evento a la agenda',
                        //     codigo: -1
                        // });
                    } else {
                        console.log('Se actualizo el telefono');
                    }
                    // genero el ticket de entrada


                    // res.json({
                    //     ok: true,
                    //     message: 'El evento se agrego a la agenda',
                    //     codigo: entrada._id
                    // });
                });
        }
    }

    res.json({
        ok: true,
        message: 'Registro completado'
    });

});














module.exports = app;