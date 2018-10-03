const express = require('express');
const app = express();
const Evento = require('../models/evento');
const Calendario = require('../src/calendario.json')


app.post('/conf/calendario_init/', function(req, res) {
    try {
        for (var i in Calendario) {
            for (var j in Calendario[i].eventos) {
                let evento = new Evento({
                    localidad: Calendario[i].localidad,
                    nombreEvento: Calendario[i].eventos[j].evento,
                    lugar: Calendario[i].eventos[j].lugar,
                    fechaInicio: Calendario[i].eventos[j].fechaInicio,
                    fechaFin: Calendario[i].eventos[j].fechaFin,
                    latitud: Calendario[i].eventos[j].latitud,
                    longitud: Calendario[i].eventos[j].longitud,
                    id: Calendario[i].eventos[j].id,
                    color: Calendario[i].eventos[j].color
                });
                evento.save();
                console.log('Evento agregado al calendario');
            }
        }
        res.json({
            ok: true,
            message: 'Alta completa'
        });
    } catch (e) {
        return res.status(400).json({
            ok: false,
            message: 'Error al dar de alta un evento. Error: ' + e.message
        });
    }



});




module.exports = app;