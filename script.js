// --- AUTO SCROLL AL FONDO (CORREGIDO PARA CUALQUIER DISPOSITIVO) ---
window.addEventListener('load', () => {
    // Forzamos el scroll al fondo de la pagina al cargar
    setTimeout(() => {
        const bottomElement = document.getElementById('bottom-anchor');
        if(bottomElement) {
            bottomElement.scrollIntoView({ behavior: 'auto', block: 'end' });
        } else {
            window.scrollTo(0, document.body.scrollHeight);
        }
    }, 100);
});

// --- AUDIO: TAP PARA REPRODUCIR / TAP DE NUEVO PARA PAUSAR ---
const bgMusic = document.getElementById('bg-music');
bgMusic.volume = 0.35;

function toggleAudio(e) {
    // No hacer nada si el tap fue sobre un botón, link, input o el modal
    if (e.target.closest('button, a, input, .modal')) return;

    if (bgMusic.paused) {
        bgMusic.play().catch(() => {});
    } else {
        bgMusic.pause();
    }
}

document.addEventListener('click', toggleAudio);
document.addEventListener('touchstart', toggleAudio);

// --- NIEVE ---
function createSnowflake() {
    const snowContainer = document.getElementById('snow-container');
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.innerHTML = '❄';
    snowflake.style.left = Math.random() * 100 + 'vw';
    const size = Math.random() * 1.5 + 0.5;
    snowflake.style.fontSize = size + 'em';
    const duration = Math.random() * 5 + 7; 
    snowflake.style.animationDuration = duration + 's';
    snowContainer.appendChild(snowflake);
    setTimeout(() => { snowflake.remove(); }, duration * 1000);
}
setInterval(createSnowflake, 250);

// --- CONTADOR ---
    const targetDate = new Date("Dec 18, 2026 17:00:00").getTime();
    const countdownTimer = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetDate - now;
    if (distance < 0) {
        clearInterval(countdownTimer);
    document.getElementById("cd-dias").innerHTML = "000";
    document.getElementById("cd-horas").innerHTML = "00";
    document.getElementById("cd-min").innerHTML = "00";
    document.getElementById("cd-seg").innerHTML = "00";        return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const d = String(days).padStart(3, '0');
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');
    document.getElementById("cd-dias").innerHTML = d;
    document.getElementById("cd-horas").innerHTML = h;
    document.getElementById("cd-min").innerHTML = m;
    document.getElementById("cd-seg").innerHTML = s;}, 1000);

// --- CONFIRMACIÓN ---
let guestData = null;      // datos del invitado ya encontrado
let asisteSeleccionado = null; // true/false una vez que elige

function abrirConfirmacion() {
    document.getElementById('rsvp-modal').style.display = 'flex';
}

function cerrarConfirmacion() {
    document.getElementById('rsvp-modal').style.display = 'none';
    // Reset para la próxima vez que se abra
    document.getElementById('rsvp-step-code').style.display = 'block';
    document.getElementById('rsvp-step-form').style.display = 'none';
    document.getElementById('rsvp-detalles').style.display = 'none';
    document.getElementById('rsvp-msg').style.display = 'none';
    document.getElementById('guest-code').value = '';
    asisteSeleccionado = null;
    guestData = null;
}

function mostrarMensaje(texto, color) {
    const msg = document.getElementById('rsvp-msg');
    msg.style.color = color;
    msg.innerHTML = texto;
    msg.style.display = 'block';
}

// --- PASO 1: buscar invitado por código (llama a /api/rsvp) ---
function buscarCodigo() {
    const codigo = document.getElementById('guest-code').value.trim();
    if (codigo === "") {
        mostrarMensaje("Por favor, ingresa tu código de invitación.", "#ff4c4c");
        return;
    }

    mostrarMensaje("Buscando en el inventario de la aventura...", "#f7c654");

    fetch('/api/rsvp?id=' + encodeURIComponent(codigo))
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
            if (!ok) {
                mostrarMensaje(data.error || "No encontramos ese código.", "#ff4c4c");
                return;
            }
            guestData = data;
            document.getElementById('rsvp-msg').style.display = 'none';
            document.getElementById('rsvp-nombre').innerHTML = "¡Hola, " + data.nombre + "!";
            document.getElementById('rsvp-step-code').style.display = 'none';
            document.getElementById('rsvp-step-form').style.display = 'block';
        })
        .catch(() => {
            mostrarMensaje("Hubo un problema de conexión. Intenta de nuevo.", "#ff4c4c");
        });
}

// --- PASO 2a: elegir sí/no asiste ---
function seleccionarAsistencia(asiste) {
    asisteSeleccionado = asiste;
    document.getElementById('rsvp-detalles').style.display = asiste ? 'block' : 'none';

    if (asiste && guestData) {
    const boletos = parseInt(guestData.boletos || '0', 10);
    const boletosEl = document.getElementById('rsvp-boletos');
    if (boletos > 0) {
        boletosEl.innerHTML =
            "Tienes <strong>" + boletos + "</strong> boleto" + (boletos === 1 ? "" : "s") + " extra" + (boletos === 1 ? "" : "s") + " para acompañantes.";
        boletosEl.style.display = 'block';
    } else {
        boletosEl.innerHTML = "";
        boletosEl.style.display = 'none';
    }
}

    const btnSi = document.getElementById('btn-asiste-si');
    const btnNo = document.getElementById('btn-asiste-no');
    btnSi.style.background = asiste ? "rgba(93, 230, 255, 0.35)" : "rgba(18, 97, 138, 0.35)";
    btnNo.style.background = !asiste ? "rgba(255, 76, 76, 0.35)" : "rgba(18, 97, 138, 0.35)";
}

// --- PASO 2b: enviar confirmación (llama a /api/rsvp) ---
function enviarConfirmacion() {
    if (!guestData) return;
    if (asisteSeleccionado === null) {
        mostrarMensaje("Elige si asistirás o no antes de confirmar.", "#ff4c4c");
        return;
    }

    const payload = {
        id: guestData.id,
        asiste: asisteSeleccionado,
        restricciones: asisteSeleccionado ? document.getElementById('guest-restricciones').value : ''
    };

    mostrarMensaje("Guardando tu confirmación...", "#f7c654");

    fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
            if (!ok) {
                mostrarMensaje(data.error || "No se pudo guardar tu confirmación.", "#ff4c4c");
                return;
            }
            let texto = data.message;
            if (asisteSeleccionado && data.mesa) {
                texto += " Tu mesa asignada es la <strong>" + data.mesa + "</strong>.";
            } else if (asisteSeleccionado) {
                texto += " Nos vemos en diciembre. n u n ";
            }
            mostrarMensaje(texto, "#5de6ff");
            document.getElementById('rsvp-step-form').style.display = 'none';
        })
        .catch(() => {
            mostrarMensaje("Hubo un problema de conexión. Intenta de nuevo.", "#ff4c4c");
        });
}

// --- BOTÓN DEL ABRIGO ---
function tomarAbrigo() {
    const btn = document.getElementById('coat-button');
    btn.classList.add('taken');
    setTimeout(() => {
        document.getElementById('coat-wrap').classList.add('hidden');
    }, 700);
}