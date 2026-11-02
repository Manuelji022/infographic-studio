import { cp, mkdir, readdir } from "node:fs/promises";

const source = new URL("../design-system/fonts/", import.meta.url);
const destination = new URL("../public/fonts/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const file of await readdir(source)) {
  if (file.endsWith(".woff2")) {
    await cp(new URL(file, source), new URL(file, destination));
  }
}
