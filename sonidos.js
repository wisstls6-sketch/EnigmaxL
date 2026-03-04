/* SONIDOS DEL JUEGO */

const sonidoComodin = new Howl({
    src: ['Comodin.mp3'],
    volume: 0.9
});
const sonidoVerificar = new Howl({
    src: ['Verificar.mp3'],
    volume: 0.9
});

const sonidoError = new Howl({
    src: ['Noseleccionado.mp3'],
    volume: 0.9
});

const sonidoCorrecto = new Howl({
    src: ['Correcto.mp3'],
    volume: 1.0
});

const sonidoIncorrecto = new Howl({
    src: ['Incorrecto.mp3'],
    volume: 0.9
});