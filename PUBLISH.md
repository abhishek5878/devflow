# Publishing DevFlow to VS Code Marketplace

## Prerequisites

1. **Azure DevOps account** — VS Code extensions use the same publisher system as Azure DevOps. Sign up at [marketplace.visualstudio.com](https://marketplace.visualstudio.com).
2. **Personal Access Token (PAT)** — Create one with **Marketplace** (Publish) scope at [dev.azure.com](https://dev.azure.com) → User Settings → Personal Access Tokens.
3. **Publisher** — Create a publisher at [marketplace.visualstudio.com/manage/publishers](https://marketplace.visualstudio.com/manage/publishers). Use your ID (e.g. `abhishek5878`) in `devflow-vscode/package.json`:
   ```json
   "publisher": "your-publisher-id"
   ```

## Icon (required for marketplace)

Add a 128×128 PNG icon at `devflow-vscode/icon.png`. Marketplace uses it for the extension listing. Then add to `package.json`:
```json
"icon": "icon.png"
```

## Package and publish

```bash
cd devflow-vscode
npm install
npm run package
# Creates devflow-0.1.0.vsix
```

Publish:
```bash
npx vsce publish -p <YOUR_PAT>
```

Or use `npx vsce login` first, then `npx vsce publish`.

## Checklist before publish

- [ ] Update `publisher` in `devflow-vscode/package.json`
- [ ] Add `icon.png` (128×128)
- [ ] Bump version in `package.json` for releases
- [ ] Test: install `.vsix` locally (Extensions → ⋯ → Install from VSIX)
- [ ] Ensure `vscode:prepublish` builds successfully
