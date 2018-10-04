//  PUERTO
process.env.PORT = process.env.PORT || 3001;

//URL DEL SERVICIO
process.env.URL_SERVICE = process.env.URL_SERVICE || 'http://localhost:'

//Entorno
process.env.NODE_ENV = process.env.NODE_ENV || 'dev;'

//base de datos
let urlDB;
if (process.env.NODE_ENV == 'prod') {
    urlDB = 'mongodb://localhost:27017/jujuy_andino';
} else {
    urlDB = 'mongodb://sa:Bintech123@ds229552.mlab.com:29552/jujuy_andino'
}


process.env.URLDB = urlDB;

// ============================
//  Vencimiento del Token
// ============================
// 60 segundos
// 60 minutos
// 24 horas
// 30 días
process.env.CADUCIDAD_TOKEN = 60 * 60 * 24 * 30;