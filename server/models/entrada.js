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
    }
});

module.exports = mongoose.model('Entrada', entradaSchema);