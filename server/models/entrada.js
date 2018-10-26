const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let entradaSchema = new Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    evento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evento'
    },
    entradaConfirmada: {
        type: Boolean,
        default: false
    },
    usuarioConfirm: {
        type: String,
        default: '-'
    }
});

module.exports = mongoose.model('Entrada', entradaSchema);