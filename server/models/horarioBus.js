const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let horarioBusSchema = new Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    entrada: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entrada'
    },
    dia: {
        type: String
    },
    mes: {
        type: String
    },
    hora: {
        type: String
    },
    minuto: {
        type: String
    },
    destino: {
        type: String
    }
});

module.exports = mongoose.model('HorarioBus', horarioBusSchema);