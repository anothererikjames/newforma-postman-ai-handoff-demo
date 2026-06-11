import { createApp } from "./app";

const port = Number(process.env.API_PORT || 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`Newforma demo API listening on http://localhost:${port}`);
  console.log(`Health check:        GET  http://localhost:${port}/health`);
  console.log(`Auth (demo only):    Authorization: Bearer ${process.env.AUTH_TOKEN || "demo-token"}`);
});
