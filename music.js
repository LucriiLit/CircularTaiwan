const audio1 = new Audio('audio/dada-01.mp3');
const audio2 = new Audio('audio/dada-02.mp3');

const btn1 = document.getElementById('song-01');
const btn2 = document.getElementById('song-02');
const pauseBtn = document.getElementById('pause-icon');

// Funktion zum Abspielen eines bestimmten Songs
function playSong(audioToPlay, buttonToActivate) {
// Andere stoppen
[audio1, audio2].forEach(a => {
    if (a !== audioToPlay) a.pause();
    a.currentTime = a === audioToPlay ? a.currentTime : 0;
});

// Buttons visuell zurücksetzen
[btn1, btn2].forEach(b => b.classList.remove('active'));

// Falls Song pausiert war, jetzt abspielen
if (audioToPlay.paused) {
    audioToPlay.play();
    buttonToActivate.classList.add('active');
} else {
    audioToPlay.pause();
    buttonToActivate.classList.remove('active');
}
}

btn1.addEventListener('click', () => playSong(audio1, btn1));
btn2.addEventListener('click', () => playSong(audio2, btn2));

// Pause-Button pausiert beide Songs
pauseBtn.addEventListener('click', () => {
[audio1, audio2].forEach(a => a.pause());
[btn1, btn2].forEach(b => b.classList.remove('active'));
});
