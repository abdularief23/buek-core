import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { createServer } from "./server.js";

const env = loadEnv();
const app = await createServer(env);

app.listen(env.port, () => {
  console.log(`Buek Core API listening on port ${env.port}`);
});
