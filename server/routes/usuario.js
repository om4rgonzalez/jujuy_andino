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
        console.log('Fallo el registro del usuario: ' + e.message);
        return {
            ok: false
        };
    }
};



function buscarEntrada_(idEntrada) {
    console.log('Id de entrada =', idEntrada);
    return new Promise(function() {

    });
}



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

app.post('/usuario/nuevo/', async function(req, res) {
    try {
        let usuario = new Usuario({
            _id: req.body._id,
            idGoogle: req.body.idGoogle,
            email: req.body.email,
            pais: req.body.pais,
            provincia: req.body.provincia,
            tipoDocumento: req.body.tipoDocumento,
            documentoIdentidad: req.body.documentoIdentidad,
            fechaNacimiento: req.body.fechaNacimiento,
            nombre: req.body.nombre,
            clave: req.body.clave,
            hotel: req.body.hotel
        });


        usuario.save((err, exito) => {
            if (err) {
                return res.json({
                    ok: false
                });
            }

            res.json({
                ok: true
            });
        });

    } catch (e) {
        console.log('Fallo el registro del usuario: ' + e.message);
        res.json({
            ok: false
        });
    }
});


app.get('/agenda/buscar_entrada/', async function(req, res) {
    if (req.query.tipo_dni) {
        // console.log('Tipo dni: ' + req.query.tipo_dni);
        // console.log('Dni: ' + req.query.dni);
        let entradas = [];
        //busqueda por dni
        Entrada.find()
            //     .populate({
            //         path: 'usuario',
            //         // match: { documentoIdentidad: { $eq: req.body.dni }, tipoDocumento: req.query.tipo_dni },
            //         match: { documentoIdentidad: { $eq: req.body.dni } },
            //         select: '_id nombre tipoDocumento email pais provincia documentoIdentidad'
            //     })
            .populate('usuario', '_id nombre tipoDocumento email pais provincia documentoIdentidad')
            .populate('evento')
            .where({ activa: true })
            .exec((err, entrada) => {
                if (err) {
                    console.log('La busqueda produjo un error: ' + err.message);
                    return res.json({
                        ok: false
                    });
                }

                // console.log('entradas');
                // console.log(entrada);

                if (entrada.length == 0) {
                    console.log('No hay entradas');
                    return res.json({
                        ok: false
                    });
                }
                let hasta = entrada.length;
                let i = 0;
                while (i < hasta) {
                    // console.log('');
                    // console.log('Comparando tipo dni.');
                    // console.log('Tipo dni registro: ' + entrada[i].usuario.tipoDocumento);
                    // console.log('Tipo dni query: ' + req.query.tipo_dni);
                    // console.log('======================================');
                    // console.log('Comparando dni.');
                    // console.log('dni registro: ' + entrada[i].usuario.documentoIdentidad);
                    // console.log('dni query: ' + req.query.dni);
                    if (entrada[i].usuario.tipoDocumento == req.query.tipo_dni) {
                        // console.log('EL TIPO DE DNI COINCIDE');
                        if (entrada[i].usuario.documentoIdentidad == req.query.dni) {
                            if (entrada[i].entradaConfirmada) {
                                // console.log('SE AGREGA UNA ENTRADA');
                                entradas.push(entrada[i]);
                            }

                        }
                    }
                    i++;
                }
                // entrada = entrada.filter(function(entrada) {
                //     return entrada.usuario != null;
                // })

                console.log('El metodo de consulta de entrada encontro una entrada');
                // console.log(entrada[0]);
                return res.json({
                    ok: true,
                    entrada: entradas
                });
            });


    } else {
        Entrada.find({ _id: req.query.entrada })
            .populate('usuario', '_id nombre tipoDocumento email pais provincia documentoIdentidad')
            .populate('evento')
            .where({ activa: true })
            .exec((err, entrada) => {
                if (err) {
                    return res.json({
                        ok: false
                    });
                }

                if (entrada.length == 0) {
                    return res.json({
                        ok: false
                    });
                }

                // console.log('encontro una entrada: ');
                // console.log(entrada[0]);
                return res.json({
                    ok: true,
                    entrada: entrada[0]
                });
            });
    }

});



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
    let esLocal = true;
    let tieneHotel = true;
    let usuario;
    let fecha_ = new Date();
    // console.log('Valor de la variable -esNuevo-: ' + req.body.esNuevo);
    if (req.body.esNuevo) {
        //creo la cuenta del usuario
        // console.log('Datos a registrar');
        // console.log('=================');
        // console.log('Fecha y hora: ' + fecha_);
        // console.log('Pais: ' + req.body.usuario.pais);
        // console.log('Provincia: ' + req.body.usuario.provincia);
        // console.log('Nombre: ' + req.body.usuario.nombre);

        if (req.body.usuario.provincia) {
            if (req.body.usuario.provincia.toUpperCase() == 'JUJUY')
                esLocal = true;
            else {
                esLocal = false;
                if (req.body.usuario.hotel) {
                    tieneHotel = true;
                } else
                    tieneHotel = false;
            }

        }
        try {
            // let respuestaNuevoUsuario = await nuevoUsuario(usuario);
            // let usuario = new Usuario();
            usuario = new Usuario({
                idGoogle: req.body.usuario.idGoogle,
                email: req.body.usuario.email,
                pais: req.body.usuario.pais,
                provincia: req.body.usuario.provincia,
                tipoDocumento: req.body.usuario.tipoDocumento,
                documentoIdentidad: req.body.usuario.documentoIdentidad,
                fechaNacimiento: req.body.usuario.fechaNacimiento,
                nombre: req.body.usuario.nombre,
                clave: req.body.usuario.clave,
                hotel: req.body.usuario.hotel
            });

            usuario.save((err, usuarioSuccess) => {
                if (err) {
                    return res.json({
                        ok: false,
                        message: 'Correo ya registrado.',
                        codigo: -1
                    });
                }
                console.log('Se guardo el nuevo usuario en la base');
                Evento.find({ id: req.body.evento.id })
                    .exec((err2, eventoDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                message: 'La busqueda del evento produjo un error: ' + err2.message,
                                codigo: -1
                            });
                        }
                        // console.log('Evento encontrado');
                        if (esLocal) {
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
                                    // console.log('');
                                    // console.log('Se registro una nueva entrada');
                                    // console.log('=============================');
                                    // console.log('Fecha y hora: ' + fecha_);
                                    // console.log('evento: ' + eventoDB[0].nombreEvento);
                                    // console.log('usuario: ' + usuarioSuccess.nombre);
                                    // console.log('Se actualizo el cupo, ahora vale: ' + c);
                                });
                            } else {
                                //no hay cupo
                                if (eventoDB[0].urlCompraTicket == '-') { //no se puede comprar ticket
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento.',
                                        codigo: -1
                                    });
                                } else { //se puede comprar ticket
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento pero puede comprar una',
                                        codigo: -1
                                    });
                                }
                            }
                        } else { //no es local
                            if (tieneHotel) {
                                if (eventoDB[0].cupoExterno > 0) {
                                    let c = (eventoDB[0].cupoExterno - 1);
                                    let completo_ = false;
                                    if (c <= 0) {
                                        completo_ = true;
                                    }
                                    Evento.findOneAndUpdate({ _id: eventoDB[0]._id }, {
                                        $set: { cupoExterno: c, completo: completo_ }
                                    }, function(err1, success_) {
                                        if (err1) {
                                            console.log('La actualizacion del evento produjo un error: ' + err1.message);
                                            return res.json({
                                                ok: false,
                                                message: 'La actualizacion del evento produjo un error: ' + err1.message,
                                                codigo: -1
                                            })
                                        }
                                        // console.log('');
                                        // console.log('Se registro una nueva entrada');
                                        // console.log('=============================');
                                        // console.log('Fecha y hora: ' + fecha_);
                                        // console.log('evento: ' + eventoDB[0].nombreEvento);
                                        // console.log('usuario: ' + usuarioSuccess.nombre);
                                        // console.log('Se actualizo el cupo externo, ahora vale: ' + c);
                                    });
                                } else {
                                    //no hay cupo
                                    if (eventoDB[0].urlCompraTicket == '-') { //no se puede comprar ticket
                                        return res.json({
                                            ok: false,
                                            message: 'No quedan entradas gratuitas para este evento.',
                                            codigo: -1
                                        });
                                    } else { //se puede comprar ticket
                                        return res.json({
                                            ok: false,
                                            message: 'No quedan entradas gratuitas para este evento pero puede comprar una',
                                            codigo: -1
                                        });
                                    }
                                }
                            } else {
                                //no es local y no tiene hotel, no puede inscribirse
                                if (eventoDB[0].urlCompraTicket == '-') { //no se puede comprar ticket
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento.',
                                        codigo: -1
                                    });
                                } else { //se puede comprar ticket
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento pero puede comprar una',
                                        codigo: -1
                                    });
                                }
                            }
                        }

                        //ahora agrego el evento a la agenda del usuario
                        if (esLocal || tieneHotel) {
                            Usuario.findOneAndUpdate({ _id: usuarioSuccess._id }, { $push: { agenda: eventoDB[0]._id } },
                                function(err, success) {

                                    if (err) {
                                        return res.status(400).json({
                                            ok: false,
                                            message: 'No se pudo agregar el evento a la agenda',
                                            codigo: -1
                                        });
                                    }
                                    // genero el ticket de entrada
                                    let entrada = new Entrada({
                                        usuario: usuarioSuccess._id,
                                        evento: eventoDB[0]._id,
                                        entradaConfirmada: req.body.evento.entradaConfirmada
                                    });
                                    entrada.save();

                                    res.json({
                                        ok: true,
                                        message: 'El evento se agrego a la agenda',
                                        codigo: entrada._id
                                    });
                                });
                        }
                    });
            });
        } catch (e) {
            console.log('No se pudo dar de alta el usuario. Error ' + e.message);
            // return res.status(400).json({
            //     ok: false,
            //     message: 'No se pudo dar de alta el usuario. Error ' + e.message
            // });
        }
    } else {
        //no es nuevo, tengo que buscar al usuario y cagar el evento en la agenda
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
                } else
                    return res.json({
                        ok: false,
                        message: 'No hay usuarios con ese correo'
                    });
                // console.log(usuario[0]);

                if (usuario[0].provincia.toUpperCase() == 'JUJUY')
                    esLocal = true;
                else
                    esLocal = false;

                if (usuario[0].hotel != '-')
                    tieneHotel = true;
                else
                    tieneHotel = false;

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
                            if (esLocal) {
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
                                        // console.log('');
                                        // console.log('Se registro una nueva entrada');
                                        // console.log('=============================');
                                        // console.log('Fecha y hora: ' + fecha_);
                                        // console.log('evento: ' + eventoDB[0].nombreEvento);
                                        // console.log('usuario: ' + usuario[0].nombre);
                                        // console.log('Se actualizo el cupo externo, ahora vale: ' + c);
                                        // console.log('Se actualizo el cupo, ahora vale: ' + c);
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
                                                evento: eventoDB[0]._id,
                                                entradaConfirmada: req.body.evento.entradaConfirmada
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
                                            codigo: -1
                                        });
                                    } else { //se puede comprar ticket
                                        return res.json({
                                            ok: false,
                                            message: 'No quedan entradas gratuitas para este evento.',
                                            codigo: -1
                                        });
                                    }
                                }

                            } else {
                                if (tieneHotel) {
                                    //aqui debe tener en cuenta el cupo externo
                                    if (eventoDB[0].cupoExterno > 0) {
                                        let c = (eventoDB[0].cupoExterno - 1);
                                        let completo_ = false;
                                        if (c <= 0) {
                                            completo_ = true;
                                        }


                                        Evento.findOneAndUpdate({ _id: eventoDB[0]._id }, {
                                            $set: { cupoExterno: c, completo: completo_ }
                                        }, function(err1, success_) {
                                            if (err1) {
                                                console.log('La actualizacion del evento produjo un error: ' + err1.message);
                                                return res.json({
                                                    ok: false,
                                                    message: 'La actualizacion del evento produjo un error: ' + err1.message,
                                                    codigo: -1
                                                })
                                            }
                                            // console.log('');
                                            // console.log('Se registro una nueva entrada');
                                            // console.log('=============================');
                                            // console.log('Fecha y hora: ' + fecha_);
                                            // console.log('evento: ' + eventoDB[0].nombreEvento);
                                            // console.log('usuario: ' + usuario[0].nombre);
                                            // console.log('Se actualizo el cupo, ahora vale: ' + c);
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
                                                    evento: eventoDB[0]._id,
                                                    entradaConfirmada: req.body.evento.entradaConfirmada
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
                                                codigo: -1
                                            });
                                        } else { //se puede comprar ticket
                                            return res.json({
                                                ok: false,
                                                message: 'No quedan entradas gratuitas para este evento.',
                                                codigo: -1
                                            });
                                        }
                                    }
                                } else {
                                    //no tiene hotel, no puede reservar entrada
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento.',
                                        codigo: -1
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
    }



});

