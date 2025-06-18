# Hardcoded Values Configuration Audit Report

**Last Updated**: Configuration constants have been implemented for all identified hardcoded values.

This report documents the hardcoded values that were found in the codebase and the configuration constants that have been created to replace them.

## 1. UI and Display Constants

### Virtual Joystick (`src/ui/components/VirtualJoystick.ts`)
- **baseSize**: 120px
- **knobSize**: 40px  
- **maxDistance**: 60px
- **deadZone**: 0.2 (20%)
- **margin**: 40px
- **haptic duration**: 10ms (light), 25ms (medium), 50ms (heavy)
- **animation duration**: 200ms

### Mobile Controls (`src/ui/components/game/MobileControls.ts`)
- **joystickRadius**: 60px (base), calculated as 50-80px range
- **knobRadius**: 25px
- **controlsHeight**: 200px (150px for small screens)
- **safeAreaBottom**: 20px minimum
- **baseSize percentage**: 15% of smallest viewport dimension
- **buttonSize**: 60-100px range
- **margin percentage**: 5% of viewport width
- **bottomOffset**: 8% of viewport height
- **directionThreshold**: 0.3
- **animation duration**: 200ms
- **touch responsiveness threshold**: 0.2 * joystickRadius

### Floating UI Base (`src/ui/components/floating/FloatingUIBase.ts`)
- **backgroundColor**: 'rgba(0, 0, 0, 0.8)'
- **borderColor**: '#FFD700'
- **borderWidth**: 2px
- **borderRadius**: 8px
- **padding**: '8px 12px'
- **textColor**: '#FFD700'
- **fontSize**: 'clamp(14px, 3vw, 18px)'
- **fontWeight**: 'bold'
- **zIndex**: 100
- **gap**: 8px

## 2. Game Mechanics Values

### Projectile (`src/entities/Projectile.ts`)
- **lifetime**: 3000ms (3 seconds max lifetime)
- **radius**: 3px
- **health**: 1
- **default speed**: 300 (passed as parameter but has default)

### Enemy (`src/entities/Enemy.ts`)
- **Attack range priority multiplier**: Referenced from ENEMY_BEHAVIOR config
- **Waypoint reached threshold**: Referenced from ENEMY_BEHAVIOR config
- **Outline colors**:
  - Tower attackers: '#FFD700' (gold)
  - Player attackers: '#FF4444' (red)
  - Default: '#000000' (black)
- **Outline widths**: 1px or 2px

### Tower (`src/entities/Tower.ts`)
- **Selection indicator**:
  - Inner radius offset: +8px
  - Outer radius offset: +12px
  - Selection color: '#4CAF50'
  - Glow color: 'rgba(76, 175, 80, 0.3)'
  - Line width: 3px (inner), 2px (outer)
  - Dash pattern: [5, 3]
- **Upgrade dots**:
  - Angle spacing: 120 degrees
  - Distance from tower: radius + 8px
  - Dot spacing: 4px
  - Dot outline width: 1px
  - Dot outline color: '#000000'
- **Wall color**: '#666666'
- **Sell value percentage**: 60% (0.4 passed to calculation)

### Player Combat (`src/entities/player/PlayerCombat.ts`)
- **Aimer length**: 100px
- **Cooldown calculation**: 1000 / fireRate (milliseconds)

### Infinite Wave Generator (`src/systems/InfiniteWaveGenerator.ts`)
- **Start delay between waves**: 2000ms (2 seconds)
- **Base enemy count**: 8
- **Swarm multiplier**: 1.5 (50% more enemies)
- **Elite multiplier**: 0.7 (30% fewer enemies)
- **Swarm health multiplier**: 0.7
- **Elite health multiplier**: 1.5
- **Enemy mix thresholds**: Waves 3, 7, 15, 25
- **Boss wave tank ratio**: 0.6
- **Pattern progression**: Every 3 waves

