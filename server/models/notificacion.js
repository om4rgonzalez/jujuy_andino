const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let notificacionSchema = new Schema({
    esDeEvento: {
        type: Boolean,
        default: true
    },
    idEvento: {
        type: Number
    },
    notificacion: {
        type: String,
        default: '-'
    },
    activo: {
        type: Boolean,
        default: true
    },
    fechaSubida: {
        type: String
    },
    fechaAlta: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('Notificacion', notificacionSchema);