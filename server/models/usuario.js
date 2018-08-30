const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

let Schema = mongoose.Schema;

let usuarioSchema = new Schema({
    idGoogle: {
        type: String,
        default: '0'
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        default: '-'
    },
    clave: {
        type: String,
        default: '-'
    },
    agenda: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evento'
    }],
    fechaAlta: {
        type: Date,
        default: Date.now
    }
});
usuarioSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Usuario', usuarioSchema);