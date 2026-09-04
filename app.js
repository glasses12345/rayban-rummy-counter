// Ray-Ban Rummy Counter - Keyboard-Optimized for 600x600 Display

class RummyCounter {
    constructor() {
        this.deckCount = 1;
        this.discardedCards = new Set();
        this.heldCards = new Set();
        this.hand = [];
        this.mode = 'discard';
        this.focusIndex = 0;
        this.suits = ['♠', '♥', '♦', '♣'];
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.cards = this.generateDeck();
        this.focusableElements = [];
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
        this.manageFocus();
    }

    // ==================== DECK MANAGEMENT ====================
    setDeckCount(count) {
        this.deckCount = Math.max(1, Math.min(10, count));
        this.discardedCards.clear();
        this.heldCards.clear();
        this.hand = [];
        this.focusIndex = 0;
        this.render();
        this.manageFocus();
    }

    // ==================== CARD MATRIX RENDERING ====================
    renderCardMatrix() {
        const container = document.getElementById('cardMatrix');
        container.innerHTML = '';
        this.focusableElements = [];

        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                let discardCount = 0;
                let holdCount = 0;
                
                for (let deckNum = 0; deckNum < this.deckCount; deckNum++) {
                    const cardId = `${deckNum}-${rank}-${suit}`;
                    if (this.discardedCards.has(cardId)) discardCount++;
                    if (this.heldCards.has(cardId)) holdCount++;
                }

                const cell = document.createElement('div');
                cell.className = 'card-cell';
                if (discardCount > 0) cell.classList.add('discarded');
                if (holdCount > 0) cell.classList.add('held');
                
                cell.setAttribute('data-card', `${rank}${suit}`);
                cell.setAttribute('tabindex', '-1');

                const rankDiv = document.createElement('div');
                rankDiv.className = 'card-rank';
                rankDiv.textContent = rank;

                const suitDiv = document.createElement('div');
                suitDiv.className = 'card-suit';
                suitDiv.textContent = suit;

                cell.appendChild(rankDiv);
                cell.appendChild(suitDiv);

                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleCardState(rank, suit);
                    }
                });

                container.appendChild(cell);
                this.focusableElements.push(cell);
            }
        }

        this.updateStats();
    }

    toggleCardState(rank, suit) {
        let anyStateFound = false;
        for (let deckNum = 0; deckNum < this.deckCount; deckNum++) {
            const cardId = `${deckNum}-${rank}-${suit}`;
            if (this.discardedCards.has(cardId)) {
                this.discardedCards.delete(cardId);
                this.heldCards.add(cardId);
                anyStateFound = true;
                break;
            }
            if (this.heldCards.has(cardId)) {
                this.heldCards.delete(cardId);
                anyStateFound = true;
                break;
            }
        }
        if (!anyStateFound && this.deckCount > 0) {
            this.discardedCards.add(`0-${rank}-${suit}`);
        }
        this.renderCardMatrix();
        this.updateActionPanel();
    }

    getSuitName(suit) {
        const names = { '♠': 'Spade', '♥': 'Heart', '♦': 'Diamond', '♣': 'Club' };
        return names[suit] || suit;
    }

    // ==================== FOCUS MANAGEMENT ====================
    manageFocus() {
        // Update focusable elements based on mode
        if (this.mode === 'discard') {
            this.focusableElements = Array.from(document.querySelectorAll('.card-cell'));
        } else if (this.mode === 'hand') {
            this.focusableElements = [
                document.getElementById('handInput'),
                document.getElementById('analyzeBtn')
            ];
        }

        if (this.focusableElements.length > 0) {
            this.focusIndex = Math.min(this.focusIndex, this.focusableElements.length - 1);
            this.setFocus(this.focusIndex);
        }
    }

    setFocus(index) {
        this.focusableElements.forEach(el => el.setAttribute('tabindex', '-1'));
        if (this.focusableElements[index]) {
            this.focusableElements[index].setAttribute('tabindex', '0');
            this.focusableElements[index].focus();
        }
    }

    focusNext() {
        this.focusIndex = (this.focusIndex + 1) % this.focusableElements.length;
        this.setFocus(this.focusIndex);
    }

    focusPrev() {
        this.focusIndex = (this.focusIndex - 1 + this.focusableElements.length) % this.focusableElements.length;
        this.setFocus(this.focusIndex);
    }

    // ==================== PROBABILITY ENGINE ====================
    calculateDrawProbability() {
        const totalCards = 52 * this.deckCount;
        const remainingCards = totalCards - this.discardedCards.size;
        if (remainingCards <= 0) return {};

        const probabilities = {};
        const cardCounts = {};

        for (let deckNum = 0; deckNum < this.deckCount; deckNum++) {
            for (let rank of this.ranks) {
                for (let suit of this.suits) {
                    const cardId = `${deckNum}-${rank}-${suit}`;
                    if (!this.discardedCards.has(cardId)) {
                        cardCounts[rank] = (cardCounts[rank] || 0) + 1;
                    }
                }
            }
        }

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

    // ==================== STATS UPDATE ====================
    updateStats() {
        const totalCards = 52 * this.deckCount;
        const remainingCards = totalCards - this.discardedCards.size;
        const percentRemaining = ((remainingCards / totalCards) * 100).toFixed(0);

        document.getElementById('deckDisplay').textContent = this.deckCount;
        document.getElementById('poolCount').textContent = remainingCards;
        document.getElementById('knownCount').textContent = this.discardedCards.size;
        document.getElementById('poolPercent').textContent = `${percentRemaining}%`;
    }

    // ==================== ACTION PANEL ====================
    updateActionPanel() {
        const topCards = this.getTopDrawCards();
        let html = '';

        if (topCards.length === 0) {
            html = '<div class="action-box"><div class="action-content rec-bad">DECK EMPTY</div></div>';
        } else {
            html += '<div class="action-box">';
            html += '<div class="action-title">→ DRAW STOCK</div>';
            html += '<div class="action-content rec-good">Pull from deck</div>';
            html += '</div>';

            html += '<div class="action-box">';
            html += '<div class="action-title">TOP DRAWS</div>';
            topCards.forEach((card, idx) => {
                html += `<div class="action-content"><span class="rec-good">${idx + 1}. ${card.rank}</span> <span class="probability">${card.prob}%</span></div>`;
            });
            html += '</div>';
        }

        document.getElementById('actionContent').innerHTML = html;
    }

    // ==================== HAND ANALYSIS ====================
    parseHand(handStr) {
        const cards = handStr.toUpperCase().trim().split(',').map(s => s.trim());
        this.hand = cards.filter(card => {
            return this.ranks.some(r => card.startsWith(r)) && this.suits.some(s => card.includes(s));
        });
        return this.hand.length > 0 && this.hand.length === cards.length;
    }

    getHandValue() {
        return this.hand.reduce((sum, card) => {
            const suit = card.slice(-1);
            const rank = card.slice(0, -1);
            if (rank === 'A') return sum + 1;
            if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return sum + 10;
            return sum + parseInt(rank);
        }, 0);
    }

    analyzeHand() {
        if (this.hand.length === 0) {
            return '<div class="action-box"><div class="action-content rec-bad">Invalid format. Use: AS,2H,3D</div></div>';
        }

        let html = '';
        const handValue = this.getHandValue();
        const probs = this.calculateDrawProbability();
        const topCards = this.getTopDrawCards();

        const cardRanks = this.hand.map(c => c.slice(0, -1));
        const discardCandidates = cardRanks.sort((a, b) => {
            const valA = this.getRankValue(a);
            const valB = this.getRankValue(b);
            const probA = probs[a] || 0;
            const probB = probs[b] || 0;
            return (valB - valA) + (probA - probB);
        });

        html += '<div class="action-box">';
        html += '<div class="action-title">YOUR HAND</div>';
        html += `<div class="action-content">Value: ${handValue}</div>`;
        html += `<div class="probability">${this.hand.join(', ')}</div>`;
        html += '</div>';

        html += '<div class="action-box">';
        html += '<div class="action-title">DISCARD</div>';
        html += `<div class="action-content rec-bad">→ ${discardCandidates[0]}</div>`;
        html += `<div class="probability">${probs[discardCandidates[0]]?.toFixed(1) || 0}% in deck</div>`;
        html += '</div>';

        if (topCards.length > 0) {
            html += '<div class="action-box">';
            html += '<div class="action-title">DRAW STOCK</div>';
            topCards.forEach((card, idx) => {
                html += `<div class="action-content"><span class="rec-good">${card.rank}</span> <span class="probability">${card.prob}%</span></div>`;
            });
            html += '</div>';
        }

        return html;
    }

    getRankValue(rank) {
        if (rank === 'A') return 1;
        if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
        if (rank === '10') return 10;
        return parseInt(rank);
    }

    // ==================== MODE SWITCHING ====================
    switchMode(mode) {
        this.mode = mode;
        this.focusIndex = 0;
        
        document.getElementById('matrixPanel').classList.toggle('hidden', mode !== 'discard');
        document.getElementById('actionPanel').classList.toggle('hidden', mode !== 'discard');
        document.getElementById('handPanel').classList.toggle('hidden', mode !== 'hand');

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab0${mode === 'discard' ? '1' : '2'}`).classList.add('active');

        this.manageFocus();
    }

    // ==================== EVENT LISTENERS ====================
    attachEventListeners() {
        // Tab navigation
        document.getElementById('tab01').addEventListener('click', () => this.switchMode('discard'));
        document.getElementById('tab02').addEventListener('click', () => this.switchMode('hand'));
        document.getElementById('resetBtn').addEventListener('click', () => this.setDeckCount(1));

        // Hand analysis
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            const handStr = document.getElementById('handInput').value;
            if (this.parseHand(handStr)) {
                document.getElementById('handAnalysisContent').innerHTML = this.analyzeHand();
            } else {
                document.getElementById('handAnalysisContent').innerHTML = 
                    '<div class="action-box"><div class="action-content rec-bad">Invalid format</div></div>';
            }
        });

        document.getElementById('handInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('analyzeBtn').click();
            }
        });

        // Global keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Arrow Up/Down = Deck count
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.setDeckCount(this.deckCount + 1);
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.setDeckCount(this.deckCount - 1);
            }

            // Arrow Left/Right or Tab = Navigate cards/buttons
            if (e.key === 'ArrowRight' || e.key === 'Tab') {
                e.preventDefault();
                this.focusNext();
            }
            if (e.key === 'ArrowLeft' || e.key === 'Shift+Tab') {
                e.preventDefault();
                this.focusPrev();
            }

            // Enter = Activate focused element
            if (e.key === 'Enter') {
                const focused = document.activeElement;
                if (focused.classList.contains('card-cell')) {
                    const card = focused.getAttribute('data-card');
                    this.toggleCardState(card.slice(0, -1), card.slice(-1));
                } else if (focused.id === 'analyzeBtn') {
                    document.getElementById('analyzeBtn').click();
                } else if (focused.classList.contains('tab-btn')) {
                    focused.click();
                } else if (focused.id === 'resetBtn') {
                    document.getElementById('resetBtn').click();
                }
            }
        });
    }

    render() {
        this.renderCardMatrix();
        this.updateActionPanel();
        this.updateStats();
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    new RummyCounter();
});