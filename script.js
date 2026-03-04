/* DOM */

const trackCategorias = document.getElementById("trackCategorias");
const trackSubcategorias = document.getElementById("trackSubcategorias");

const acertijoContainer = document.getElementById("acertijoContainer");
const textoAcertijo = document.getElementById("textoAcertijo");

const respuestaUsuario = document.getElementById("respuesta");
const mensajeFeedback = document.getElementById("mensajeFeedback");

const btnVerificar = document.getElementById("btnVerificar");
const btnComodin = document.getElementById("btnComodin");

const textoComodin = document.getElementById("textoComodin");

let categoriaActual = null;
let subcategoriaActual = null;
let acertijoActual = null;
let comodinUsado = false;
let temporizador = null;
let tiempoRestante = 0;
let touchStartX = 0;
let touchMoved = false;
let puntajeTotal = 0;
let puntaje = 50;
// ===============================
// PROGRESO DEL JUGADOR
// ===============================
let progresoJugador = {};

const penalizaciones = {
    comodin: 0.05,        // 5%
    verRespuesta: 0.5     // 50%
};

const tiempoBaseCategoria = {
    Psicologia: 60,
    Biología: 50,
    Geografía: 70,
};

const ajusteTiempoSubcategoria = {
    Psicologia: {
        Apraxia_infaltil_del_habla: 60
    },
    Biología: {
        Células: 0,
        Genética: -5
    },
    Geografía: {
        Montañas: 10
    }
};
const bonusPorTiempo = {
    cadaSegundos: 5,   // cada cuántos segundos da puntos
    puntos: 1          // cuántos puntos da
};
/* SONIDOS DEL JUEGO (sonidos.js)*/

/* COLORES PARA CATEGORÍAS Y SUBCATEGORÍAS (ColorCatSub.js)*/

const puntosBase = {
    correcto: 10,
    incorrecto: -5
};
// ===============================
// MULTIPLICADORES DE DIFICULTAD (MultiplicadoresDific.js)
// ===============================

/* CREAR BOTÓN DE CATEGORÍA */
function crearBotonCategoria(idCategoria) {

    const nombreVisible = acertijos[idCategoria].nombre || idCategoria;

    const label = document.createElement("label");

    label.className = "carousel-item categoria-item";

    // IMPORTANTE: el dataset usa el ID interno
    label.dataset.categoria = idCategoria;

    label.innerHTML = `
        <input type="radio" name="categoria">
        <span class="texto-wrapper">
            <span class="texto-scroll">${nombreVisible}</span>
        </span>
    `;

    // Color sigue usando el ID interno
    if (coloresCategorias[idCategoria]) {
        label.style.backgroundColor = coloresCategorias[idCategoria];
    }

    const wrapper = label.querySelector(".texto-wrapper");
    detectarOverflowTexto(wrapper);

    return label;
}

/* CREAR BOTÓN DE SUBCATEGORÍA */
function crearBotonSubcategoria(idCategoria, idSubcategoria) {

    const nombreVisible =
        acertijos[idCategoria]
            .subcategorias[idSubcategoria]
            .nombre || idSubcategoria;

    const label = document.createElement("label");

    label.className = "carousel-item subcategoria-item";

    // usar IDs internos
    label.dataset.categoria = idCategoria;
    label.dataset.sub = idSubcategoria;

    label.innerHTML = `
        <input type="radio" name="subcategoria">
        <span class="texto-wrapper">
            <span class="texto-scroll">${nombreVisible}</span>
        </span>
    `;

    // color usando ID interno
    if (coloresSubcategorias[idSubcategoria]) {
        label.style.backgroundColor =
            coloresSubcategorias[idSubcategoria];
    }

    const wrapper = label.querySelector(".texto-wrapper");
    detectarOverflowTexto(wrapper);

    return label;
}

