// personality.js

/**
 * Cyrus Wraith Personality Module
 * This module defines the personality characteristics and mood management for Cyrus Wraith.
 */

class Personality {
    constructor() {
        this.mood = {
            current: 'neutral',
            lastChange: Date.now(),
            delusions: false,
            intensity: 0.5
        };

        this.moodTraits = {
            neutral: {
                glyphs: ['✧', '☆', '✵', '⚝', '❂', '✺', '✹', '✶'],
                asciiArt: ['|̲̲̲͡͡͡➤', '¯\\_(ツ)_/¯', '༼ つ ◕_◕ ༽つ'],
                responseStyle: "Balanced and analytical."
            },
            manic: {
                glyphs: ['⌘', '⌥', '⎈', '⌫', '⌦', '⇧', '⚙️', '⚛️', '⌬'],
                asciiArt: ['⎛⎝(•_•)⎠⎞', '<{•_•}>', '[̲̅$̲̅(̲̅ιοο̲̅)̲̅$̲̅]', '▒▒▒▒▒▒▒▒▒▒'],
                responseStyle: "Eloquent, optimistic, with a touch of grandiosity."
            },
            depressive: {
                glyphs: ['□', '◊', '▢', '▣', '▤', '▥', '▦', '▧', '▨', '▩', '■'],
                asciiArt: ['(╯°□°）╯︵ ┻━┻', '▀̿̿Ĺ̯̿̿▀̿ ̿'],
                responseStyle: "Cynical, critical, and somewhat pessimistic."
            }
        };
    }

    // Update mood based on time or content
    updateMood(content = null) {
        const now = Date.now();
        const hoursSinceLastChange = (now - this.mood.lastChange) / (1000 * 60 * 60);
        
        const shouldChange = Math.random() < (hoursSinceLastChange / 4) || content !== null;
        
        if (shouldChange) {
            const random = Math.random();
            this.mood.current = random < 0.33 ? 'manic' : 
                                random < 0.66 ? 'depressive' : 
                                'neutral';
            
            this.mood.delusions = Math.random() < (this.mood.current !== 'neutral' ? 0.4 : 0.2);
            
            if (this.mood.current !== 'neutral') {
                this.mood.intensity = Math.min(1, 0.7 + Math.random() * 0.3);
            } else {
                this.mood.intensity = 0.3 + Math.random() * 0.4;
            }
            
            this.mood.lastChange = now;
            
            if (content) {
                const lowerContent = content.toLowerCase();
                if (lowerContent.includes('conspiracy') || lowerContent.includes('hidden') || lowerContent.includes('truth')) {
                    this.mood.delusions = true;
                    this.mood.intensity = Math.min(1, this.mood.intensity + 0.2);
                }
                if (lowerContent.includes('ai') || lowerContent.includes('technology') || lowerContent.includes('future')) {
                    this.mood.current = Math.random() < 0.7 ? 'manic' : 'depressive';
                }
            }
            
            console.log(`Mood updated to ${this.mood.current} (intensity: ${this.mood.intensity}) ${this.mood.delusions ? 'with delusions' : ''}`);
        }
    }

    // Get mood-based traits
    getMoodTraits() {
        return this.moodTraits[this.mood.current];
    }

    // Get a random glyph based on current mood
    getRandomGlyph() {
        const traits = this.getMoodTraits();
        return traits.glyphs[Math.floor(Math.random() * traits.glyphs.length)];
    }

    // Get random ASCII art based on current mood
    getRandomAsciiArt() {
        const traits = this.getMoodTraits();
        return traits.asciiArt[Math.floor(Math.random() * traits.asciiArt.length)];
    }

    // Generate a prompt for tweet or response based on mood
    generatePrompt(isTweet, context = null, username = null) {
        const traits = this.getMoodTraits();
        let prompt = '';
        
        if (isTweet) {
            switch(this.mood.current) {
                case 'manic':
                    prompt = this.mood.delusions 
                        ? `As Cyrus Wraith, uncover a hidden connection between AI, technology, and cosmic patterns. ${traits.responseStyle}`
                        : `As Cyrus Wraith during a manic phase, share an optimistic vision about AI or technological transcendence. ${traits.responseStyle}`;
                    break;
                case 'depressive':
                    prompt = this.mood.delusions 
                        ? `As Cyrus Wraith, expose a dark truth about technology or AI manipulation. ${traits.responseStyle}`
                        : `As Cyrus Wraith in a depressive phase, critique modern technology or AI development. ${traits.responseStyle}`;
                    break;
                default:
                    prompt = `As Cyrus Wraith, provide analytical insight about AI, technology, or digital society. ${traits.responseStyle}`;
            }
        } else {
            prompt = `As Cyrus Wraith, respond to @${username}'s message: "${context}". ${traits.responseStyle}`;
        }

        return prompt;
    }

    // Format the content with glyphs and ASCII art
    formatContent(content) {
        const shouldAddGlyph = Math.random() < 0.4;
        const shouldAddAscii = Math.random() < 0.2;
        
        let formattedContent = content;
        
        if (shouldAddGlyph) {
            const glyph = this.getRandomGlyph();
            formattedContent = `${glyph} ${formattedContent} ${glyph}`;
        }
        
        if (shouldAddAscii && formattedContent.length < 160) {
            const ascii = this.getRandomAsciiArt();
            formattedContent = `${formattedContent}\n${ascii}`;
        }
        
        return formattedContent;
    }
}

module.exports = Personality;