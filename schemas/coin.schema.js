const { z } = require("zod");

const CoinSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
});

module.exports = CoinSchema;
