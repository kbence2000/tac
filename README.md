# TAC High-End Dev Environment

Ez a csomag egy **high-end GitHub + Cloudflare + CodeSandbox / Codespaces** fejlesztői környezet sablon.
Másold be a fájlokat a saját repo-d gyökerébe, majd commit+push.

## Fő elemek

- `.devcontainer/` – VS Code Dev Containers / GitHub Codespaces / CodeSandbox
- `.codesandbox/tasks.json` – CodeSandbox VM tasks
- `.github/workflows/ci.yml` – Build + lint pipeline
- `.github/workflows/lockfile-fix.yml` – *Automatikus lockfile-fixer* pipeline

## Gyors használat

1. Másold be a mappákat a saját repo-dba.
2. Locálisan vagy Codespaces-ben futtasd:

   ```bash
   npm install
   ```

   Ez frissíti a `package-lock.json`-t.
3. Commit+push.
4. A CI és a lockfile-fixer innentől automatikusan fut.