app.post('/agenda/agregar_evento_/', async function(req, res) {
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
    let esLocal = true;
    let tieneHotel = true;
    let usuario;
    let fecha_ = new Date();
    // console.log('Valor de la variable -esNuevo-: ' + req.body.esNuevo);
    if (req.body.esNuevo) {
        //creo la cuenta del usuario
        // console.log('');
        // console.log('Datos a registrar');
        // console.log('=================');
        // console.log('Fecha y hora: ' + fecha_);
        // console.log('Pais: ' + req.body.usuario.pais);
        // console.log('Provincia: ' + req.body.usuario.provincia);
        // console.log('Nombre: ' + req.body.usuario.nombre);

        if (req.body.usuario.provincia) {
            if (req.body.usuario.provincia.toUpperCase() == 'JUJUY')
                esLocal = true;
            else {
                esLocal = false;
                if (req.body.usuario.hotel) {
                    tieneHotel = true;
                } else
                    tieneHotel = false;
            }

        }
        try {
            // let respuestaNuevoUsuario = await nuevoUsuario(usuario);
            // let usuario = new Usuario();
            usuario = new Usuario({
                idGoogle: req.body.usuario.idGoogle,
                email: req.body.usuario.email,
                pais: req.body.usuario.pais,
                provincia: req.body.usuario.provincia,
                tipoDocumento: req.body.usuario.tipoDocumento,
                documentoIdentidad: req.body.usuario.documentoIdentidad,
                fechaNacimiento: req.body.usuario.fechaNacimiento,
                nombre: req.body.usuario.nombre,
                clave: req.body.usuario.clave,
                hotel: req.body.usuario.hotel
            });

            usuario.save((err, usuarioSuccess) => {
                if (err) {
                    return res.json({
                        ok: false,
                        message: 'Correo ya registrado.',
                        codigo: -1
                    });
                }
                console.log('Se guardo el nuevo usuario en la base');
                Evento.find({ id: req.body.evento.id })
                    .exec((err2, eventoDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                message: 'La busqueda del evento produjo un error: ' + err2.message,
                                codigo: -1
                            });
                        }
                        // console.log('Evento encontrado');
                        if (esLocal) {
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
                                    // console.log('');
                                    // console.log('Se registro una nueva entrada');
                                    // console.log('=============================');
                                    // console.log('Fecha y hora: ' + fecha_);
                                    // console.log('evento: ' + eventoDB[0].nombreEvento);
                                    // console.log('usuario: ' + usuarioSuccess.nombre);
                                    // console.log('Se actualizo el cupo, ahora vale: ' + c);
                                });
                            } else {
                                //no hay cupo
                                if (eventoDB[0].urlCompraTicket == '-') { //no se puede comprar ticket
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento.',
                                        codigo: -1
                                    });
                                } else { //se puede comprar ticket
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento pero puede comprar una',
                                        codigo: -1
                                    });
                                }
                            }
                        } else { //no es local
                            if (tieneHotel) {
                                if (eventoDB[0].cupoExterno > 0) {
                                    let c = (eventoDB[0].cupoExterno - 1);
                                    let completo_ = false;
                                    if (c <= 0) {
                                        completo_ = true;
                                    }
                                    Evento.findOneAndUpdate({ _id: eventoDB[0]._id }, {
                                        $set: { cupoExterno: c, completo: completo_ }
                                    }, function(err1, success_) {
                                        if (err1) {
                                            console.log('La actualizacion del evento produjo un error: ' + err1.message);
                                            return res.json({
                                                ok: false,
                                                message: 'La actualizacion del evento produjo un error: ' + err1.message,
                                                codigo: -1
                                            })
                                        }
                                        // console.log('');
                                        // console.log('Se registro una nueva entrada');
                                        // console.log('=============================');
                                        // console.log('Fecha y hora: ' + fecha_);
                                        // console.log('evento: ' + eventoDB[0].nombreEvento);
                                        // console.log('usuario: ' + usuarioSuccess.nombre);
                                        // console.log('Se actualizo el cupo externo, ahora vale: ' + c);
                                    });
                                } else {
                                    //no hay cupo
                                    if (eventoDB[0].urlCompraTicket == '-') { //no se puede comprar ticket
                                        return res.json({
                                            ok: false,
                                            message: 'No quedan entradas gratuitas para este evento.',
                                            codigo: -1
                                        });
                                    } else { //se puede comprar ticket
                                        return res.json({
                                            ok: false,
                                            message: 'No quedan entradas gratuitas para este evento pero puede comprar una',
                                            codigo: -1
                                        });
                                    }
                                }
                            } else {
                                //no es local y no tiene hotel, no puede inscribirse
                                if (eventoDB[0].urlCompraTicket == '-') { //no se puede comprar ticket
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento.',
                                        codigo: -1
                                    });
                                } else { //se puede comprar ticket
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento pero puede comprar una',
                                        codigo: -1
                                    });
                                }
                            }
                        }

                        //ahora agrego el evento a la agenda del usuario
                        if (esLocal || tieneHotel) {
                            Usuario.findOneAndUpdate({ _id: usuarioSuccess._id }, { $push: { agenda: eventoDB[0]._id } },
                                function(err, success) {

                                    if (err) {
                                        return res.status(400).json({
                                            ok: false,
                                            message: 'No se pudo agregar el evento a la agenda',
                                            codigo: -1
                                        });
                                    }
                                    // genero el ticket de entrada
                                    let entrada = new Entrada({
                                        usuario: usuarioSuccess._id,
                                        evento: eventoDB[0]._id,
                                        entradaConfirmada: req.body.evento.entradaConfirmada
                                    });
                                    entrada.save();

                                    res.json({
                                        ok: true,
                                        message: 'El evento se agrego a la agenda',
                                        codigo: entrada._id
                                    });
                                });
                        }
                    });
            });
        } catch (e) {
            console.log('No se pudo dar de alta el usuario. Error ' + e.message);
            // return res.status(400).json({
            //     ok: false,
            //     message: 'No se pudo dar de alta el usuario. Error ' + e.message
            // });
        }
    } else {
        //no es nuevo, tengo que buscar al usuario y cagar el evento en la agenda
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
                } else
                    return res.json({
                        ok: false,
                        message: 'No hay usuarios con ese correo'
                    });
                // console.log(usuario[0]);

                if (usuario[0].provincia.toUpperCase() == 'JUJUY')
                    esLocal = true;
                else
                    esLocal = false;

                if (usuario[0].hotel != '-')
                    tieneHotel = true;
                else
                    tieneHotel = false;

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
                            if (esLocal) {
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
                                        // console.log('');
                                        // console.log('Se registro una nueva entrada');
                                        // console.log('=============================');
                                        // console.log('Fecha y hora: ' + fecha_);
                                        // console.log('evento: ' + eventoDB[0].nombreEvento);
                                        // console.log('usuario: ' + usuario[0].nombre);
                                        // console.log('Se actualizo el cupo externo, ahora vale: ' + c);
                                        // console.log('Se actualizo el cupo, ahora vale: ' + c);
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
                                                evento: eventoDB[0]._id,
                                                entradaConfirmada: req.body.evento.entradaConfirmada
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
                                            codigo: -1
                                        });
                                    } else { //se puede comprar ticket
                                        return res.json({
                                            ok: false,
                                            message: 'No quedan entradas gratuitas para este evento.',
                                            codigo: -1
                                        });
                                    }
                                }

                            } else {
                                if (tieneHotel) {
                                    //aqui debe tener en cuenta el cupo externo
                                    if (eventoDB[0].cupoExterno > 0) {
                                        let c = (eventoDB[0].cupoExterno - 1);
                                        let completo_ = false;
                                        if (c <= 0) {
                                            completo_ = true;
                                        }


                                        Evento.findOneAndUpdate({ _id: eventoDB[0]._id }, {
                                            $set: { cupoExterno: c, completo: completo_ }
                                        }, function(err1, success_) {
                                            if (err1) {
                                                console.log('La actualizacion del evento produjo un error: ' + err1.message);
                                                return res.json({
                                                    ok: false,
                                                    message: 'La actualizacion del evento produjo un error: ' + err1.message,
                                                    codigo: -1
                                                })
                                            }
                                            // console.log('');
                                            // console.log('Se registro una nueva entrada');
                                            // console.log('=============================');
                                            // console.log('Fecha y hora: ' + fecha_);
                                            // console.log('evento: ' + eventoDB[0].nombreEvento);
                                            // console.log('usuario: ' + usuario[0].nombre);
                                            // console.log('Se actualizo el cupo, ahora vale: ' + c);
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
                                                    evento: eventoDB[0]._id,
                                                    entradaConfirmada: req.body.evento.entradaConfirmada
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
                                                codigo: -1
                                            });
                                        } else { //se puede comprar ticket
                                            return res.json({
                                                ok: false,
                                                message: 'No quedan entradas gratuitas para este evento.',
                                                codigo: -1
                                            });
                                        }
                                    }
                                } else {
                                    //no tiene hotel, no puede reservar entrada
                                    return res.json({
                                        ok: false,
                                        message: 'No quedan entradas gratuitas para este evento.',
                                        codigo: -1
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
    }



});


