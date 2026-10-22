const bcrypt = require("bcrypt");

async function main() {
  const password = "BenchmarkPassword123!";
  const hash = await bcrypt.hash(password, 10);

  const start = performance.now();

  await bcrypt.compare(password, hash);

  console.log(
    `Single bcrypt comparison: ${(performance.now() - start).toFixed(2)} ms`
  );
}

main().catch(console.error);