# Ray-Ban Rummy Counter

**Card counting strategy app optimized for Meta Ray-Ban smart displays**

A professional-grade Rummy/Gin Rummy card tracking and strategy analysis tool designed specifically for fixed 600×600px viewport devices with limited input (arrow keys, enter only).

## Features

### 1. **Card Tracking Mode**
- Visual grid of all 52 cards (or up to 10 standard decks)
- Click or press Enter to mark cards as discarded
- Real-time discard pile visualization
- Deck selector (1-10 decks) with arrow-key navigation
- Arrow-key card navigation for hands-free operation

### 2. **Hand Analysis Mode**
- Parse your current hand (format: `AS,2H,3D,4C,KS`)
- **Strategic recommendations:**
  - Which card to DISCARD (high value + low deck probability)
  - Whether to DRAW or PICK UP the discard pile
  - Top 3 highest-probability cards for next draw
  - Hand value calculation (Rummy scoring)

### 3. **Probability Analysis Mode**
- Real-time probability calculations for all remaining cards
- Probability updates as cards are marked as discarded
- Percentage likelihood of drawing each rank
- Top 3 draw cards ranked by probability

## Mathematical Foundations

### Probability Calculation
```
P(rank) = (Remaining Cards of Rank) / (Total Remaining Cards) × 100
```

### Hand Value Scoring (Rummy)
- Ace = 1 point
- 2-9 = Face value
- 10/J/Q/K = 10 points

### Discard Strategy
Cards are ranked for discard by:
1. **Card Value** (higher values first)
2. **Deck Probability** (lower probability is better)

Formula: `discard_score = card_value + (1 - deck_probability)`

### Draw Decision Logic
- **DRAW from deck** = higher expected value from remaining deck
- **PICK UP discard** = if discard directly completes a meld

## UI Controls

### Keyboard Navigation
- **Arrow Keys** (`←` `→`): Navigate cards or adjust deck count
- **Arrow Keys** (`↑` `↓`): Scroll within analysis panels
- **Enter / Space**: Toggle card discard or activate buttons
- **Tab**: Cycle through cards (alternative navigation)

### Mouse/Touch (Optional)
- Click any card to toggle discard status
- Click deck count buttons to change
- Click mode buttons to switch views

## Hand Format

Enter your hand as comma-separated card codes:
- **Ranks**: A, 2-9, 10, J, Q, K
- **Suits**: S (♠), H (♥), D (♦), C (♣)

**Examples:**
```
AS,2H,3D,4C,5S      (5-card hand)
KS,QH,JD,10C        (face cards)
AS,AS,2H,2H,3D      (with duplicates, if using multiple decks)
```

## Viewport Specifications

- **Resolution**: 600 × 600 pixels (fixed, no scrolling needed for primary content)
- **Display Type**: Dark additive (OLED-optimized for Ray-Ban displays)
- **Color Scheme**: Neon green on black (#00ff00 on #0a0a0a)
- **Font**: Monospace (Courier New) for legibility on small screens
- **Input**: Keyboard-first (arrow keys, Enter) + optional mouse/touch

## Ray-Ban Compatibility

✅ **Fully optimized for:**
- Meta Ray-Ban Smart Glasses
- 600×600px fixed viewport
- Limited GPU with additive blending
- Monochrome or limited color palettes
- Arrow-key primary navigation
- Minimal animation (performance)
- Zero external dependencies

## Technical Details

### No Dependencies
- Pure vanilla JavaScript (ES6+)
- No frameworks, no build tools required
- Single HTML file can be served directly

### File Structure
```
index.html          Main application (HTML + CSS + DOM structure)
app.js              Core logic (card management, probability engine, UI)
tests.js            Automated test suite (14 test categories)
test-runner.js      Node.js test execution
package.json        Metadata & scripts
README.md          This file
```

### Performance Optimization
- Minimal reflows during card toggling
- Efficient DOM queries with data attributes
- Pre-calculated probability caching ready for expansion
- Zero external asset loads

## Testing

Run the automated test suite:

```bash
npm test
```

Or open `index.html` in a browser and check console:
```javascript
window.testResults  // Access test results object
```

### Test Coverage (14 test suites)
- ✅ Deck generation (52 cards, 4 suits, 13 ranks)
- ✅ Deck count (1-10, with clamping)
- ✅ Card discard toggling
- ✅ Probability calculations
- ✅ Probability with discards
- ✅ Top draw card ranking
- ✅ Hand parsing (valid/invalid formats)
- ✅ Hand value calculation
- ✅ Rank value scoring
- ✅ Hand analysis generation
- ✅ Empty hand edge cases
- ✅ UI mode switching
- ✅ Multiple deck scaling
- ✅ All cards discarded (edge case)

## Usage Example

### Scenario: You're playing Rummy

1. **Start with CARDS mode**
   - Select number of decks (1-10)
   - As cards are played/discarded, click them to mark as gone
   - Watch real-time probability update

2. **Switch to HAND mode**
   - Enter your hand: `KS,QD,JH,10C,9S`
   - System tells you: **DISCARD the KS** (highest value, low probability)
   - Recommendation: **DRAW from deck** (better odds)
   - Top draws: **Q (8.3%), J (8.3%), 10 (8.3%)**

3. **Use ANALYZE mode**
   - Continuous probability display
   - See which cards are most likely in next draw
   - Adjust discard strategy in real-time

## Future Enhancements

- [ ] Opponent hand tracking
- [ ] Meld pattern recognition
- [ ] Draw/discard history log
- [ ] Settings persistence (localStorage)
- [ ] Voice input for hands-free operation
- [ ] Network multiplayer (Bluetooth to phone)
- [ ] Haptic feedback (Ray-Ban-native)
- [ ] Advanced AI strategy (Monte Carlo simulation)

## License

MIT License - See LICENSE file

## Author

Built for Meta Ray-Ban smart displays by glasses12345

---

**Disclaimer:** This tool is for learning and entertainment purposes. While it provides strategic recommendations based on probability, outcomes depend on actual card distribution and opponent play. Always play responsibly.
