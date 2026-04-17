---
layout: post
title: The Lost Symphony - Overview
description: World-based orchestra adventure scaffold for the Poway Symphony Orchestra experience
category: Gamify
breadcrumb: true
permalink: /games/lost-symphony/overview
---

## Overview

The Lost Symphony is the larger game scaffold for the Poway Symphony Orchestra site. It is structured around a central hub and multiple section worlds. Each world is its own source file, and each world is designed to trigger a Battle of the Sections mini-game encounter when the player finds the missing musician or instrument.

Current scaffolded flow:

- Explore the Grand Concert Hall hub
- Enter a section world
- Find the missing target for that section
- Trigger Battle of the Sections
- Reclaim the section and return it to the orchestra
- Unlock the final concert and a real PSO recording reward

## Project Structure

```text
_projects/lost-symphony/
├── notebook.src.ipynb
├── levels/
│   ├── LostSymphonyGame.js
│   ├── layout/
│   │   └── LostSymphonyRenderer.js
│   ├── minigames/
│   │   └── BattleOfTheSections.js
│   └── worlds/
│       ├── OverworldHubWorld.js
│       ├── StringForestWorld.js
│       ├── BrassFortressWorld.js
│       ├── WoodwindWildsWorld.js
│       ├── PercussionPeaksWorld.js
│       └── FinalConcertWorld.js
├── model/
│   ├── LostSymphonyState.js
│   └── worldData.js
├── images/
├── docs/
│   └── README.md
└── Makefile
```

Runtime outputs are generated into:

- _notebooks/projects/lost-symphony/
- _posts/projects/lost-symphony/
- assets/js/projects/lost-symphony/
- images/projects/lost-symphony/

## Build Workflow

Use the standard registered-project workflow:

```bash
make dev
make -C _projects/lost-symphony build
make -C _projects/lost-symphony docs
```

## Architecture Notes

This project still uses the registered `_projects` integration model, but now the game layout is split into reusable parts so each world can be implemented independently.

- Notebook page: entry point and mount target
- Main controller: `levels/LostSymphonyGame.js`
- World renderer: `levels/layout/LostSymphonyRenderer.js`
- Battle shell: `levels/minigames/BattleOfTheSections.js`
- World files: `levels/worlds/*.js`
- Saved progression: `model/LostSymphonyState.js`
- Shared world metadata: `model/worldData.js`

## Current Goal Of This Scaffold

- Lock the file structure before detailed world implementation begins
- Give each world its own file so backgrounds, NPCs, items, and mechanics can be added later
- Keep the PSO connection visible through section recovery and the final recording unlock
- Preserve a clean build path through the existing `_projects` workflow