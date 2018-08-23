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
    }
});

module.exports = mongoose.model('Evento', eventoSchema);