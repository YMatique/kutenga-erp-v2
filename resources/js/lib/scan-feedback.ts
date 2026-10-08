let audio: AudioContext | null = null;

function tone(frequency: number, duration: number, delay = 0) {
    try {
        audio ??= new AudioContext();

        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + delay;

        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + duration);
    } catch {
        // Sem áudio disponível: o feedback visual (toast) basta.
    }
}

/** Beep curto agudo = leitura reconhecida. */
export const beepSuccess = () => tone(1400, 0.08);

/** Dois beeps graves = código não encontrado. */
export const beepError = () => {
    tone(300, 0.15);
    tone(220, 0.2, 0.18);
};
