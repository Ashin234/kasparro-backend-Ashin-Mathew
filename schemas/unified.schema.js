const { z } = require("zod");

const UnifiedCryptoSchema = z.object({
  coin_id: z.string(),
  name: z.string(),
  symbol: z.string(),
  price_usd: z.number(),
  source: z.string(),
  last_updated: z.date(),
});

module.exports = UnifiedCryptoSchema;