app.get('/agenda/obtener_eventos/', function(req, res) {
    let usuarios = [];

    Entrada.find()
        .populate('evento')
        .populate('usuario', 'nombre email tipoDocumento documentoIdentidad pais provincia')
        // .where({ 'usuario.email': req.query.email })
        .where({ activa: true })
        .exec((err, entradas) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: 'La busqueda de usuario devolvio un error: ' + err.message,
                    entradas
                });
            }
            if (entradas.length == 0) {
                return res.status(404).json({
                    ok: false,
                    message: 'Usuario no encontrado',
                    entradas
                });
            }

            entradas = entradas.filter(function(entradas) {
                return entradas.usuario.email == req.query.email;
            })


            if (entradas.length == 0) {
                return res.status(404).json({
                    ok: false,
                    message: 'El usuario no tiene entradas en su agenda',
                    entradas
                });
            }

            res.json({
                ok: true,
                message: 'Usuario encontrado',
                entradas
            });
        });
});

app.get('/agenda/obtener_eventos_de_usuario/', async function(req, res) {
    let usuarios = [];
    let URL = process.env.URL_SERVICE + process.env.PORT + '/agenda/buscar_entrada/?entrada=' + req.query.idEntrada;
    // console.log('La URL a acceder es: ' + URL);
    let entrada = await axios.get(URL);

    // console.log('El objeto que devuelve la funcion es: ');
    // console.log(entrada);
    if (entrada.data.ok) {
        Entrada.find()
            .populate('usuario', 'nombre email tipoDocumento documentoIdentidad pais provincia')
            .populate('evento')
            .where({ usuario: entrada.data.entrada.usuario, entradaConfirmada: false, activa: true })
            .exec((err, entradas) => {
                if (err) {
                    console.log('El servicio "obtener_eventos_de_usuario" produjo el error: ' + err.message);
                    return res.json({
                        ok: false,
                        message: 'La busqueda produjo un error: ' + err.message,
                        entradas: null
                    });
                }
                if (entradas.length == 0) {
                    console.log('El servicio "obtener_eventos_de_usurio" no produjo resultados');
                    return res.json({
                        ok: false,
                        message: 'El usuario no tiene entradas',
                        entradas: null
                    });
                }

                res.json({
                    ok: true,
                    message: 'El usuario tiene entradas pendientes',
                    entradas: entradas
                });

            });
    } else {
        console.log('No se pudo buscar la entrada');
        res.json({
            ok: true,
            message: 'No hay datos para esa entrada',
            entradas: null
        });
    }
});

