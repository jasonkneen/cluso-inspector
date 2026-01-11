# Publishing cluso-inspector to npm

## Pre-publish Checklist

1. **Test locally**
   ```bash
   cd ~/.claude/skills/clonereact/electron-app
   node bin/cluso-inspector.js https://example.com > test-output.json
   cat test-output.json | jq .
   ```

2. **Verify package.json**
   - Name: `cluso-inspector`
   - Version: Update if needed
   - Description: Clear and concise
   - Keywords: Relevant search terms
   - Repository: Update with actual GitHub URL

3. **Test with npm link**
   ```bash
   cd ~/.claude/skills/clonereact/electron-app
   npm link
   cluso-inspector https://example.com
   npm unlink -g cluso-inspector
   ```

## Publishing Steps

### First Time Setup

1. **Create npm account** (if you don't have one)
   ```bash
   npm adduser
   ```

2. **Login to npm**
   ```bash
   npm login
   ```

### Publish Package

1. **Update version** (if needed)
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   # or
   npm version minor  # 1.0.0 -> 1.1.0
   # or
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **Publish to npm**
   ```bash
   cd ~/.claude/skills/clonereact/electron-app
   npm publish
   ```

3. **Test installation**
   ```bash
   npx cluso-inspector https://github.com
   ```

## Post-publish

1. **Update README** with actual npm install instructions
2. **Tag release** in git
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Making Updates

1. Make code changes
2. Test locally
3. Update version: `npm version patch`
4. Publish: `npm publish`

## Package URLs

After publishing:
- npm: https://www.npmjs.com/package/cluso-inspector
- GitHub: https://github.com/yourusername/cluso-inspector

## Troubleshooting

- **Name taken**: Change package name in package.json (try `@yourusername/cluso-inspector`)
- **Permission denied**: Run `npm login` again
- **Test before publish**: Use `npm pack` to create a tarball without publishing
