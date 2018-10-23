const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let eventoSchema = new Schema({
    localidad: {
        type: String
    },
    nombreEvento: {
        type: String
    },
    lugar: {
        type: String
    },
    descripcion: {
        type: String
    },
    fechaInicio: {
        type: String
    },
    fechaFin: {
        type: String
    },
    latitud: {
        type: String
    },
    longitud: {
        type: String
    },
    id: {
        type: Number
    },
    completo: {
        type: Boolean,
        default: false
    },
    cupo: {
        type: Number,
        default: 1000000
    },
    cupoExterno: {
        type: Number,
        default: 1000000
    },
    color: {
        type: String
    },
    urlCompraTicket: {
        type: String,
        default: '-'
    }
});

module.exports = mongoose.model('Evento', eventoSchema);