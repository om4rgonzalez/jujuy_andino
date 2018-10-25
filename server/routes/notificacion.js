const express = require('express');
const app = express();
const Notificacion = require('../models/notificacion');


app.post('/notificacion/registrar_notificacion/', function(req, res) {

    for (var i in req.body.notificaciones) {
        let notificacion = new Notificacion({
            esDeEvento: req.body.notificaciones[i].esDeEvento,
            idEvento: req.body.notificaciones[i].idEvento,
            notificacion: req.body.notificaciones[i].notificacion,
            fechaSubida: req.body.notificaciones[i].fechaSubida
        });
        // console.log('Datos a guardar');
        // console.log(notificacion);

        notificacion.save((err, exito) => {
            if (err) {
                console.log('No se pudo guardar la notificacion: ' + err.message);
            } else {
                console.log('Se guardo la notificacion');
            }


        });

    }

    res.json({
        ok: true,
        message: 'Notificaciones cargadas'
    });

});


app.get('/notificacion/consultar/', function(req, res) {
    Notificacion.find()
        .sort({ fechaAlta: -1 })
        .exec((err, notificaciones) => {
            if (err) {
                console.log('La busqueda de notificaciones devolvio un error: ' + err.message);
                return res.json({
                    ok: false,
                    message: 'La busqueda de notificaciones devolvio un error',
                    notificaciones: null
                });
            }

            if (notificaciones.length == 0) {
                console.log('No hay notificaciones');
                return res.json({
                    ok: false,
                    message: 'No hay notificaciones',
                    notificaciones
                });
            }

            res.json({
                ok: true,
                message: 'Hay notificaciones',
                notificaciones
            });
        });
});











module.exports = app;