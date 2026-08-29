window.onload = () => {
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 300);
};

const musicBtn = document.getElementById('music-btn');
const bgMusic = document.getElementById('bg-music');
let isPlaying = false;

function updateAudioState(playing) {
    isPlaying = playing;
    if (playing) {
        musicBtn.innerHTML = "🔊 PAUSAR AVENTURA";
    } else {
        musicBtn.innerHTML = "🎵 INICIAR AVENTURA";
    }
}

window.addEventListener('load', () => {
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            updateAudioState(true);
        }).catch(error => {
            updateAudioState(false);
        });
    }
});

document.addEventListener('click', function startAudio() {
    if (!isPlaying) { bgMusic.play().then(() => updateAudioState(true)).catch(e => console.log(e)); }
    document.removeEventListener('click', startAudio);
}, { once: true });

document.addEventListener('touchstart', function startAudioTouch() {
    if (!isPlaying) { bgMusic.play().then(() => updateAudioState(true)).catch(e => console.log(e)); }
    document.removeEventListener('touchstart', startAudioTouch);
}, { once: true });

musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isPlaying) {
        bgMusic.play().then(() => updateAudioState(true)).catch(e => console.log("Requiere interaccion", e));
    } else {
        bgMusic.pause();
        updateAudioState(false);
    }
});

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

const targetDate = new Date("Nov 15, 2026 23:59:59").getTime();
const countdownTimer = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetDate - now;
    if (distance < 0) {
        clearInterval(countdownTimer);
        document.getElementById("countdown").innerHTML = "000:00:00:00";
        return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const d = String(days).padStart(3, '0');
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');
    document.getElementById("countdown").innerHTML = `${d}:${h}:${m}:${s}`;
}, 1000);

function abrirConfirmacion() { document.getElementById('rsvp-modal').style.display = 'flex'; }
function cerrarConfirmacion() { document.getElementById('rsvp-modal').style.display = 'none'; }

function simularEnvio() {
    const input = document.getElementById('guest-name').value;
    const msg = document.getElementById('rsvp-msg');
    if(input.trim() === "") {
        msg.style.color = "#ff4c4c";
        msg.innerHTML = "Por favor, ingresa tu nombre.";
    } else {
        msg.style.color = "#70c1ff";
        msg.innerHTML = "¡Conectando a Google Sheets para confirmar!";
    }
    msg.style.display = 'block';
}
