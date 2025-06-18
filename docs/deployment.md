# GitHub Pages Deployment

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the main branch.

## Deployment Setup

### 1. Enable GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the sidebar
3. Under "Build and deployment", set:
   - Source: GitHub Actions
   - (The workflow will handle the rest)

### 2. Automatic Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Triggers on pushes to the `main` branch
2. Installs dependencies using Bun
3. Builds the project
4. Deploys the built files to GitHub Pages

### 3. Manual Deployment

You can also deploy manually using:

```bash
bun run deploy
```

Note: This requires the `gh-pages` package to be installed.

## Accessing the Deployed Game

Once deployed, your game will be available at:

```
https://[your-username].github.io/td-engine/
```

For this repository: https://brandon-schabel.github.io/td-engine/

## Configuration

The deployment is configured in:

- `vite.config.ts`: Sets the base URL to `/td-engine/`
- `.github/workflows/deploy.yml`: Defines the deployment workflow
- `package.json`: Contains build and deploy scripts

## Troubleshooting

1. **Build Errors**: If TypeScript errors prevent building, use `bun run build` (without type checking) instead of `bun run build:check`

2. **404 Errors**: Ensure the `base` in `vite.config.ts` matches your repository name

3. **Deployment Not Working**: Check that GitHub Pages is enabled and set to use GitHub Actions as the source

## Local Testing

To test the production build locally:

```bash
bun run build
bunx vite preview
```

This will serve the built files locally so you can verify everything works before deploying.