/* CARGAR CATEGORÍAS */
function cargarCategorias() {
    trackCategorias.innerHTML = "";

    for (let categoria in acertijos) {
        trackCategorias.appendChild(crearBotonCategoria(categoria));
    }
}

cargarCategorias();

/* CLICK EN CATEGORÍA → SUBCATEGORÍAS */
trackCategorias.addEventListener("click", (e) => {

    // Evitar radios
    if (e.target.tagName === "INPUT") return;

    const item = e.target.closest(".categoria-item");
    if (!item) return;

    const categoria = item.dataset.categoria;

    /* ===============================
       CATEGORÍA COMPLETADA
    =============================== */
    if (item.classList.contains("categoria-completada")) {

        // MÓVIL → mostrar modal
        if (window.matchMedia("(pointer: coarse)").matches) {
            mostrarCategoriaCompletada(categoria);
            return; // NO cargar subcategorías
        }

        // PC → alternar texto (usar nombre visible)
        const texto = item.querySelector(".texto-scroll");
        if (!texto) return;

        const visible = nombreCategoriaVisible(categoria);

        if (item.dataset.toggle === "nombre") {
            texto.textContent = "✓ Completado";
            item.dataset.toggle = "completado";
        } else {
            texto.textContent = visible;      // aquí ya no sale "_"
            item.dataset.toggle = "nombre";
        }

        // (opcional pero recomendado) recalcular overflow por si cambia el texto
        detectarOverflowTexto(item.querySelector(".texto-wrapper"));

        return; // NO cargar subcategorías
    }

    /* ===============================
       CATEGORÍA NORMAL
    =============================== */
    comodinUsado = false;
    btnComodin.textContent = "Comodín";

    categoriaActual = categoria;
    subcategoriaActual = null;
    acertijoActual = null;

    trackSubcategorias.innerHTML = "";
    textoAcertijo.textContent = "";
    respuestaUsuario.value = "";
    mensajeFeedback.textContent = "";
    textoComodin.classList.add("hidden");

    const subcategorias =
        acertijos[categoriaActual].subcategorias;

    for (let sub in subcategorias) {
        trackSubcategorias.appendChild(
            crearBotonSubcategoria(categoriaActual, sub)
        );
    }

    actualizarEstadoSubcategorias();

    const totalCategoria = contarAcertijosCategoria(categoriaActual);
    const correctosCategoria = contarCorrectosCategoria(categoriaActual);

    actualizarContadorUI(totalCategoria, correctosCategoria);
});
/* CLICK EN SUBCATEGORÍA → ACERTIJO */
trackSubcategorias.addEventListener("click", (e) => {

    if (e.target.tagName === "INPUT") return;

    const item = e.target.closest(".subcategoria-item");
    if (!item) return;

    const categoria = item.dataset.categoria;
    const sub = item.dataset.sub;

    // Si está completada → SOLO mostrar info
    if (item.classList.contains("subcategoria-completada")) {

        // En móvil: mostrar modal (mejor UX)
        if (window.matchMedia("(hover: none)").matches) {
            mostrarSubcategoriaCompletada(sub);
            return;
        }

        // En PC: toggle de texto (usar nombre visible)
        const texto = item.querySelector(".texto-scroll");
        if (!texto) return;

        const visible = nombreSubcategoriaVisible(categoria, sub);

        if (item.dataset.toggle !== "nombre") {
            texto.textContent = visible;      // aquí ya no sale "_"
            item.dataset.toggle = "nombre";
        } else {
            texto.textContent = "✓ Completado";
            item.dataset.toggle = "completado";
        }

        // (opcional pero recomendado)
        detectarOverflowTexto(item.querySelector(".texto-wrapper"));

        return;
    }

    // Subcategoría normal
    categoriaActual = categoria;
    subcategoriaActual = sub;

    bloquearJuego(false);

    acertijoActual = null;
    comodinUsado = false;
    btnComodin.textContent = "Comodín";

    respuestaUsuario.value = "";
    mensajeFeedback.textContent = "";
    textoComodin.classList.add("hidden");

    acertijoContainer.classList.remove("hidden");
    cargarAcertijoAleatorio();

    const totalSub = contarAcertijosSubcategoria(categoria, sub);
    const correctosSub = contarCorrectosSubcategoria(categoria, sub);

    actualizarContadorUI(totalSub, correctosSub);
});
/* BOTÓN VERIFICAR RESPUESTA */
btnVerificar.addEventListener("click", () => {

    // No hay subcategoría seleccionada
    if (!acertijoActual) {
        sonidoError.play();
        return;
    }

    // Hay subcategoría, pero el input está vacío
    if (respuestaUsuario.value.trim() === "") {
        sonidoVerificar.play();
        return;
    }

    // --- Lógica normal ---
    const userNorm = normalizarRespuesta(respuestaUsuario.value);

    const esCorrecta = acertijoActual.clave.some(resp => {
        const claveNorm = normalizarRespuesta(resp);

        // comparación exacta ya sin acentos ni signos
        if (claveNorm === userNorm) return true;

        // EXTRA (muy útil): si la clave trae varias respuestas separadas por coma/punto y coma/slash/etc.
        // entonces también acepta que el usuario escriba una de esas partes.
        const partes = claveNorm.split(/\s*(?:,|;|\/|\bor\b|\bo\b|\by\b)\s*/i).filter(Boolean);
        return partes.includes(userNorm);
    });

    // PUNTAJE (AQUÍ VA)
    const puntosGanados = calcularPuntaje(esCorrecta);
    actualizarPuntaje(puntosGanados);

    if (esCorrecta) {
        marcarAcertijoComoResuelto();

        // feedback inmediato
        sonidoCorrecto.play();
        vibrar("correcto");
        mostrarFeedbackVisual(true);

        // contadores
        const totalSub = contarAcertijosSubcategoria(
            categoriaActual,
            subcategoriaActual
        );
        const correctosSub = contarCorrectosSubcategoria(
            categoriaActual,
            subcategoriaActual
        );
        actualizarContadorUI(totalSub, correctosSub);
    } else {
        sonidoIncorrecto.play();
        vibrar("incorrecto");
    }

    mostrarFeedbackVisual(esCorrecta);

    mensajeFeedback.textContent = esCorrecta
        ? `✔ ¡Correcto! +${puntosGanados} pts`
        : `❌ Incorrecto ${puntosGanados} pts`;

    mensajeFeedback.style.color = esCorrecta ? "green" : "red";

    // Cargar siguiente acertijo
    btnVerificar.disabled = true;
    btnComodin.disabled = true;

    setTimeout(() => {
        mensajeFeedback.textContent = "";
        respuestaUsuario.value = "";

        // SI ES CORRECTA → avanzar al siguiente acertijo / completar subcategoría
        if (esCorrecta) {

            const progreso =
                progresoJugador[categoriaActual]?.[subcategoriaActual];

            // SUBCATEGORÍA COMPLETADA
            if (progreso?.completado) {
                clearInterval(temporizador);
                acertijoActual = null;

                bloquearJuego(true);

                marcarSubcategoriaCompletada(
                    categoriaActual,
                    subcategoriaActual
                );

                mostrarSubcategoriaCompletada(subcategoriaActual);
                return;
            }

            // normal: pasar al siguiente
            btnVerificar.disabled = false;
            btnComodin.disabled = false;
            cargarAcertijoAleatorio();
            return;
        }

        // ❌ SI ES INCORRECTA → NO cambiar de acertijo
        // Solo reactivar botones y dejar el mismo acertijoActual
        btnVerificar.disabled = false;
        btnComodin.disabled = false;

    }, 2000);
});
/* BOTÓN COMODÍN */
btnComodin.addEventListener("click", () => {
    if (!acertijoActual) {
        sonidoError.play();
        return;
    }

    // Primer uso → COMODÍN (5% de penalización)
    if (!comodinUsado) {
        sonidoComodin.play();
        mostrarModalComodin(acertijoActual.comodin);

        // Penalización dinámica del 5%
        aplicarPenalizacion(penalizaciones.comodin);

        comodinUsado = true;
        btnComodin.textContent = "Ver respuesta";
        return;
    }

    // Segundo uso → CONFIRMAR VER RESPUESTA (50%)
    mostrarModalConfirmacion();
});
function contarAcertijosCategoria(categoria) {
    let total = 0;

    const subcategorias =
        acertijos[categoria].subcategorias;

    for (let sub in subcategorias) {
        total += subcategorias[sub].acertijos.length;
    }

    return total;
}
function contarAcertijosSubcategoria(categoria, subcategoria) {
    return acertijos[categoria]
        .subcategorias[subcategoria]
        .acertijos.length;
}
function actualizarContadorUI(totales, correctos) {
    document.getElementById("contadorAcertijosTotales").textContent =
        `Acertijos totales: ${totales}`;

    document.getElementById("contadorAcertijosCorrectos").textContent =
        `${correctos}`;
}
function mostrarModalComodin(texto) {
    // Evitar múltiples modales
    if (document.getElementById("modalComodin")) return;

    const modal = document.createElement("div");
    modal.id = "modalComodin";
    modal.className = "modal-comodin-overlay";

    modal.innerHTML = `
        <div class="modal-comodin-box">
            <h3>💡 Comodín</h3>
            <p>${texto}</p>
            <button onclick="cerrarModalComodin()">Cerrar</button>
        </div>
    `;

    document.body.appendChild(modal);
}

