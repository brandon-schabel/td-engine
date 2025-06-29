# Wave TD

A modern tower defense game built with TypeScript and Tauri.

## Features

- 🏰 Multiple tower types with unique abilities
- 👾 Diverse enemy types and wave patterns
- 🎯 Strategic gameplay with resource management
- 📱 Touch-friendly controls for mobile devices
- 🎨 Clean, modern UI with responsive design
- 🏗️ Upgrade system for towers and player abilities
- 💾 Inventory system for items and equipment

## Development

### Prerequisites

- Node.js (LTS version)
- Rust (for Tauri)
- Bun (preferred) or npm

### Setup

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run Tauri development
bun run tauri:dev
```

### Building

```bash
# Build for production
bun run build

# Build Tauri app
bun run tauri:build

# Build for macOS (universal binary)
bun run tauri:build -- --target universal-apple-darwin
```

## Testing

```bash
# Run tests
bun test

# Type checking
bun typecheck
```

## Release Process

See [RELEASE.md](RELEASE.md) for detailed release instructions.

## Code Signing

See [docs/CODE_SIGNING_SETUP.md](docs/CODE_SIGNING_SETUP.md) for platform-specific code signing setup.

## Architecture

The game uses a component-based architecture with:

- **Entity System**: All game objects inherit from a base Entity class
- **UI System**: Floating UI manager with utility-first CSS
- **Audio System**: Centralized audio management
- **Touch System**: Comprehensive touch gesture support

## Contributing

1. Write tests first (TDD approach)
2. Use strong typing (no `any`)
3. Follow functional programming principles
4. Keep functions small and focused
5. Update documentation as needed

## License

Copyright (c) 2024. All rights reserved.