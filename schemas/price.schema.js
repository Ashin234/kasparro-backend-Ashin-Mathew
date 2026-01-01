const { z } = require("zod");

const PriceSchema = z.object({
  price_usd: z.number().positive(),
  source: z.string().min(1),
  last_updated: z.date(),
});

module.exports = PriceSchema;