app.post('/agenda/limpiar_eventos_no_confirmados/', function(req, res) {
    let eventos_ = []; //aqui voy a guardar todos los eventos a los que tengo que restituir la entrada
    Entrada.find()
        .populate('evento')
        .populate('usuario')
        // .where({ activa: true })
        .exec((err, entradas) => {
            if (err) {
                console.log('La busqueda eventos produjo un error: ' + err.message);
                return res.status(400).json({
                    ok: false,
                    message: 'La busqueda eventos produjo un error: ' + err.message
                });
            }

            if (entradas.length == 0) {
                return res.json({
                    ok: false,
                    message: 'No hay entradas para procesar'
                });
            }

            let hasta = entradas.length;
            let i = 0;
            let diaEvento = 0;
            while (i < hasta) {
                if (entradas[i].evento.fechaInicio.split(' ')[0].trim() == req.body.fecha) {
                    if (!entradas[i].entradaConfirmada) {
                        // console.log('');
                        // console.log('Entrada no confirmada, se procede a eliminar');
                        // console.log('=============================================');
                        // console.log('Usuario: ' + entradas[i].usuario.nombre);
                        // console.log('Evento: ' + entradas[i].evento.nombreEvento);
                        // console.log('Fecha y hora del evento: ' + entradas[i].evento.fechaInicio);



                        eventos_.push({
                            usuario: entradas[i].usuario._id,
                            evento: entradas[i].evento._id,
                            nombreEvento: entradas[i].evento.nombreEvento
                        });


                        Entrada.findOneAndUpdate({ _id: entradas[i]._id }, { $set: { activa: false } },
                            function(err, success) {

                                if (err) {
                                    exito = false;
                                    mensajeError = 'No se pudo quitar la entrada. Error: ' + err.message;
                                }
                                if (success.length == 0) {
                                    mensajeError = 'No se encontro la entrada';
                                }
                            });


                    } else {
                        // console.log('');
                        // console.log('Entrada confirmada, se mantiene');
                        // console.log('=============================================');
                        // console.log('Usuario: ' + entradas[i].usuario.nombre);
                        // console.log('Evento: ' + entradas[i].evento.nombreEvento);
                        // console.log('Fecha y hora del evento: ' + entradas[i].evento.fechaInicio);
                    }
                }
                i++;
            }

            //ahora veo que usuarios tengo que actualizar
            hasta = eventos_.length;
            i = 0;
            let eventos__ = [];
            while (i < hasta) {
                // console.log('');
                // console.log('Usuario: ' + eventos_[i].usuario);
                // console.log('Evento: ' + eventos_[i].evento);
                Usuario.findOneAndUpdate({ _id: eventos_[i].usuario }, { $pull: { agenda: eventos_[i].evento } },
                    function(err, success) {

                        if (err) {
                            exito = false;
                            mensajeError = 'No se pudo quitar la entrada. Error: ' + err.message;
                            // return res.status(400).json({
                            //     ok: false,
                            //     message: 'No se pudo confirmar la entrada. Error: ' + err.message
                            // });
                        }
                        if (success.length == 0) {
                            mensajeError = 'No se encontro la entrada';
                        }
                        console.log('Se quito la entrada');

                    });
                i++;
            }

            //por ultimo, restituyo las entradas recuperadas
            i = 0;
            let j = 0;
            while (i < hasta) {
                if (i == 0) {
                    let k = 0;
                    let cantidad = 0;
                    while (k < hasta) {
                        if (eventos_[i].evento == eventos_[k].evento) {
                            cantidad++;
                        }
                        k++;
                    }
                    eventos__.push({
                        evento: eventos_[i].evento,
                        nombreEvento: eventos_[i].nombreEvento,
                        cantidadRecuperada: cantidad
                    });
                } else {
                    let k = 0;
                    let cantidad = 0;
                    let existe = false;
                    while (k < eventos__.length) {
                        if (eventos_[i].evento == eventos__[k].evento) {
                            existe = true;
                        }
                        k++;
                    }
                    if (!existe) {
                        K = 0;
                        while (k < hasta) {
                            if (eventos_[i].evento == eventos_[k].evento) {
                                cantidad++;
                            }
                            k++;
                        }
                        eventos__.push({
                            evento: eventos_[i].evento,
                            nombreEvento: eventos_[i].nombreEvento,
                            cantidadRecuperada: cantidad
                        });
                    }
                }
                i++;
            }

            // i = 0;
            // console.log('');
            // console.log('Datos de entradas restituidas');
            // console.log('=============================')
            // while (i < eventos__.length) {
            //     console.log(eventos__[i].evento);
            //     console.log('Nombre Evento: ' + eventos__[i].nombreEvento);
            //     console.log('Cantidad: ' + eventos__[i].cantidadRecuperada);
            //     // Evento.find({ _id: eventos__[i].evento })
            //     //     .exec(async(err, encontrado) => {
            //     //         if (err) {
            //     //             console.log('La busqueda del evento para actualizar el cupo produjo un error');
            //     //         } else {
            //     //             if (encontrado.length == 0) {
            //     //                 console.log('No se encontro el evento para actualizar el cupo');
            //     //             } else {
            //     //                 //todo ok, paso a actualizar
            //     //                 await Evento.findOneAndUpdate({ _id: encontrado[0]._id }, { $set: { cupo: encontrado[0].cupo + eventos__[i].cantidadRecuperada } },
            //     //                     async function(err_, exito) {
            //     //                         if (err_) {
            //     //                             console.log('No se pudo recuperar el cupo');
            //     //                         } else {
            //     //                             if (exito.length == 0) {
            //     //                                 console.log('No hay un evento para actualizar el cupo');
            //     //                             } else {
            //     //                                 console.log('Cupo actualizado');
            //     //                             }
            //     //                         }
            //     //                     });
            //     //                 console.log('Cupo actualizado');
            //     //             }
            //     //         }

            //     //     });
            //     i++;
            // }

            console.log('Proceso de limpieza finalizado');
            res.json({
                ok: true,
                message: 'Proceso finalizado',
                recuperadas: eventos__
            });
        });
});

