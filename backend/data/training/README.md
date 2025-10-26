# ApyHub RAG Training Data

This directory contains expert DeFi strategy knowledge used to train the ApyHub AI system.

## Files

| File | Purpose | Documents |
|------|---------|-----------|
| `defi_rag_corpus.md` | Structured strategy chunks | 11 chunks |
| `defi_qa_pairs.jsonl` | Question-answer pairs | 25 pairs |
| `training_qa.jsonl` | Training examples with tags | 38 examples |
| `rag_documents.jsonl` | Full Twitter thread data | 41 documents |
| `strategies_pdf_text.txt` | Raw text corpus | Reference |
| `defi_corpus_combined.txt` | Combined corpus | Reference |
| `threads_index.csv` | Thread metadata index | Reference |

**Total: 115 documents loaded into RAG system**

## Data Sources

The training data is sourced from expert Twitter threads about DeFi yield strategies:

- **ETH Yield Strategies** - @phtevenstrong's curated ETH strategies (15-25% APY)
- **BTC Yield Strategies** - BTC basis trades and vaults (10-20% APY)
- **Stablecoin Strategies** - Non-leveraged and leveraged stable yields (8-50% APY)
- **Risk Management** - LTV management, liquidation prevention, exit strategies
- **Fee Optimization** - Cheat looping, NAV checking, redemption windows
- **Protocol Analysis** - Liquity, Pendle, Morpho, Aave, Euler, and 50+ protocols

## Covered Strategies

### Low Risk (8-15% APY)
- Pendle PT fixed-rate strategies
- Lend aggregators (Gauntlet, SummerFi)
- Stability pools (fxSAVE, sBOLD)
- Senior tranches (Resolv, Reservoir)

### Medium Risk (15-25% APY)
- ETH Super-Basis (Liquity + Maple + Drift)
- BTC basis arbitrage (f(x) + Hyperliquid)
- Basis trades and tranching
- weETH non-leveraged loops

### High Risk (25-50%+ APY)
- Leveraged PT loops (Morpho, Euler)
- Junior tranches (RLP)
- BOLD Gold loops
- High LLTV strategies

## Advanced Techniques

### Cheat Looping
Avoid swap fees by borrowing first, then supplying collateral (Thread #8, #15).

### NAV Checking
Use Etherscan `previewRedeem` to check Net Asset Value for arbitrage (Thread #3).

### Fee Avoidance
- Wait 7 days for fee-free redemptions
- Use limit orders on CoWSwap
- Manual entry vs zap functions

### Exit Strategies
- 1:1 USDC redemption paths
- Gradual unwinding for large positions
- Emergency de-leveraging procedures

## File Formats

### JSONL Format (`.jsonl`)
One JSON object per line:
```jsonl
{"prompt": "Question here", "response": "Answer here", "tags": ["tag1", "tag2"]}
{"prompt": "Another question", "response": "Another answer", "tags": ["tag3"]}
```

### Markdown Format (`.md`)
Structured with headers:
```markdown
## Chunk 01 — Strategy Name
- Setup: Step-by-step instructions
- Math: APY calculations
- Risks: Risk factors and mitigations
```

## How RAG Uses This Data

1. **On Startup**: Backend loads all files into memory
2. **Document Splitting**: Large docs split into 500-word chunks
3. **Embedding Generation**: OpenAI creates vector embeddings (optional)
4. **Semantic Search**: User queries matched to relevant documents
5. **Context Enhancement**: Retrieved knowledge enhances GPT responses

## Adding New Strategies

To add new expert strategies:

1. **Create Q&A Pair** in `defi_qa_pairs.jsonl`:
```jsonl
{"prompt": "How do I execute the XYZ strategy?", "response": "Step 1... Step 2...", "tags": ["xyz", "advanced"]}
```

2. **Add Corpus Entry** in `defi_rag_corpus.md`:
```markdown
## Chunk XX — XYZ Strategy Name
- Setup: Detailed setup instructions
- Math: APY calculation with example
- Risks: Risk factors
- Why it works: Explanation
```

3. **Restart Backend**: New data loaded automatically
```bash
cd backend && npm run dev
```

## Quality Guidelines

When adding new strategies:
- ✅ Include specific numbers (APY, LTV, amounts)
- ✅ Name exact protocols and contracts
- ✅ Provide step-by-step instructions
- ✅ List all risks and mitigations
- ✅ Show math/calculations
- ❌ Avoid vague language ("might work", "possibly")
- ❌ Don't include outdated data
- ❌ No promotional content

## Testing

Test the RAG system:
```bash
# Check loaded documents
curl http://localhost:3001/api/strategy-ai/stats

# Search for specific strategy
curl "http://localhost:3001/api/strategy-ai/search?asset=ETH"

# Get recommendation
curl -X POST http://localhost:3001/api/strategy-ai/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "Best ETH strategy", "riskTolerance": "medium"}'
```

## Credits

Training data compiled from:
- DeFi Dojo community (@phtevenstrong)
- Liquity ecosystem strategists (@bjnpck)
- 628Labs research (@OG_RogerTennis)
- Expert Twitter threads (2023-2025)

## License

Educational use only. Strategy data sourced from public Twitter threads.