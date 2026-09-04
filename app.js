// Table-Side Rummy Counter - Professional UI Version

class RummyCounter {
    constructor() {
        this.deckCount = 1;
        this.discardedCards = new Set();
        this.heldCards = new Set();
        this.hand = [];
        this.mode = 'discard';
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
    setDeckCount(count) {
        this.deckCount = Math.max(1, Math.min(10, count));
        this.discardedCards.clear();
        this.heldCards.clear();
        this.render();
    }

    // ==================== CARD MATRIX RENDERING ====================
    renderCardMatrix() {
        const container = document.getElementById('cardMatrix');
        container.innerHTML = '';

        for (let suit of this.suits) {
            // Suit row header
            const suitDiv = document.createElement('div');
            suitDiv.textContent = suit;
            suitDiv.className = 'suit-label';
            container.appendChild(suitDiv);

            // Cards in suit
            for (let rank of this.ranks) {
                const cardKey = `${rank}${suit}`;
                
                // Find all instances of this card across decks
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
                
                cell.setAttribute('data-card', cardKey);
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('aria-label', `${rank} of ${this.getSuitName(suit)}`);

                const rankDiv = document.createElement('div');
                rankDiv.className = 'card-rank';
                rankDiv.textContent = rank;

                const suitSymDiv = document.createElement('div');
                suitSymDiv.className = 'card-suit';
                suitSymDiv.textContent = suit;

                cell.appendChild(rankDiv);
                cell.appendChild(suitSymDiv);

                cell.addEventListener('click', () => this.toggleCardState(rank, suit));
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleCardState(rank, suit);
                    }
                });

                container.appendChild(cell);
            }
        }

        this.updateStats();
    }

    toggleCardState(rank, suit) {
        // Cycle: normal -> discarded -> held -> normal
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

    // ==================== PROBABILITY ENGINE ====================
    calculateDrawProbability() {
        const totalCards = 52 * this.deckCount;
        const remainingCards = totalCards - this.discardedCards.size;
        if (remainingCards <= 0) return {};

        const probabilities = {};
        const cardCounts = {};

        // Count remaining cards by rank
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

    // ==================== STATS UPDATE ====================
    updateStats() {
        const totalCards = 52 * this.deckCount;
        const remainingCards = totalCards - this.discardedCards.size;
        const percentRemaining = ((remainingCards / totalCards) * 100).toFixed(0);

        document.getElementById('deckDisplay').textContent = this.deckCount;
        document.getElementById('poolCount').textContent = remainingCards;
        document.getElementById('knownCount').textContent = `${this.discardedCards.size} / ${this.heldCards.size}`;
        document.getElementById('poolPercent').textContent = `${percentRemaining}%`;
    }

    // ==================== ACTION PANEL ====================
    updateActionPanel() {
        const topCards = this.getTopDrawCards();
        let html = '';

        if (topCards.length === 0) {
            html = '<div class="action-box"><div class="action-content rec-bad">Deck depleted. All cards known.</div></div>';
        } else {
            html += '<div class="action-box">';
            html += '<div class="action-title">ACTION: DRAW STOCK</div>';
            html += '<div class="action-content rec-good">Pull from draw pile</div>';
            html += '<div class="probability">Based on modeled game state</div>';
            html += '</div>';

            html += '<div class="action-box">';
            html += '<div class="action-title">BEST UNSEEN DRAWS</div>';
            html += '<div class="probability">P(draw) × gain</div>';
            topCards.forEach((card, idx) => {
                const barWidth = Math.max(20, parseFloat(card.prob) * 2);
                html += `<div class="action-content" style="margin-top: 6px;">`;
                html += `<div><span class="action-good">${card.rank}${idx === 0 ? '▬' : '▭'}</span> `;
                html += `<span style="display: inline-block; width: ${barWidth}px; height: 6px; border: 1px solid #00ff00; vertical-align: middle;"></span> `;
                html += `<span class="probability">${card.prob}%</span></div>`;
                html += `</div>`;
            });
            html += '</div>';

            html += '<div class="action-box">';
            html += '<div class="action-title">OPPONENT ESTIMATE</div>';
            html += '<div class="probability">LOW SIGNAL</div>';
            html += '<div class="action-content" style="margin-top: 4px;">Unseen cards not in your hand remain available to the table.</div>';
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
            return '<div class="action-box"><div class="action-content rec-bad">Invalid hand format. Use: AS,2H,3D,4C</div></div>';
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
        html += '<div class="action-title">HAND ANALYSIS</div>';
        html += `<div class="action-content">Value: ${handValue} | Cards: ${this.hand.length}</div>`;
        html += `<div class="probability">${this.hand.join(', ')}</div>`;
        html += '</div>';

        html += '<div class="action-box">';
        html += '<div class="action-title">DISCARD RECOMMENDATION</div>';
        html += `<div class="action-content rec-bad">→ ${discardCandidates[0]}</div>`;
        html += `<div class="probability">High value, ${probs[discardCandidates[0]]?.toFixed(1) || 0}% remain</div>`;
        html += '</div>';

        html += '<div class="action-box">';
        html += '<div class="action-title">DRAW STRATEGY</div>';
        html += '<div class="action-content rec-good">DRAW STOCK</div>';
        html += `<div class="probability">Better odds: ${topCards[0]?.rank} (${topCards[0]?.prob}%)</div>`;
        html += '</div>';

        html += '<div class="action-box">';
        html += '<div class="action-title">TOP 3 DRAWS</div>';
        topCards.forEach((card, idx) => {
            html += `<div class="action-content" style="margin-top: 4px;">`;
            html += `<span class="action-good">${idx + 1}. ${card.rank}</span> `;
            html += `<span class="probability">${card.prob}%</span>`;
            html += `</div>`;
        });
        html += '</div>';

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
        
        document.getElementById('matrixPanel').style.display = mode === 'discard' ? 'flex' : 'none';
        document.getElementById('actionPanel').style.display = mode === 'discard' ? 'flex' : 'none';
        document.getElementById('handPanel').style.display = mode === 'hand' ? 'flex' : 'none';

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab0${mode === 'discard' ? '1' : '2'}`).classList.add('active');

        if (mode === 'discard') {
            this.updateActionPanel();
        }
    }

    // ==================== EVENT LISTENERS ====================
    attachEventListeners() {
        document.getElementById('deckUp').addEventListener('click', () => {
            this.setDeckCount(this.deckCount + 1);
        });

        document.getElementById('deckDown').addEventListener('click', () => {
            this.setDeckCount(this.deckCount - 1);
        });

        document.getElementById('tab01').addEventListener('click', () => this.switchMode('discard'));
        document.getElementById('tab02').addEventListener('click', () => this.switchMode('hand'));

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.discardedCards.clear();
            this.heldCards.clear();
            this.hand = [];
            this.render();
        });

        document.getElementById('analyzeBtn').addEventListener('click', () => {
            const handStr = document.getElementById('handInput').value;
            if (this.parseHand(handStr)) {
                document.getElementById('handAnalysisContent').innerHTML = this.analyzeHand();
            } else {
                document.getElementById('handAnalysisContent').innerHTML = 
                    '<div class="action-box"><div class="action-content rec-bad">Invalid format. Use: AS,2H,3D,4C,KS</div></div>';
            }
        });

        document.getElementById('handInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('analyzeBtn').click();
            }
        });

        // Arrow key navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' && this.deckCount < 10) this.setDeckCount(this.deckCount + 1);
            if (e.key === 'ArrowDown' && this.deckCount > 1) this.setDeckCount(this.deckCount - 1);
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