app.post('/agenda/confirmar_asistencia/', function(req, res) {

    let exito = true;
    let mensajeError = '';

    for (var i in req.body.entradas) {
        Entrada.findOneAndUpdate({ _id: req.body.entradas[i]._id }, { $set: { entradaConfirmada: true, usuarioConfirm: req.body.usuarioConfirm } },
            function(err, success) {

                if (err) {
                    exito = false;
                    mensajeError = 'No se pudo confirmar la entrada. Error: ' + err.message;
                    console.log(mensajeError);
                    // return res.status(400).json({
                    //     ok: false,
                    //     message: 'No se pudo confirmar la entrada. Error: ' + err.message
                    // });
                }
                if (success.length == 0) {
                    mensajeError = 'No se encontro la entrada';
                    console.log('No se encontro la entrada ');
                }
            });
    }
    if (exito) {
        console.log('Entrada confirmada');
        res.json({
            ok: true,
            message: 'La entrada fue confirmada'
        });
    } else
        return res.json({
            ok: false,
            message: mensajeError
        });
});

app.post('/config/agregar_campo_activa/', function(req, res) {

    Entrada.find()
        .exec((err, entradas) => {
            if (err) {
                console.log('Salto el error: ' + err.message);
            } else {
                if (entradas.length == 0) {
                    console.log('La consulta no devolvio resultados');
                } else {
                    let hasta = entradas.length;
                    let i = 0;
                    while (i < hasta) {
                        if (!entradas[i].activa) {
                            console.log('Entrada inactiva, no debe cambiar');
                        } else {
                            Entrada.findOneAndUpdate({ _id: entradas[i]._id }, { $set: { activa: true } },
                                function(err, success) {

                                    if (err) {
                                        exito = false;
                                        mensajeError = 'No se pudo cambiar la entrada a ACTIVA. Error: ' + err.message;
                                        console.log(mensajeError);
                                        // return res.status(400).json({
                                        //     ok: false,
                                        //     message: 'No se pudo confirmar la entrada. Error: ' + err.message
                                        // });
                                    } else {
                                        if (success.length == 0) {
                                            mensajeError = 'No se encontro la entrada';
                                            console.log('No se encontro la entrada ');
                                        } else {
                                            console.log('Se cambio el estado exitosamente');
                                        }
                                    }

                                });
                        }
                        i++;
                    }
                    res.json({
                        ok: true,
                        message: 'Proceso de insertar campo activo terminado'
                    });
                }
            }
        });
});


