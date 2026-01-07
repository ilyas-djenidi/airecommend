// AlgerianVoiceNavigation.ts
export class AlgerianVoiceNavigation {
    private audioContext: AudioContext | null = null;
    private speechSynthesis: SpeechSynthesis | null = null;
    private isEnabled: boolean = true;
    private dialect: 'algiers' | 'oran' | 'constantine' | 'common' = 'common';

    private navigationPhrases = {
        common: {
            turn_left: 'دور على اليسار',
            turn_right: 'دور على اليمين',
            continue_straight: 'كمّل على طول',
            destination_reached: 'وصلت للوجهة',
            collection_point_ahead: 'فيها نقطة تجميع قدامك',
            warning_hazard: 'احذر، في خطر',
        },
        algiers: {
            turn_left: 'سّر لليسار',
            turn_right: 'سّر لليمين',
            continue_straight: 'روح على قدام',
            destination_reached: 'وصّلت',
        }
    };

    constructor(dialect: 'algiers' | 'oran' | 'constantine' | 'common' = 'common') {
        this.dialect = dialect;
        if (typeof window !== 'undefined') {
            this.initializeAudio();
        }
    }

    private initializeAudio() {
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
        }
    }

    public speak(text: string) {
        if (!this.speechSynthesis) return;
        this.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        this.speechSynthesis.speak(utterance);
    }

    public announceTurn(direction: 'left' | 'right' | 'straight') {
        const phrases = this.navigationPhrases[this.dialect] || this.navigationPhrases.common;
        let text = '';
        if (direction === 'left') text = (phrases as any).turn_left || this.navigationPhrases.common.turn_left;
        if (direction === 'right') text = (phrases as any).turn_right || this.navigationPhrases.common.turn_right;
        if (direction === 'straight') text = (phrases as any).continue_straight || this.navigationPhrases.common.continue_straight;
        this.speak(text);
    }
}
