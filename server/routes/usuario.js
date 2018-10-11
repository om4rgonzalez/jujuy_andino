const express = require('express');
const app = express();
const Usuario = require('../models/usuario');
const Evento = require('../models/evento');
const axios = require('axios');
const Entrada = require('../models/entrada');


//valores que devuelve:
//0: ok
//1: no existe el evento
//2: 
let verificar_cupo = async(idEvento) => {
    Evento.find()
        .where({ id: idEvento })
        .exec((err, even) => {
            if (err) {
                console.log("No existe el evento " + idEvento);
                return {
                    ok: 1
                };
            }

            if (even.length == 0) {
                console.log("No existe el evento " + idEvento);
                return {
                    ok: 1
                };
            }

            return {
                ok: 0
            };

        });
};



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

let verificarAsistencia = async(usuario, idEvento_, res) => {
    let URL = process.env.URL_SERVICE + process.env.PORT + '/agenda/verficar_asistencia/';
    let resp = await axios.post(URL, {
        email: usuario,
        idEvento: idEvento_
    });

    if (resp.ok)
        return res.json({
            ok: true
        });
    else
        return res.status(401).json({
            ok: false
        });
};


app.post('/agenda/agregar_evento/', async function(req, res) {
    //datos que recibe:
    //===== === ======
    //
    //esNuevo
    //idEvento
    //idGoogle
    //email
    //nombre
    //clave
    // console.log(req.body.usuario);

    //primero verifico si hay cupo

    let idUsuario = '';
    let yaRegistrado = false;
    let idEvento = "";
    console.log('Valor de la variable -esNuevo-: ' + req.body.esNuevo);
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
    Usuario.find({ email: req.body.usuario.email })
        .populate('agenda')
        .exec((err, usuario) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            if (usuario.length > 0) {
                idUsuario = usuario[0]._id;
            }

            for (var j in usuario) {
                for (var i in usuario[j].agenda) {
                    if (usuario[j].agenda[i].id == req.body.evento.id) {
                        yaRegistrado = true;
                        idEvento = usuario[j].agenda[i]._id;
                        break;
                    }
                }
            }
            if (!yaRegistrado) {
                Evento.find({ id: req.body.evento.id })
                    // .where({ completo: false })
                    .exec((err, eventoDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err,
                                codigo: -1
                            });
                        }

                        if (eventoDB.length <= 0) {
                            return res.json({
                                ok: false,
                                message: 'No existe un evento con el id enviado',
                                codigo: -1
                            });
                        }

                        if (eventoDB[0].cupo > 0) {
                            let c = (eventoDB[0].cupo - 1);
                            let completo_ = false;
                            if (c <= 0) {
                                completo_ = true;
                            }

                            Evento.findOneAndUpdate({ _id: eventoDB[0]._id }, {
                                $set: { cupo: c, completo: completo_ }
                            }, function(err1, success_) {
                                if (err1) {
                                    console.log('La actualizacion del evento produjo un error: ' + err1.message);
                                    return res.json({
                                        ok: false,
                                        message: 'La actualizacion del evento produjo un error: ' + err1.message,
                                        codigo: -1
                                    })
                                }

                                console.log('Se actualizo el cupo, ahora vale: ' + c);
                            });
                            // Aqui tengo que agregar el id a la agenda
                            Usuario.findOneAndUpdate({ email: req.body.usuario.email }, { $push: { agenda: eventoDB[0]._id } },
                                function(err, success) {

                                    if (err) {
                                        return res.status(400).json({
                                            ok: false,
                                            message: 'No se pudo agregar el evento a la agenda',
                                            codigo: -1
                                        });
                                    }

                                    // console.log('id usuario: ' + success);
                                    // console.log('id usuario guardado: ' + idUsuario);

                                    // genero el ticket de entrada
                                    let entrada = new Entrada({
                                        usuario: idUsuario,
                                        evento: eventoDB[0]._id
                                    });
                                    entrada.save();

                                    res.json({
                                        ok: true,
                                        message: 'El evento se agrego a la agenda',
                                        codigo: entrada._id
                                    });
                                });
                        } else {
                            //el evento esta completo, queda ver si es que tiene la opcion de comprar la entrada
                            if (eventoDB[0].urlCompraTicket == '-') { //no se puede comprar ticket
                                return res.json({
                                    ok: false,
                                    message: 'No quedan entradas gratuitas para este evento.',
                                    codigo: entrada._id
                                });
                            } else { //se puede comprar ticket
                                return res.json({
                                    ok: false,
                                    message: 'No quedan entradas gratuitas para este evento. Puedes comprar accediendo a este link ' + eventoDB[0].urlCompraTicket,
                                    codigo: entrada._id
                                });
                            }
                        }
                    });
            } else {
                //busco el tikcet
                Entrada.find({ usuario: idUsuario, evento: idEvento })
                    .exec((err, entradaDB) => {

                        return res.json({
                            ok: false,
                            message: 'Ya esta registrado al evento',
                            codigo: entradaDB[0]._id
                        });
                    });
            }
        });
});


app.get('/agenda/obtener_eventos/', function(req, res) {
    let usuarios = [];

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

app.post('/agenda/verficar_asistencia/', function(req, res) {

    Usuario.find({ email: req.body.email })
        .populate('agenda')
        .exec((err, usuario) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            usuario = usuario.filter(function(usuario) {
                return usuario.agenda.id != req.body.idEvento;
            })


            if (usuario.length != 0) {
                return res.status(404).json({
                    ok: false,
                    message: 'Usuario ya registrado al evento'
                });
            }
            res.json({
                ok: true,
                message: 'El usuario aun no se registro en el evento'
            });
        });
});



module.exports = app;