app.post('/usuarios/inscriptos/', function(req, res) {
    Entrada.find({ evento: req.body.evento })
        .populate('usuario')
        .where({ activa: true })
        .exec((err, entradas) => {
            if (err) {
                console.log('La consulta de entradas devolvio un error: ' + err.message);
                return res.json({
                    ok: false,
                    message: 'La consulta produjo un error: ' + err.message
                });
            }

            if (entradas.length == 0) {
                console.log('No hay entradas para ese evento');
                return res.json({
                    ok: false,
                    message: 'No hay entradas para ese evento'
                });
            }

            let hasta = entradas.length;
            let i = 0;
            let usuarios = [];
            let usuarios_ = [];
            while (i < hasta) {

                usuarios_.push({
                    nombre: entradas[i].usuario.nombre,
                    dni: entradas[i].usuario.documentoIdentidad,
                    correo: entradas[i].usuario.email
                });
                i++;
            }

            res.json({
                ok: true,
                usuarios_
            });

        })
});

app.post('/usuarios/todos/', function(req, res) {
    Usuario.find()
        .exec((err, usuarios) => {

            let i = 0;
            let hasta = usuarios.length;
            let usuarios_ = [];
            while (i < hasta) {
                usuarios_.push({
                    nombre: usuarios[i].nombre,
                    provincia: usuarios[i].provincia,
                    tipoDocumento: usuarios[i].tipoDocumento,
                    email: usuarios[i].email,
                    pais: usuarios[i].pais,
                    documentoIdentidad: usuarios[i].documentoIdentidad,
                    fechaNacimiento: usuarios[i].fechaNacimiento,
                    hotel: usuarios[i].hotel
                });
                i++;
            }
            res.json({
                usuarios: usuarios_
            });
        })
});



module.exports = app;