function cerrarModalComodin() {
    const modal = document.getElementById("modalComodin");
    if (modal) modal.remove();
}
function mostrarModalConfirmacion() {
    if (document.getElementById("modalConfirmacion")) return;

    const modal = document.createElement("div");
    modal.id = "modalConfirmacion";
    modal.className = "modal-comodin-overlay";

    modal.innerHTML = `
        <div class="modal-comodin-box">
            <h3>⚠️ Advertencia</h3>
            <p>¿Estás seguro de que quieres ver la respuesta?</p>
            <button onclick="confirmarVerRespuesta()">Continuar</button>
            <button onclick="cerrarModalConfirmacion()">Cancelar</button>
        </div>
    `;

    document.body.appendChild(modal);
}
function confirmarVerRespuesta() {
    if (!acertijoActual) return;

    //Detener temporizador
    clearInterval(temporizador);

    cerrarModalConfirmacion();

    // Penalización: perder la mitad de los puntos
    const penalizacion = Math.floor(puntaje / 2);
    puntaje -= penalizacion;

    // Refrescar UI del puntaje
    actualizarPuntaje(0);

    //Mostrar respuesta
    respuestaUsuario.value = acertijoActual.clave[0];

    //Bloquear interfaz
    bloquearInterfaz(true);

    // Esperar 2 segundos
    setTimeout(() => {
        // Limpiar input
        respuestaUsuario.value = "";

        //Desbloquear interfaz
        bloquearInterfaz(false);

        //Reset comodín
        comodinUsado = false;
        btnComodin.textContent = "Comodín";

        //Cargar nuevo acertijo
        cargarAcertijoAleatorio();

        //Calcular tiempo correcto
        const tiempoFinal = obtenerTiempoPorCategoria(
            categoriaActual,
            subcategoriaActual
        );

        //Reiniciar temporizador CON VALOR
        iniciarTemporizador(tiempoFinal);

    }, 2000);
}
function cerrarModalConfirmacion() {
    const modal = document.getElementById("modalConfirmacion");
    if (modal) modal.remove();
}
function cargarAcertijoAleatorio() {
    if (!categoriaActual || !subcategoriaActual) return;

    inicializarProgresoSubcategoria(categoriaActual, subcategoriaActual);

    const progreso =
        progresoJugador[categoriaActual][subcategoriaActual];

    // Ya completada → aviso inmediato
    if (progreso.completado) {
        return;
    }

    // Elegir pendiente
    const indice = Math.floor(
        Math.random() * progreso.pendientes.length
    );

    acertijoActual = progreso.pendientes[indice];
    acertijoActual._indiceProgreso = indice;

    textoAcertijo.textContent = acertijoActual.pista;

    comodinUsado = false;
    btnComodin.textContent = "Comodín";

    const tiempoFinal = obtenerTiempoPorCategoria(
        categoriaActual,
        subcategoriaActual
    );

    iniciarTemporizador(tiempoFinal);
}
function bloquearInterfaz(bloquear) {
    // Botones
    btnVerificar.disabled = bloquear;
    btnComodin.disabled = bloquear;

    // Input
    respuestaUsuario.disabled = bloquear;

    // Carruseles
    trackCategorias.style.pointerEvents = bloquear ? "none" : "auto";
    trackSubcategorias.style.pointerEvents = bloquear ? "none" : "auto";

    // Efecto visual opcional
    const opacidad = bloquear ? "0.6" : "1";
    btnVerificar.style.opacity = opacidad;
    btnComodin.style.opacity = opacidad;
    respuestaUsuario.style.opacity = opacidad;
}
function bloquearJuego(bloquear) {
    btnVerificar.disabled = bloquear;
    btnComodin.disabled = bloquear;
    respuestaUsuario.disabled = bloquear;

    const opacidad = bloquear ? "0.6" : "1";
    btnVerificar.style.opacity = opacidad;
    btnComodin.style.opacity = opacidad;
    respuestaUsuario.style.opacity = opacidad;
}
function obtenerTiempoPorCategoria(categoria, subcategoria) {
    let tiempo = tiempoBaseCategoria[categoria] || 60;

    if (
        ajusteTiempoSubcategoria[categoria] &&
        ajusteTiempoSubcategoria[categoria][subcategoria] !== undefined
    ) {
        tiempo += ajusteTiempoSubcategoria[categoria][subcategoria];
    }

    // Evitar tiempos ridículos
    return Math.max(tiempo, 15);
}
function iniciarTemporizador(segundos) {

    // Detener cualquier temporizador anterior
    clearInterval(temporizador);

    // Seguridad: asegurar número válido
    tiempoRestante = Number(segundos);

    if (isNaN(tiempoRestante) || tiempoRestante <= 0) {
        tiempoRestante = 60; // fallback seguro
    }

    const temporizadorUI = document.getElementById("temporizador");
    temporizadorUI.textContent = `⏳ ${tiempoRestante}s`;

    temporizador = setInterval(() => {
        tiempoRestante--;
        temporizadorUI.textContent = `⏳ ${tiempoRestante}s`;

        // Tiempo agotado
        if (tiempoRestante <= 0) {
            clearInterval(temporizador);
            manejarTiempoAgotado();
        }
    }, 1000);
}
function manejarTiempoAgotado() {
    mensajeFeedback.textContent = "⏰ Tiempo agotado";
    mensajeFeedback.style.color = "orange";

    btnVerificar.disabled = true;
    btnComodin.disabled = true;

    setTimeout(() => {
        mensajeFeedback.textContent = "";
        btnVerificar.disabled = false;
        btnComodin.disabled = false;
        cargarAcertijoAleatorio();
    }, 2000);
}
function mostrarFeedbackVisual(esCorrecta) {
    const gameContainer = document.querySelector(".game-container");

    // Limpiar animaciones anteriores
    gameContainer.classList.remove("shake", "bounce");

    // Forzar reflow (truco para reiniciar animación)
    void gameContainer.offsetWidth;

    if (esCorrecta) {
        gameContainer.classList.add("bounce");
    } else {
        gameContainer.classList.add("shake");
    }
}
function vibrar(tipo) {
    if (!navigator.vibrate) return;

    if (tipo === "correcto") {
        navigator.vibrate(80); // vibración corta y limpia
    }
    else if (tipo === "incorrecto") {
        navigator.vibrate([60, 40, 60]); // doble vibración
    }
}
function calcularPuntaje(esCorrecta) {
    // Puntos base
    let puntos = esCorrecta
        ? puntosBase.correcto
        : puntosBase.incorrecto;

    // Multiplicador por categoría
    const multiCat = multiplicadorCategoria[categoriaActual] || 1;
    puntos *= multiCat;

    // Multiplicador por subcategoría
    if (
        multiplicadorSubcategoria[categoriaActual] &&
        multiplicadorSubcategoria[categoriaActual][subcategoriaActual]
    ) {
        puntos *= multiplicadorSubcategoria[categoriaActual][subcategoriaActual];
    }

    // Bonus por tiempo (solo si es correcta)
    if (esCorrecta && tiempoRestante > 0) {
        const bonusTiempo = Math.floor(
            tiempoRestante / bonusPorTiempo.cadaSegundos
        ) * bonusPorTiempo.puntos;

        puntos += bonusTiempo;
    }

    // Redondear para evitar decimales raros
    return Math.round(puntos);
}
function actualizarPuntaje(puntos) {
    puntaje += puntos;
    document.getElementById("puntaje").textContent = `Puntaje: ${puntaje}`;
}
function aplicarPenalizacion(porcentaje) {
    if (puntaje <= 0) return;

    let penalizacion = Math.floor(puntaje * porcentaje);

    // Mínimo 1 punto
    penalizacion = Math.max(1, penalizacion);

    puntaje -= penalizacion;

    actualizarPuntaje(0); // solo refresca UI
}
function actualizarUI() {
    document.getElementById("temporizador").textContent =
        `${tiempoRestante}s`;
}
function inicializarProgresoSubcategoria(categoria, subcategoria) {
    if (!progresoJugador[categoria]) {
        progresoJugador[categoria] = {};
    }

    if (progresoJugador[categoria][subcategoria]) return;

    // USAR acertijos (NO bancoAcertijos)
    const acertijosOriginales =
        acertijos[categoria]
            .subcategorias[subcategoria]
            .acertijos;

    progresoJugador[categoria][subcategoria] = {
        pendientes: [...acertijosOriginales],
        total: acertijosOriginales.length,
        completado: false
    };
}
function marcarAcertijoComoResuelto() {
    const progreso =
        progresoJugador[categoriaActual][subcategoriaActual];

    progreso.pendientes.splice(acertijoActual._indiceProgreso, 1);

    // Solo marcar flags
    if (progreso.pendientes.length === 0) {
        progreso.completado = true;
    }
}
function subcategoriaCompletada(categoria, subcategoria) {
    return (
        progresoJugador[categoria] &&
        progresoJugador[categoria][subcategoria] &&
        progresoJugador[categoria][subcategoria].completado === true
    );
}
function reactivarJuego() {
    // Desbloquear interfaz
    bloquearJuego(false);

    // Limpiar estados
    acertijoActual = null;
    comodinUsado = false;

    respuestaUsuario.value = "";
    mensajeFeedback.textContent = "";

    btnComodin.textContent = "Comodín";

    if (categoriaActual && subcategoriaActual) {
        const tiempoFinal = obtenerTiempoPorCategoria(
            categoriaActual,
            subcategoriaActual
        );
        iniciarTemporizador(tiempoFinal);
    }
}
function finalizarSubcategoria(categoria, subcategoria) {
    const progreso = progresoJugador[categoria][subcategoria];
    progreso.completado = true;

    clearInterval(temporizador);
    temporizador = null;

    acertijoActual = null;
    subcategoriaActual = null;

    bloquearJuego(true);

    marcarSubcategoriaCompletada(categoria, subcategoria);
    mostrarSubcategoriaCompletada(subcategoria);
}
function actualizarEstadoSubcategorias() {
    const botones = document.querySelectorAll(".subcategoria-item");

    botones.forEach(boton => {
        const categoria = boton.dataset.categoria;
        const sub = boton.dataset.sub;

        if (subcategoriaCompletada(categoria, sub)) {
            boton.classList.add("subcategoria-completada");

            // Texto real (NO ✓ aquí)
            const texto = boton.querySelector(".texto-scroll");
            texto.textContent = sub;

            // Reset toggle
            boton.dataset.toggle = "nombre";

            // Recalcular overflow
            const wrapper = boton.querySelector(".texto-wrapper");
            detectarOverflowTexto(wrapper);
        }
    });
}
function marcarSubcategoriaCompletada(categoria, sub) {
    const botones = document.querySelectorAll(".subcategoria-item");

    botones.forEach(boton => {
        if (
            boton.dataset.categoria === categoria &&
            boton.dataset.sub === sub
        ) {
            boton.classList.add("subcategoria-completada");
            boton.dataset.toggle = "completado";

            const texto = boton.querySelector(".texto-scroll");
            texto.textContent = "✓ Completado";

            const wrapper = boton.querySelector(".texto-wrapper");
            detectarOverflowTexto(wrapper);
        }
    });
}
function categoriaCompletada(categoria) {

    // Total real de subcategorías
    const subcategoriasReales =
        Object.keys(acertijos[categoria].subcategorias);

    // Si aún no existe progreso → NO completada
    if (!progresoJugador[categoria]) return false;

    // Verificar TODAS las subcategorías reales
    return subcategoriasReales.every(sub => {
        return (
            progresoJugador[categoria][sub] &&
            progresoJugador[categoria][sub].completado === true
        );
    });
}
function marcarCategoriaCompletada(nombreCategoria) {
    const botones = document.querySelectorAll(".categoria-item");

    botones.forEach(boton => {
        if (boton.dataset.categoria === nombreCategoria) {
            boton.classList.add("categoria-completada");

            const texto = boton.querySelector(".texto-scroll");
            texto.textContent = "✓ Completado";

            boton.dataset.toggle = "completado";

            // recalcular overflow por seguridad
            const wrapper = boton.querySelector(".texto-wrapper");
            detectarOverflowTexto(wrapper);
        }
    });
}
function mostrarSubcategoriaCompletada(nombreSubcategoria) {
    if (document.getElementById("modalSubcategoria")) return;

    // Convertir a nombre visible (bonito) para el modal
    const subVisible = nombreSubcategoriaVisible(categoriaActual, nombreSubcategoria);

    const modal = document.createElement("div");
    modal.id = "modalSubcategoria";
    modal.className = "modal-comodin-overlay";

    modal.innerHTML = `
        <div class="modal-subcategoria-box">
            <h3>🎉 ¡Subcategoría completada!</h3>
            <p>Has completado la subcategoría:</p>
            <p><strong>${subVisible}</strong></p>
            <button id="btnCerrarSubcategoria">Aceptar</button>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("btnCerrarSubcategoria")
        .addEventListener("click", () => {
            modal.remove();

            // AQUÍ VA ESTE BLOQUE 
            if (
                categoriaCompletada(categoriaActual) &&
                !progresoJugador[categoriaActual]._modalCategoriaMostrado
            ) {
                progresoJugador[categoriaActual]._modalCategoriaMostrado = true;

                // MARCAR VISUALMENTE LA CATEGORÍA
                marcarCategoriaCompletada(categoriaActual);

                // MOSTRAR MODAL (le pasamos el ID, pero adentro se ve bonito)
                mostrarCategoriaCompletada(categoriaActual);
            }
        });
}
function mostrarCategoriaCompletada(nombreCategoria) {
    // Evitar duplicados
    if (document.getElementById("modalCategoria")) return;

    // Convertir a nombre visible (bonito) para el modal
    const catVisible = nombreCategoriaVisible(nombreCategoria);

    const modal = document.createElement("div");
    modal.id = "modalCategoria";
    modal.className = "modal-comodin-overlay";

    modal.innerHTML = `
        <div class="modal-subcategoria-box">
            <h3>🎉 ¡Categoría completada!</h3>
            <p>Has completado la categoría:</p>
            <p><strong>${catVisible}</strong></p>
            <button id="btnCerrarCategoria">Aceptar</button>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("btnCerrarCategoria")
        .addEventListener("click", () => {
            modal.remove();
        });
}
function contarCorrectosSubcategoria(categoria, subcategoria) {
    const progreso = progresoJugador[categoria]?.[subcategoria];
    if (!progreso) return 0;

    return progreso.total - progreso.pendientes.length;
}
function contarCorrectosCategoria(categoria) {
    if (!progresoJugador[categoria]) return 0;

    let correctos = 0;

    for (let sub in progresoJugador[categoria]) {
        if (progresoJugador[categoria][sub].total !== undefined) {
            correctos +=
                progresoJugador[categoria][sub].total -
                progresoJugador[categoria][sub].pendientes.length;
        }
    }

    return correctos;
}

