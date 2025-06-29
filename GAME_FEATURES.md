# Wave TD - Comprehensive Feature List

## Overview
Wave TD is a modern tower defense game with RPG elements, featuring multiple tower types, diverse enemies, and both classic and infinite game modes. The game engine supports web, desktop, and mobile platforms with comprehensive touch controls and gesture support.

## Core Game Mechanics

### Tower System
- **4 Tower Types** with unique characteristics:
  - **Basic Tower**: Balanced all-around tower with green color scheme
  - **Sniper Tower**: Long-range, high-damage specialist with slow fire rate
  - **Rapid Tower**: Fast-firing crowd control with rotating multi-barrel design
  - **Wall Tower**: Defensive structure with no attack but high health

- **Tower Upgrade System**:
  - 3 upgrade paths per tower: Damage, Range, Fire Rate
  - Maximum 10 levels per upgrade type
  - Visual upgrade indicators (colored dots show upgrade levels)
  - Sell towers for 60% of total invested value
  - Repair system for damaged towers

### Enemy System
- **5 Enemy Types** with distinct behaviors:
  - **Basic Enemy**: Standard red enemies with balanced stats
  - **Fast Enemy**: Quick amber enemies that rush the player
  - **Tank Enemy**: Slow purple enemies with high health
  - **Flying Enemy**: Light blue enemies that ignore terrain
  - **Boss Enemy**: Deep red enemies with massive health pools

- **3 Behavior Patterns**:
  - Player-focused: Prioritizes attacking the player
  - Tower-focused: Targets towers first
  - Opportunist: Attacks the closest target

### Wave Progression
- **Classic Mode**: Standard wave progression with increasing difficulty
- **Infinite Mode**: Endless waves with special wave types:
  - Normal waves (standard composition)
  - Swarm waves (50% more enemies, 70% health/damage)
  - Elite waves (30% fewer enemies, 150% health/damage)
  - Boss waves (every 5 waves, massive single enemy)
- Dynamic spawn timing and enemy composition
- Multiple spawn zones around map edges

## Game Systems

### Economy
- Starting currency: 100 coins
- Currency rewards scale with enemy difficulty
- Interest system: 2% per wave (maximum 50 currency)
- Wave completion bonuses
- Milestone rewards in infinite mode
- Strategic sell/rebuild economy management

### Player Progression
- **5 Permanent Upgrade Types**:
  - **Damage Boost**: +15% damage per level (max level 10)
  - **Rapid Fire**: +12% fire rate per level (max level 10)
  - **Swift Movement**: +10% movement speed per level (max level 8)
  - **Vitality**: +20% max health per level (max level 10)
  - **Regeneration**: +2 HP/second per level (max level 5)
- Experience-based leveling system
- Upgrade points earned through gameplay achievements

### Difficulty Settings
- **Easy**: 49% enemy health, 56% speed, 130% tower damage
- **Normal**: 70% enemy health/speed, standard damage
- **Hard**: 105% enemy health, 84% speed, 80% tower damage
- **Endless**: 140% enemy health, 105% speed, 70% tower damage

## User Interface

### Menu Systems
- **Main Menu**: Play, Settings, Leaderboard, Credits
- **Pre-Game Setup**: Map selection, difficulty choice
- **Settings Menu**: Audio controls, graphics options, control customization
- **Leaderboard**: High scores with detailed statistics
- **Game Over Screen**: Performance stats and retry options

### In-Game UI
- **Build Menu**: Grid-based tower placement interface
- **Tower Upgrade Dialog**: Visual upgrade paths with cost display
- **Inventory System**: Equipment and consumable management
- **HUD Elements**:
  - Player health and stats
  - Currency display
  - Wave information and timer
  - Mini-map (when applicable)
  - Mobile dual-joystick controls

### Inventory & Equipment
- **Item Categories**:
  - Consumables: Health potions, temporary buffs
  - Equipment: Weapons, armor, accessories
  - Materials: Crafting resources
  - Special Items: Tokens, gems, collectibles
- **Equipment Slots**: Weapon, Armor, Accessory
- **Rarity Tiers**: Common, Rare, Epic, Legendary
- Stack management for consumables
- Item metadata and descriptions

## Visual Features

