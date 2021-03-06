const express = require('express');
const app = express();
const Evento = require('../models/evento');
const Calendario = require('../src/calendario.json')




app.get('/conf/status/', function(req, res) {
    // let fecha = getDate(new Date());
    // let fecha = new Date().toGMTString();
    // var now = new Date();
    // var fecha = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    console.log('Ambiente: ' + process.env.NODE_ENV);
    console.log('URL del servicio: ' + process.env.URL_SERVICE);
    console.log('Puerto escuchando: ' + process.env.PORT);
    console.log('URL base de datos: ' + process.env.urlDB);
    console.log('Hora del servidor: ' + fecha);

    res.json({
        ambiente: process.env.NODE_ENV,
        urlServicio: process.env.URL_SERVICE,
        puerto: process.env.PORT,
        baseDatos: process.env.urlDB,
        fecha: fecha
    });

});
app.post('/conf/calendario_init/', function(req, res) {
    console.log('Procesando la solicitud: Cargar base de eventos');
    try {
        for (var i in Calendario) {
            for (var j in Calendario[i].eventos) {
                if (Calendario[i].eventos[j].cupo == 0)
                    Calendario[i].eventos[j].cupo = 1000000;

                if (Calendario[i].eventos[j].cupoExterno == 0)
                    Calendario[i].eventos[j].cupoExterno = 1000000;

                let evento = new Evento({
                    localidad: Calendario[i].localidad,
                    nombreEvento: Calendario[i].eventos[j].evento,
                    lugar: Calendario[i].eventos[j].lugar,
                    fechaInicio: Calendario[i].eventos[j].fechaInicio,
                    fechaFin: Calendario[i].eventos[j].fechaFin,
                    latitud: Calendario[i].eventos[j].latitud,
                    longitud: Calendario[i].eventos[j].longitud,
                    id: Calendario[i].eventos[j].id,
                    color: Calendario[i].eventos[j].color,
                    cupo: Calendario[i].eventos[j].cupo,
                    urlCompraTicket: Calendario[i].eventos[j].urlCompraTicket,
                    descripcion: Calendario[i].eventos[j].descripcion,
                    cupoExterno: Calendario[i].eventos[j].cupoExterno
                });


                evento.save();
                // console.log('Evento agregado al calendario');
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


app.get('/reportes/entradas_disponibles/', function(req, res) {
    let eventos = [];
    Evento.find()
        .exec((err, evento) => {
            if (err) {
                console.log('La consulta arrojo un error: ' + err.message);
                return res.json({
                    ok: false,
                    message: 'La consulta arrojo un error: ' + err.message
                });
            }

            if (evento.length == 0) {
                console.log('La consulta arrojo un error: ' + err.message);
                return res.json({
                    ok: false,
                    message: 'La consulta arrojo un error: ' + err.message
                });
            }
            let i = 0;
            let hasta = evento.length;
            while (i < hasta) {
                for (var k in Calendario) {
                    for (var j in Calendario[k].eventos) {
                        if (Calendario[k].eventos[j].id == evento[i].id) {
                            eventos.push({
                                evento: evento[i].nombreEvento,
                                fechaInicio: evento[i].fechaInicio,
                                fechaFin: evento[i].fechaFin,
                                cupoLocaInicial: Calendario[k].eventos[j].cupo,
                                cupoLocalDisponible: evento[i].cupo,
                                cupoExtrangeroInicial: Calendario[k].eventos[j].cupoExterno,
                                cupoExtrangeroDisponible: evento[i].cupoExterno

                            });
                            break;
                        }
                    }
                }

                i++;
            }

            eventos = eventos.sort(function(a, b) {
                return (a.cupoLocalDisponible - b.cupoLocalDisponible)
            });

            res.json({
                eventos
            });
        });
});




module.exports = app;