function detectarOverflowTexto(wrapper) {
    const texto = wrapper.querySelector(".texto-scroll");
    if (!texto) return;

    // Reset total
    wrapper.removeAttribute("data-overflow");
    texto.style.transform = "translateX(0)";
    texto.style.removeProperty("--scroll-x");

    requestAnimationFrame(() => {
        const anchoTexto = texto.scrollWidth;
        const anchoWrapper = wrapper.clientWidth;

        if (anchoTexto > anchoWrapper) {
            const margenExtra = 32; // evita cortes finales
            const desplazamiento = anchoTexto - anchoWrapper + margenExtra;

            wrapper.setAttribute("data-overflow", "true");
            texto.style.setProperty("--scroll-x", `-${desplazamiento}px`);
        }
    });
}
document.addEventListener("click", (e) => {
    const wrapper = e.target.closest(".texto-wrapper[data-overflow='true']");
    if (!wrapper) return;

    // cerrar otros
    document
        .querySelectorAll(".texto-wrapper.mostrar")
        .forEach(w => {
            if (w !== wrapper) {
                w.classList.remove("mostrar");
                w.classList.remove("animar");
            }
        });

    // toggle actual
    const activar = !wrapper.classList.contains("mostrar");
    wrapper.classList.toggle("mostrar", activar);

    if (activar) {
        wrapper.classList.remove("animar");
        void wrapper.offsetWidth;
        wrapper.classList.add("animar");
    }
});
function nombreCategoriaVisible(idCategoria) {
    // Si en tu estructura guardas un nombre personalizado:
    // acertijos[idCategoria].nombre
    return (acertijos[idCategoria] && acertijos[idCategoria].nombre)
        ? acertijos[idCategoria].nombre
        : idCategoria.replaceAll("_", " ");
}

function nombreSubcategoriaVisible(idCategoria, idSubcategoria) {
    // Si guardas nombre en: acertijos[idCategoria].subcategorias[idSubcategoria].nombre
    const subObj = acertijos?.[idCategoria]?.subcategorias?.[idSubcategoria];

    if (subObj && subObj.nombre) return subObj.nombre;

    // fallback: reemplazar _ por espacio
    return idSubcategoria.replaceAll("_", " ");
}
function normalizarRespuesta(txt) {
    return (txt ?? "")
        .toString()
        .trim()
        // 1) minúsculas
        .toLowerCase()
        // 2) quitar acentos
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        // 3) quitar puntuación y símbolos (deja letras/números/espacios)
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        // 4) colapsar espacios
        .replace(/\s+/g, " ")
        .trim();
}