### Camera (`src/systems/Camera.ts`)
- **Default smoothing**: 0.04
- **Default zoom**: 1.0
- **Default min zoom**: 0.5
- **Default max zoom**: 3.0
- **Default zoom speed**: 0.15
- **Default zoom smoothing**: 0.12
- **Debug crosshair size**: 20px lines, 5px circle
- **Debug text position**: 10px, 20px (and +20px increments)
- **Debug font**: '14px monospace'
- **Debug color**: '#00FF00'

## 3. Rendering Values

### Tower Rendering
- **Upgrade outline thickness**: Referenced from RENDER_CONFIG
- **Color intensity calculations**: Uses formulas with multipliers from configs

### Enemy Rendering  
- **Default colors by type**:
  - BASIC: '#F44336'
  - FAST: '#FF5722'
  - TANK: '#9C27B0'
- **Target line colors**:
  - Tower target: 'rgba(255, 215, 0, 0.5)'
  - Player target: 'rgba(255, 68, 68, 0.5)'
- **Line dash pattern**: [3, 3]
- **Line width**: 1px

## 4. Animation and Timing Constants

### General Animation Durations
- **Joystick reset**: 200ms
- **UI transitions**: 200ms (common across multiple components)
- **Cooldown updates**: Frame-based with delta time

## 5. Responsive Design Magic Numbers

### Breakpoints and Thresholds
- **Mobile breakpoint**: 768px
- **Landscape height threshold**: 600px
- **Small screen height**: 500px
- **Control height adjustments**:
  - Normal: 200px
  - Small screens: 150px
  - Landscape: 120px
  - Very small: 100px

## Implementation Status

### ✅ Completed Updates

1. **ColorTheme.ts** - Added:
   - `towers.wall`: Wall tower color
   - `towers.outline.base/upgraded`: Tower outline colors
   - `towers.selection.indicator/glow`: Selection effect colors
   - `ui.controls.joystick`: Virtual joystick colors

2. **RenderingConfig.ts** - Added:
   - `ENTITY_RENDER.selection.radiusOffset/glowRadiusOffset`: Selection indicator offsets
   - `ENTITY_RENDER.upgradeDots.distanceOffset/angleSpacing`: Upgrade dot positioning
   - `ENTITY_RENDER.visibility.minTargetDistance`: Target visibility check distance
   - `ENTITY_RENDER.glowEffects`: Glow effect radii for pickups
   - `ENTITY_RENDER.pickups.health.crossSize`: Health pickup cross dimensions
   - `ENTITY_RENDER.powerUpIcons`: Power-up icon dimensions
   - `TOWER_RENDER.selection.dashPattern`: Selection dash pattern
   - `PLAYER_RENDER.levelProgression`: Player color progression by level
   - `PLAYER_RENDER.movementIndicatorOffset/levelTextOffset`: UI offsets

3. **UIConstants.ts** - Added:
   - `virtualJoystick.deadZone`: Joystick dead zone threshold
   - `hapticFeedback`: Haptic feedback durations
   - `fonts`: Centralized font definitions

4. **GameplayConstants.ts** - Updated:
   - `economy.sellRefund`: Changed from 0.7 to 0.6 to match implementation
   - `playerMechanics.healthThresholds`: Added low and critical health thresholds

### ✅ Updated Source Files

1. **Tower.ts**:
   - Now uses configuration for all selection indicators, colors, and offsets
   - Fixed sell value calculation to use `GAMEPLAY_CONSTANTS.economy.sellRefund`

2. **PlayerHealth.ts**:
   - Now uses `GAMEPLAY_CONSTANTS.playerMechanics.healthThresholds`

3. **EntityRenderer.ts**:
   - Now uses configuration for all rendering constants
   - Player level colors use progression configuration
   - All icon dimensions use centralized constants

4. **VirtualJoystick.ts**:
   - Now uses configuration for dead zone, colors, and haptic feedback

## Benefits Achieved

- ✅ Centralized configuration for easy theming
- ✅ Consistent values across the codebase
- ✅ Easier maintenance and tweaking
- ✅ Better adherence to project guidelines (no hardcoded values)
- ✅ All identified hardcoded values have been replaced with configuration constants