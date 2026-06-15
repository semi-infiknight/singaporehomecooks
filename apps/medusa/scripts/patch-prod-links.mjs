import fs from "node:fs";
import path from "node:path";

const linksDir = path.join(process.cwd(), "src", "links");
for (const file of fs.readdirSync(linksDir)) {
  if (!file.endsWith(".js") || file.endsWith(".map")) continue;
  const filePath = path.join(linksDir, file);
  const patched = fs
    .readFileSync(filePath, "utf8")
    .replace(
      /require\("\.\.\/modules\/([^"]+)"\)/g,
      (_match, name) => `require("../modules/${name}/index.js")`
    );
  fs.writeFileSync(filePath, patched);
}
console.log("[shc-medusa] Patched link module requires for production");