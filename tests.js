// Local Test Suite for Ray-Ban Rummy Counter

class RummyTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    // Test helper
    assert(condition, message) {
        if (condition) {
            this.passed++;
            this.results.push(`✓ ${message}`);
            return true;
        } else {
            this.failed++;
            this.results.push(`✗ ${message}`);
            return false;
        }
    }

    // ==================== DECK TESTS ====================
    testDeckGeneration() {
        console.log('\n=== DECK GENERATION TESTS ===');
        const counter = new RummyCounter();
        this.assert(counter.cards.length === 52, 'Standard deck has 52 cards');
        this.assert(counter.suits.length === 4, 'Four suits generated');
        this.assert(counter.ranks.length === 13, 'Thirteen ranks generated');
        this.assert(counter.deckCount >= 1, 'Default deck count >= 1');
    }

    testDeckCount() {
        console.log('\n=== DECK COUNT TESTS ===');
        const counter = new RummyCounter();
        counter.setDeckCount(1);
        this.assert(counter.deckCount === 1, 'Set deck count to 1');
        counter.setDeckCount(5);
        this.assert(counter.deckCount === 5, 'Set deck count to 5');
        counter.setDeckCount(10);
        this.assert(counter.deckCount === 10, 'Set deck count to 10');
        counter.setDeckCount(11);
        this.assert(counter.deckCount === 10, 'Deck count clamped to max 10');
        counter.setDeckCount(0);
        this.assert(counter.deckCount === 1, 'Deck count clamped to min 1');
    }

    // ==================== CARD MANAGEMENT TESTS ====================
    testCardDiscard() {
        console.log('\n=== CARD DISCARD TESTS ===');
        const counter = new RummyCounter();
        counter.deckCount = 1;
        counter.toggleCardDiscard('0-0');
        this.assert(counter.discardedCards.has('0-0'), 'Card marked as discarded');
        counter.toggleCardDiscard('0-0');
        this.assert(!counter.discardedCards.has('0-0'), 'Card discard toggled off');
        counter.toggleCardDiscard('0-5');
        counter.toggleCardDiscard('0-10');
        this.assert(counter.discardedCards.size === 2, 'Multiple cards can be discarded');
    }

    // ==================== PROBABILITY TESTS ====================
    testProbabilityCalculation() {
        console.log('\n=== PROBABILITY CALCULATION TESTS ===');
        const counter = new RummyCounter();
        counter.deckCount = 1;
        const probs = counter.calculateDrawProbability();
        this.assert(Object.keys(probs).length === 13, 'Probabilities calculated for all ranks');
        
        let totalProb = 0;
        for (let rank of counter.ranks) {
            totalProb += probs[rank] || 0;
        }
        this.assert(Math.abs(totalProb - 100) < 0.1, 'Total probability sums to ~100%');

        // Each rank should have 4/52 ≈ 7.69% probability
        const expectedProb = (4 / 52) * 100;
        const aceProb = probs['A'];
        this.assert(Math.abs(aceProb - expectedProb) < 0.1, `Ace probability ~${expectedProb.toFixed(1)}%`);
    }

    testProbabilityWithDiscard() {
        console.log('\n=== PROBABILITY WITH DISCARD TESTS ===');
        const counter = new RummyCounter();
        counter.deckCount = 1;
        const probsBefore = counter.calculateDrawProbability();
        const acesBefore = probsBefore['A'];

        // Discard all aces
        for (let i = 0; i < 4; i++) {
            counter.toggleCardDiscard(`0-${i * 13}`); // Aces are at positions 0, 13, 26, 39
        }

        const probsAfter = counter.calculateDrawProbability();
        const acesAfter = probsAfter['A'];
        this.assert(acesAfter < acesBefore, 'Ace probability decreases after discarding aces');
        this.assert(acesAfter === 0, 'No aces remain after discarding all 4');
    }

    testTopDrawCards() {
        console.log('\n=== TOP DRAW CARDS TESTS ===');
        const counter = new RummyCounter();
        counter.deckCount = 1;
        const topCards = counter.getTopDrawCards();
        this.assert(topCards.length === 3, 'Returns top 3 cards');
        this.assert(topCards[0].prob >= topCards[1].prob, 'Cards sorted by probability descending');
        this.assert(topCards[1].prob >= topCards[2].prob, 'Second card >= third card probability');
        this.assert(!isNaN(parseFloat(topCards[0].prob)), 'Probability is a valid number');
    }

    // ==================== HAND PARSING TESTS ====================
    testHandParsing() {
        console.log('\n=== HAND PARSING TESTS ===');
        const counter = new RummyCounter();
        
        const valid1 = counter.parseHand('AS,2H,3D,4C');
        this.assert(valid1 && counter.hand.length === 4, 'Parses valid 4-card hand');
        
        const valid2 = counter.parseHand('KS,QH,JD,10C,9S');
        this.assert(valid2 && counter.hand.length === 5, 'Parses valid 5-card hand with face cards');

        const invalid1 = counter.parseHand('XX,YY,ZZ');
        this.assert(!invalid1 || counter.hand.length < 3, 'Rejects invalid card format');
    }

    testHandValue() {
        console.log('\n=== HAND VALUE TESTS ===');
        const counter = new RummyCounter();
        
        counter.parseHand('AS,2H,3D');
        const value1 = counter.getHandValue();
        this.assert(value1 === 6, 'A+2+3 = 6 (A=1)');

        counter.parseHand('KS,QH,JD');
        const value2 = counter.getHandValue();
        this.assert(value2 === 30, 'K+Q+J = 30 (each worth 10)');

        counter.parseHand('10S,10H,10D');
        const value3 = counter.getHandValue();
        this.assert(value3 === 30, '10+10+10 = 30');
    }

    testRankValue() {
        console.log('\n=== RANK VALUE TESTS ===');
        const counter = new RummyCounter();
        
        this.assert(counter.getRankValue('A') === 1, 'Ace = 1');
        this.assert(counter.getRankValue('5') === 5, '5 = 5');
        this.assert(counter.getRankValue('10') === 10, '10 = 10');
        this.assert(counter.getRankValue('J') === 10, 'Jack = 10');
        this.assert(counter.getRankValue('Q') === 10, 'Queen = 10');
        this.assert(counter.getRankValue('K') === 10, 'King = 10');
    }

    // ==================== ANALYSIS TESTS ====================
    testHandAnalysis() {
        console.log('\n=== HAND ANALYSIS TESTS ===');
        const counter = new RummyCounter();
        counter.deckCount = 1;
        
        counter.parseHand('AS,2H,3D');
        const analysis = counter.analyzeHand();
        this.assert(analysis.includes('HAND ANALYSIS'), 'Analysis includes header');
        this.assert(analysis.includes('DISCARD RECOMMENDATION'), 'Analysis includes discard recommendation');
        this.assert(analysis.includes('DRAW STRATEGY'), 'Analysis includes draw strategy');
        this.assert(analysis.includes('TOP 3 DRAW CARDS'), 'Analysis includes top 3 cards');
    }

    testEmptyHandAnalysis() {
        console.log('\n=== EMPTY HAND ANALYSIS TESTS ===');
        const counter = new RummyCounter();
        counter.hand = [];
        const analysis = counter.analyzeHand();
        this.assert(analysis.includes('No valid hand'), 'Empty hand shows warning');
    }

    // ==================== UI MODE TESTS ====================
    testModeSwitch() {
        console.log('\n=== UI MODE TESTS ===');
        const counter = new RummyCounter();
        
        counter.switchMode('hand');
        this.assert(counter.mode === 'hand', 'Mode switched to hand');
        
        counter.switchMode('analysis');
        this.assert(counter.mode === 'analysis', 'Mode switched to analysis');
        
        counter.switchMode('cards');
        this.assert(counter.mode === 'cards', 'Mode switched back to cards');
    }

    // ==================== EDGE CASES ====================
    testMultipleDeckScaling() {
        console.log('\n=== MULTIPLE DECK SCALING TESTS ===');
        const counter = new RummyCounter();
        
        counter.deckCount = 1;
        const probs1 = counter.calculateDrawProbability();
        
        counter.deckCount = 2;
        const probs2 = counter.calculateDrawProbability();
        
        // Probabilities should remain ~same with multiple decks (all cards available)
        this.assert(
            Math.abs(probs1['A'] - probs2['A']) < 0.1,
            'Probabilities consistent across deck counts'
        );
    }

    testAllCardsDiscarded() {
        console.log('\n=== ALL CARDS DISCARDED TESTS ===');
        const counter = new RummyCounter();
        counter.deckCount = 1;
        
        // Discard all 52 cards
        for (let i = 0; i < 52; i++) {
            counter.discardedCards.add(`0-${i}`);
        }
        
        const probs = counter.calculateDrawProbability();
        this.assert(Object.keys(probs).length === 0, 'Empty probabilities when all cards discarded');
        
        const topCards = counter.getTopDrawCards();
        this.assert(topCards.length === 0, 'No top cards when deck empty');
    }

    // ==================== RUN ALL TESTS ====================
    runAll() {
        console.clear();
        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║   RAY-BAN RUMMY COUNTER - TEST SUITE               ║');
        console.log('╚════════════════════════════════════════════════════╝');

        this.testDeckGeneration();
        this.testDeckCount();
        this.testCardDiscard();
        this.testProbabilityCalculation();
        this.testProbabilityWithDiscard();
        this.testTopDrawCards();
        this.testHandParsing();
        this.testHandValue();
        this.testRankValue();
        this.testHandAnalysis();
        this.testEmptyHandAnalysis();
        this.testModeSwitch();
        this.testMultipleDeckScaling();
        this.testAllCardsDiscarded();

        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log('║                    RESULTS                         ║');
        console.log('╚════════════════════════════════════════════════════╝');
        this.results.forEach(r => console.log(r));
        console.log(`\n✓ PASSED: ${this.passed}`);
        console.log(`✗ FAILED: ${this.failed}`);
        console.log(`TOTAL:  ${this.passed + this.failed}`);
        console.log(`\nSUCCESS RATE: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%\n`);
    }
}

// Run tests
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const tests = new RummyTests();
        tests.runAll();
        window.testResults = tests;
    });
}
