const username = "wfynbzlx666";
const packages = [
  "@wfynbzlx666/sdk-core",
  "@wfynbzlx666/sdk-http",
  "@wfynbzlx666/sdk-perf",
  "@wfynbzlx666/sdk-telemetry",
  "@wfynbzlx666/sdk-realtime",
  "@wfynbzlx666/sdk-perf-spa",
];

let total = 0;

for (const pkg of packages) {
  const res = await fetch(`https://api.npmjs.org/downloads/point/2020-01-01:2025-12-14/${pkg}`);
  const data = await res.json();
  console.log(`${pkg}: ${data.downloads}`);
  total += data.downloads || 0;
}

console.log(`总下载量: ${total}`);