### Map Biomes
- **5 Unique Environments**:
  - **Forest**: Lush green with trees and water features
  - **Desert**: Sandy terrain with cacti and rock formations
  - **Arctic**: Ice and snow with frozen decorations
  - **Volcanic**: Lava flows and volcanic rock
  - **Grassland**: Open fields with flowers and meadows

### Visual Effects
- Damage flash indicators on hit
- Death animations for enemies
- Boss glow and special effects
- Tower range visualization
- Projectile trails and impact effects
- Environmental particle effects
- Animated decorative elements

### Collectibles & Power-ups
- **Drop Types**:
  - Health restoration pickups
  - Temporary damage boosts
  - Fire rate enhancements
  - Currency bonuses
  - Shield power-ups
  - Movement speed boosts
- 10% base drop chance from enemies
- Duration-based temporary effects
- Visual indicators for active buffs

## Audio System

### Sound Categories
- **Combat Audio**: Weapon firing, projectile impacts, enemy deaths
- **Tower Audio**: Placement, upgrades, destruction, selling
- **UI Audio**: Button clicks, menu navigation, confirmations, errors
- **Game State Audio**: Wave starts/completions, victory fanfares, defeat sounds
- **Pickup Audio**: Collection sounds for health, currency, power-ups
- **Player Audio**: Level up chimes, healing, movement
- **Ambient Audio**: Environmental sounds based on biome

### Audio Features
- Positional audio with distance-based volume
- Synthesized retro-style sound effects
- Dynamic audio mixing
- Adjustable volume controls
- Audio pool management for performance

## Control Systems

### Mouse Controls
- Left-click for tower placement and selection
- Right-click to cancel actions
- Hover for detailed tooltips
- Drag for camera panning (when enabled)
- Scroll wheel for zoom

### Keyboard Controls
- WASD/Arrow keys for player movement
- Spacebar for shooting
- Tab for inventory toggle
- Escape for pause menu
- Number keys for quick actions
- Shift for precision placement

### Touch Controls
- Tap for tower placement and selection
- Dual on-screen joysticks (movement + aiming)
- **Advanced Gestures**:
  - Swipe to pan camera with momentum
  - Pinch to zoom with focal point preservation
  - Double tap to center camera on player
  - Long press for context menus
  - Gesture velocity detection
  - Smooth inertial scrolling
  - Auto-follow after 3 seconds of inactivity

## Game Modes & Maps

### Available Modes
- **Classic Mode**: Standard tower defense with finite waves
- **Infinite Mode**: Endless survival with progressive difficulty
- **Map Challenges**: Specific objectives on unique maps
- **Custom Games**: Configurable parameters

### Map Generation
- Procedural map generation system
- **Map Sizes**: Small (20x20), Medium (30x30), Large (40x40), Huge (50x50)
- Strategic terrain features:
  - Natural choke points
  - Open battlefields
  - Elevated positions
  - Impassable terrain
- Water features and obstacles
- Path complexity settings
- Multiple spawn point configurations

## Technical Features

### Engine Capabilities
- **A* Pathfinding**: Intelligent enemy navigation with obstacle avoidance
- **Dynamic Camera**: Smooth following, boundary constraints, zoom limits
- **Grid System**: Efficient tower placement validation
- **Save System**: LocalStorage persistence for progress
- **Leaderboard**: Score tracking with detailed statistics
- **Performance Optimization**:
  - Entity culling for off-screen objects
  - Update radius optimization
  - Efficient collision detection
  - Object pooling for projectiles

### Platform Support
- **Web**: Full browser compatibility
- **Desktop**: Tauri-based native application
- **Mobile**: iOS and Android support
- Responsive design for all screen sizes
- Cross-platform save synchronization (when available)

### Architecture Features
- Configuration-driven gameplay values
- Component-based entity system
- Event-driven communication
- Modular subsystem design
- Plugin architecture for extensions
- Debug mode with performance statistics
- Gesture visualization tools

## Unique Features
- RPG-style inventory and equipment system in a tower defense game
- Comprehensive touch gesture support for mobile play
- Multiple enemy behavior patterns for strategic depth
- Interest-based economy encouraging efficient spending
- Biome-specific visual themes and decorations
- Synthesized retro audio with positional sound
- Infinite mode with special wave types
- Cross-platform compatibility with unified codebase
- Real-time upgrade visualization on towers
- Dynamic difficulty scaling in endless mode

This game combines classic tower defense mechanics with modern features and polish, creating an engaging experience across all platforms with particular attention to mobile usability and visual appeal.