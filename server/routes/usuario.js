const express = require('express');
const app = express();
const Usuario = require('../models/usuario');
const Evento = require('../models/evento');



let buscarUsuario = async(email_, res) => {

    Usuario.findOne({ email: email_ }, function(err, usuario) {
        //console.log(obj); 
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error de acceso a los datos'
            });
        }

        if (usuario.length == 0) {
            return res.status(400).json({
                ok: false,
                message: 'No un usuario registrado con esa direccion de email'
            });
        }



        res.json({
            ok: true,
            message: usuario._id
        });
    });
};

let nuevoUsuario = async(usuario) => {
    try {
        usuario.save();
        return {
            ok: true
        };
    } catch (e) {
        return {
            ok: false
        };
    }
};

let nuevoEvento = async(evento) => {
    try {
        evento.save();
        return {
            ok: true
        };
    } catch (e) {
        return {
            ok: false
        };
    }
};


app.post('/agenda/agregar_evento/', async function(req, res) {
    //datos que recibe:
    //===== === ======
    //
    //esNuevo
    //localidad
    //nombreEvento
    //lugar
    //fechaInicio
    //fechaFin
    //latitud
    //longitud
    //idGoogle
    //email
    //nombre
    //clave
    // console.log(req.body.usuario);

    let idUsuario = '';
    if (req.body.esNuevo) {
        //creo la cuenta del usuario
        let usuario = new Usuario({
            idGoogle: req.body.usuario.idGoogle,
            email: req.body.usuario.email,
            nombre: req.body.usuario.nombre,
            clave: req.body.usuario.clave
        });
        try {
            let respuestaNuevoUsuario = await nuevoUsuario(usuario);
            if (respuestaNuevoUsuario.ok) {
                idUsuario = usuario._id;
            } else
                return res.status(400).json({
                    ok: false,
                    message: 'No se pudo dar de alta el usuario. Error '
                });

        } catch (e) {
            return res.status(400).json({
                ok: false,
                message: 'No se pudo dar de alta el usuario. Error ' + e.message
            });
        }
    }
    // else {
    //     //busco el usuario
    //     let usuario = await buscarUsuario(req.body.usuario.email, res);
    //     console.log('Usuario: ' + usuario);
    //     if (usuario.ok) {
    //         //agrego el evento a la agenda
    //         idUsuario = usuario.message;
    //     }
    // }
    //genero el registro con el evento
    let evento = new Evento({
        localidad: req.body.evento.localidad,
        nombreEvento: req.body.evento.nombreEvento,
        lugar: req.body.evento.lugar,
        fechaInicio: req.body.evento.fechaInicio,
        fechaFin: req.body.evento.fechaFin,
        latitud: req.body.evento.latitud,
        longitud: req.body.evento.longitud
    })
    try {
        let respuestaNuevoEvento = await nuevoEvento(evento);
        if (respuestaNuevoEvento.ok) {
            //agrego el evento a la agenda
            Usuario.findOneAndUpdate({ email: req.body.usuario.email }, { $push: { agenda: evento._id } },
                function(err, success) {

                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            message: 'No se pudo agregar el evento a la agenda'
                        });
                    }
                    res.json({
                        ok: true,
                        message: 'El evento se agrego a la agenda'
                    });
                });
        }

    } catch (e) {
        return res.status(400).json({
            ok: false,
            message: 'No se pudo agregar el evento a la agenda. Error ' + e.message
        });
    }

});


app.get('/agenda/obtener_eventos/', function(req, res) {

    Usuario.find({ email: req.query.email })
        .populate('agenda')
        .exec((err, usuario) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            if (usuario.length == 0) {
                return res.status(404).json({
                    ok: false,
                    message: 'Usuario no encontrado'
                });
            }
            res.json({
                ok: true,
                usuario
            });
        });
});



module.exports = app;