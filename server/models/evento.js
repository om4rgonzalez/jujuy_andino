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
    fechaInicio: {
        type: Date
    },
    fechaFin: {
        type: Date
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
        default: 10000
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