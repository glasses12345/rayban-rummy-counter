// Ray-Ban Rummy Counter - Core Application Logic

class RummyCounter {
    constructor() {
        this.deckCount = 1;
        this.discardedCards = new Set();
        this.hand = [];
        this.mode = 'cards';
        this.focusedCardIndex = 0;
        this.suits = ['♠', '♥', '♦', '♣'];
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.cards = this.generateDeck();
        this.init();
    }

    generateDeck() {
        const deck = [];
        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                deck.push({ rank, suit });
            }
        }
        return deck;
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    // ==================== DECK MANAGEMENT ====================
    renderDeckCounter() {
        const container = document.getElementById('deckCounter');
        container.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            const btn = document.createElement('button');
            btn.className = `deck-btn ${i === this.deckCount ? 'active' : ''}`;
            btn.textContent = i;
            btn.setAttribute('aria-label', `Select ${i} deck(s)`);
            btn.addEventListener('click', () => this.setDeckCount(i));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' && i < 10) this.setDeckCount(i + 1);
                if (e.key === 'ArrowLeft' && i > 1) this.setDeckCount(i - 1);
            });
            container.appendChild(btn);
        }
    }

    setDeckCount(count) {
        this.deckCount = Math.max(1, Math.min(10, count));
        this.discardedCards.clear();
        this.focusedCardIndex = 0;
        this.renderDeckCounter();
        if (this.mode === 'cards') this.renderCardGrid();
    }

    // ==================== CARD GRID RENDERING ====================
    renderCardGrid() {
        const container = document.getElementById('cardsMode');
        container.innerHTML = '';

        for (let deckNum = 0; deckNum < this.deckCount; deckNum++) {
            for (let cardIdx = 0; cardIdx < this.cards.length; cardIdx++) {
                const card = this.cards[cardIdx];
                const uniqueId = `${deckNum}-${cardIdx}`;
                const isDiscarded = this.discardedCards.has(uniqueId);

                const div = document.createElement('div');
                div.className = `card-item ${isDiscarded ? 'discarded' : ''}`;
                div.setAttribute('data-id', uniqueId);
                div.setAttribute('tabindex', '0');
                div.setAttribute('aria-label', `${card.rank} of ${this.getSuitName(card.suit)}, ${isDiscarded ? 'discarded' : 'in play'}`);

                const nameDiv = document.createElement('div');
                nameDiv.className = 'card-name';
                nameDiv.textContent = card.rank;

                const suitDiv = document.createElement('div');
                suitDiv.className = 'card-suit';
                suitDiv.textContent = card.suit;

                div.appendChild(nameDiv);
                div.appendChild(suitDiv);

                div.addEventListener('click', () => this.toggleCardDiscard(uniqueId));
                div.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleCardDiscard(uniqueId);
                    }
                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        this.focusNextCard();
                    }
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        this.focusPrevCard();
                    }
                });

                container.appendChild(div);
            }
        }
    }

    toggleCardDiscard(cardId) {
        if (this.discardedCards.has(cardId)) {
            this.discardedCards.delete(cardId);
        } else {
            this.discardedCards.add(cardId);
        }
        this.renderCardGrid();
        if (this.mode === 'cards') this.updateAnalysis();
    }

    getSuitName(suit) {
        const names = { '♠': 'Spade', '♥': 'Heart', '♦': 'Diamond', '♣': 'Club' };
        return names[suit] || suit;
    }

    focusNextCard() {
        const cards = document.querySelectorAll('.card-item');
        this.focusedCardIndex = (this.focusedCardIndex + 1) % cards.length;
        cards[this.focusedCardIndex]?.focus();
    }

    focusPrevCard() {
        const cards = document.querySelectorAll('.card-item');
        this.focusedCardIndex = (this.focusedCardIndex - 1 + cards.length) % cards.length;
        cards[this.focusedCardIndex]?.focus();
    }

    // ==================== PROBABILITY ENGINE ====================
    calculateDrawProbability() {
        const totalCards = 52 * this.deckCount;
        const remainingCards = totalCards - this.discardedCards.size;
        if (remainingCards <= 0) return {};

        const probabilities = {};
        const cardCounts = {};

        // Count remaining cards by rank
        for (let deckNum = 0; deckNum < this.deckCount; deckNum++) {
            for (let cardIdx = 0; cardIdx < this.cards.length; cardIdx++) {
                const uniqueId = `${deckNum}-${cardIdx}`;
                if (!this.discardedCards.has(uniqueId)) {
                    const card = this.cards[cardIdx];
                    const key = card.rank;
                    cardCounts[key] = (cardCounts[key] || 0) + 1;
                }
            }
        }

        // Calculate probabilities
        for (let rank of this.ranks) {
            const count = cardCounts[rank] || 0;
            probabilities[rank] = (count / remainingCards) * 100;
        }

        return probabilities;
    }

    getTopDrawCards() {
        const probs = this.calculateDrawProbability();
        return Object.entries(probs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([rank, prob]) => ({ rank, prob: prob.toFixed(1) }));
    }

    // ==================== HAND ANALYSIS ====================
    parseHand(handStr) {
        const cards = handStr.toUpperCase().trim().split(',').map(s => s.trim());
        this.hand = cards.filter(card => {
            return this.ranks.some(r => card.startsWith(r)) && this.suits.some(s => card.endsWith(s));
        });
        return this.hand.length === cards.length;
    }

    getHandValue() {
        // Rummy scoring: A=1, 2-9=face value, 10/J/Q/K=10
        return this.hand.reduce((sum, card) => {
            const rank = card.slice(0, -1);
            if (rank === 'A') return sum + 1;
            if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return sum + 10;
            return sum + parseInt(rank);
        }, 0);
    }

    analyzeHand() {
        if (this.hand.length === 0) {
            return '<div class="rec-item rec-bad">No valid hand entered. Format: AS,2H,3D...</div>';
        }

        let analysis = '';
        const handValue = this.getHandValue();
        const probs = this.calculateDrawProbability();
        const topCards = this.getTopDrawCards();

        // Suggest which card to discard (highest value, lowest probability)
        const cardRanks = this.hand.map(c => c.slice(0, -1));
        const discardCandidates = cardRanks.sort((a, b) => {
            const valA = this.getRankValue(a);
            const valB = this.getRankValue(b);
            const probA = probs[a] || 0;
            const probB = probs[b] || 0;
            // Prioritize high-value cards with low probability
            return (valB - valA) + (probA - probB);
        });

        analysis += `<div class="rec-title">HAND ANALYSIS</div>`;
        analysis += `<div class="rec-item">Hand Value: ${handValue}</div>`;
        analysis += `<div class="rec-item rec-neutral">Cards: ${this.hand.join(', ')}</div>`;

        analysis += `<div class="rec-title" style="margin-top: 8px;">DISCARD RECOMMENDATION</div>`;
        analysis += `<div class="rec-item rec-bad">DISCARD: <strong>${discardCandidates[0]}</strong></div>`;
        analysis += `<div class="probability">Reason: High value, ${probs[discardCandidates[0]]?.toFixed(1) || 0}% remaining in deck</div>`;

        // Draw vs Pickup analysis
        analysis += `<div class="rec-title" style="margin-top: 8px;">DRAW STRATEGY</div>`;
        analysis += `<div class="rec-item rec-good">DRAW FROM DECK</div>`;
        analysis += `<div class="probability">Higher probability of useful cards: ${topCards[0].prob}% for ${topCards[0].rank}s</div>`;

        analysis += `<div class="rec-title" style="margin-top: 8px;">TOP 3 DRAW CARDS</div>`;
        topCards.forEach((card, idx) => {
            analysis += `<div class="rec-item rec-good">${idx + 1}. ${card.rank}: ${card.prob}%</div>`;
        });

        return analysis;
    }

    getRankValue(rank) {
        if (rank === 'A') return 1;
        if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
        if (rank === '10') return 10;
        return parseInt(rank);
    }

    // ==================== UI UPDATES ====================
    updateAnalysis() {
        const topCards = this.getTopDrawCards();
        let analysis = '<div class="rec-title">TOP DRAW PROBABILITIES</div>';
        topCards.forEach((card, idx) => {
            analysis += `<div class="rec-item rec-good">${idx + 1}. ${card.rank}: ${card.prob}%</div>`;
        });
        document.getElementById('analysisContent').innerHTML = analysis;
    }

    switchMode(newMode) {
        this.mode = newMode;
        document.getElementById('cardsMode').style.display = newMode === 'cards' ? 'grid' : 'none';
        document.getElementById('handMode').style.display = newMode === 'hand' ? 'block' : 'none';
        document.getElementById('analysisMode').style.display = newMode === 'analysis' ? 'block' : 'none';

        document.querySelectorAll('.mode-btn').forEach((btn, idx) => {
            btn.classList.remove('active');
            if ((idx === 0 && newMode === 'cards') ||
                (idx === 1 && newMode === 'hand') ||
                (idx === 2 && newMode === 'analysis')) {
                btn.classList.add('active');
            }
        });

        if (newMode === 'cards') {
            this.renderCardGrid();
            this.updateAnalysis();
        } else if (newMode === 'analysis') {
            this.updateAnalysis();
        }
    }

    // ==================== EVENT LISTENERS ====================
    attachEventListeners() {
        document.getElementById('modeCards').addEventListener('click', () => this.switchMode('cards'));
        document.getElementById('modeHand').addEventListener('click', () => this.switchMode('hand'));
        document.getElementById('modeAnalysis').addEventListener('click', () => this.switchMode('analysis'));

        document.getElementById('parseHandBtn').addEventListener('click', () => {
            const handStr = document.getElementById('handInput').value;
            if (this.parseHand(handStr)) {
                document.getElementById('handAnalysis').innerHTML = this.analyzeHand();
            } else {
                document.getElementById('handAnalysis').innerHTML = '<div class="rec-item rec-bad">Invalid hand format. Use: AS,2H,3D,4C,KS</div>';
            }
        });

        document.getElementById('handInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('parseHandBtn').click();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.focusNextCard();
            }
        });
    }

    render() {
        this.renderDeckCounter();
        this.renderCardGrid();
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    new RummyCounter();
});