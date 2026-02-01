# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based side-scrolling endless runner game featuring a ninja character. Built with vanilla JavaScript using HTML5 Canvas, no build tools or dependencies required.

## Running the Game

Open `index.html` directly in a browser, or serve with any static file server:
```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Architecture

### Core Game Structure (game.js)

Single-file game engine with all classes in `game.js`:

- **Game** - Main game loop, state management (loading/menu/playing/paused/gameover/levelcomplete), spawning logic, collision detection
- **Ninja** - Player character with physics (gravity/jump), animations (run/jump/slide/idle), attack with projectiles
- **Background** - Parallax scrolling background
- **Obstacle** - Ground obstacles (spikes, fire, rock) and overhead obstacles (branch - must slide under)
- **Enemy** - Animated enemies that move toward player, can be destroyed with projectiles
- **Item** - Collectibles (coins, scrolls) with bobbing animation
- **Projectile** - Ninja throwing stars (shuriken)
- **Effect** - Particle effects for dust on jump/slide

### Game Controls
- **Space** - Jump
- **Arrow Down** - Slide (hold)
- **F** - Attack (throws shuriken)
- Touch controls appear on mobile devices

### Level System
9 levels with increasing difficulty defined in `levelConfig`:
- Speed increases per level (300 → 700)
- Spawn rate decreases (2000ms → 600ms)
- Enemy speed increases
- Each level requires 42000 distance units to complete

### Asset Loading
Sprites loaded from `assets/`:
- `characters/` - Ninja animations (Run__000-009.png, Jump__000-009.png, etc.)
- `characters/enemy/` - Enemy animations
- `backgrounds/` - Level backgrounds (level1-9.png)
- `obstacles/` - Obstacle sprites

### Canvas Sizing
Maintains 16:9 aspect ratio, max 1024x576, responsive to window resize. Ground level at 75% of canvas height.
