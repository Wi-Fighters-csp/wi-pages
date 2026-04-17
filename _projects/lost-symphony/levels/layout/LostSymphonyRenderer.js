function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default class LostSymphonyRenderer {
  static styles() {
    return `
      .lost-symphony-shell {
        --ls-burgundy: #5c1118;
        --ls-burgundy-deep: #2f0b10;
        --ls-gold: #c9963a;
        --ls-cream: #f4ebdf;
        --ls-ink: #281513;
        --ls-panel: #fff8f0;
        --ls-shadow: rgba(40, 10, 14, 0.14);
        color: var(--ls-ink);
        background:
          radial-gradient(circle at top left, rgba(201, 150, 58, 0.18), transparent 30%),
          radial-gradient(circle at top right, rgba(92, 17, 24, 0.18), transparent 28%),
          linear-gradient(180deg, #fff9f3 0%, #f1e0d0 100%);
        border: 1px solid rgba(92, 17, 24, 0.12);
        border-radius: 30px;
        box-shadow: 0 26px 64px var(--ls-shadow);
        overflow: hidden;
        font-family: Georgia, 'Times New Roman', serif;
      }

      .lost-symphony-shell,
      .lost-symphony-shell * {
        box-sizing: border-box;
      }

      .lost-symphony-shell ::view-transition-group(*),
      .lost-symphony-shell ::view-transition-old(*),
      .lost-symphony-shell ::view-transition-new(*) {
        animation-duration: 0.25s;
        animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
      }

      .ls-hero {
        padding: 2rem;
        color: #fff9f3;
        background: linear-gradient(135deg, #6d1d28 0%, #4a1018 58%, #2b0a0f 100%);
      }

      .ls-hero-grid,
      .ls-body,
      .ls-world-grid,
      .ls-world-meta,
      .ls-battle-grid,
      .ls-flow-grid,
      .ls-files-grid {
        display: grid;
        gap: 1rem;
      }

      .ls-hero-grid {
        grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
        align-items: start;
      }

      .ls-kicker,
      .ls-label,
      .ls-card-label,
      .ls-mini-label {
        font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.74rem;
        font-weight: 700;
      }

      .ls-title,
      .ls-world-panel h2,
      .ls-card h3,
      .ls-card h4,
      .ls-sidebar h3 {
        font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
      }

      .ls-title {
        margin: 0.35rem 0 0.75rem;
        font-size: clamp(2rem, 4vw, 3.4rem);
        line-height: 1.05;
      }

      .ls-hero-copy {
        max-width: 68ch;
        margin: 0;
        line-height: 1.7;
      }

      .ls-pill-row,
      .ls-stats,
      .ls-door-grid,
      .ls-tag-row,
      .ls-action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .ls-pill,
      .ls-stat,
      .ls-world-tag,
      .ls-flow-step,
      .ls-file-card,
      .ls-note,
      .ls-objective,
      .ls-list-card {
        border-radius: 18px;
        border: 1px solid rgba(92, 17, 24, 0.1);
        background: var(--ls-panel);
        box-shadow: 0 12px 28px rgba(41, 11, 15, 0.06);
      }

      .ls-pill,
      .ls-stat,
      .ls-world-tag {
        padding: 0.6rem 0.9rem;
      }

      .ls-hero-aside {
        background: rgba(255, 249, 243, 0.08);
        border: 1px solid rgba(255, 249, 243, 0.14);
        border-radius: 22px;
        padding: 1rem;
      }

      .ls-hero-aside p,
      .ls-hero-aside li,
      .ls-hero-copy,
      .ls-pill {
        color: #fff9f3;
      }

      .ls-body {
        grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
        padding: 1.4rem;
      }

      .ls-sidebar,
      .ls-world-panel,
      .ls-card {
        background: rgba(255, 248, 240, 0.96);
        border: 1px solid rgba(92, 17, 24, 0.1);
        border-radius: 24px;
        box-shadow: 0 18px 36px rgba(41, 11, 15, 0.07);
      }

      .ls-sidebar,
      .ls-world-panel {
        padding: 1rem;
      }

      .ls-sidebar {
        align-self: start;
        display: grid;
        gap: 1rem;
      }

      .ls-door {
        width: 100%;
        text-align: left;
        cursor: pointer;
        border-radius: 18px;
        border: 1px solid rgba(92, 17, 24, 0.12);
        background: white;
        padding: 0.85rem 0.9rem;
        transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }

      .ls-door:hover,
      .ls-door:focus-visible,
      .ls-link-button:hover,
      .ls-link-button:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(41, 11, 15, 0.1);
      }

      .ls-door.is-active {
        background: linear-gradient(135deg, #6d1d28 0%, #4a1018 100%);
        color: #fff9f3;
      }

      .ls-door.is-locked {
        opacity: 0.52;
        cursor: not-allowed;
      }

      .ls-door strong,
      .ls-link-button strong {
        display: block;
      }

      .ls-world-grid {
        grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
      }

      .ls-card,
      .ls-objective,
      .ls-list-card,
      .ls-file-card,
      .ls-note,
      .ls-flow-step {
        padding: 1rem;
      }

      .ls-objective-list,
      .ls-list-grid {
        display: grid;
        gap: 0.75rem;
      }

      .ls-world-meta,
      .ls-battle-grid,
      .ls-flow-grid,
      .ls-files-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .ls-battle-card {
        background: linear-gradient(180deg, #fff4e7 0%, #fffaf5 100%);
      }

      .ls-link-button {
        border: 0;
        border-radius: 16px;
        background: linear-gradient(135deg, #6d1d28 0%, #4a1018 100%);
        color: #fff9f3;
        padding: 0.8rem 1rem;
        cursor: pointer;
      }

      .ls-file-card code {
        display: block;
        margin-top: 0.45rem;
        padding: 0.5rem 0.65rem;
        border-radius: 12px;
        background: #f7ecdf;
        font-size: 0.9rem;
        overflow-wrap: anywhere;
      }

      .ls-progress {
        height: 12px;
        border-radius: 999px;
        background: #e9d8cb;
        overflow: hidden;
      }

      .ls-progress > span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #c9963a 0%, #6d1d28 100%);
      }

      @media (max-width: 1024px) {
        .ls-hero-grid,
        .ls-body,
        .ls-world-grid,
        .ls-world-meta,
        .ls-battle-grid,
        .ls-flow-grid,
        .ls-files-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .ls-hero,
        .ls-body,
        .ls-sidebar,
        .ls-world-panel {
          padding: 1rem;
        }

        .ls-door,
        .ls-link-button {
          width: 100%;
        }
      }
    `;
  }

  static render({ state, activeWorld, activeLayout, battleLayout, worldOrder, fileMap }) {
    const reclaimedCount = state.reclaimedSections.length;
    const totalRecoverable = 4;
    const completionPercent = Math.round((reclaimedCount / totalRecoverable) * 100);

    return `
      <section class="lost-symphony-shell">
        <header class="ls-hero">
          <div class="ls-hero-grid">
            <div>
              <p class="ls-kicker">Poway Symphony Orchestra Game Layout</p>
              <h1 class="ls-title">The Lost Symphony</h1>
              <p class="ls-hero-copy">
                This is the structural game shell: overworld hub, section worlds, and the embedded
                Battle of the Sections encounter layout. Characters, mechanics, backgrounds, NPCs,
                and items can now be built world by world without changing the core project structure.
              </p>
              <div class="ls-pill-row" style="margin-top: 1rem;">
                <div class="ls-pill">Explore world</div>
                <div class="ls-pill">Find missing musician or instrument</div>
                <div class="ls-pill">Trigger section battle</div>
                <div class="ls-pill">Reclaim section</div>
                <div class="ls-pill">Unlock final concert</div>
              </div>
            </div>
            <aside class="ls-hero-aside">
              <p class="ls-label">Current Scaffold Status</p>
              <div class="ls-stat" style="margin-top: 0.7rem; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12);">
                <span class="ls-mini-label">Sections Reclaimed</span>
                <strong>${reclaimedCount} / ${totalRecoverable}</strong>
              </div>
              <div class="ls-progress" style="margin-top: 0.75rem;"><span style="width: ${completionPercent}%;"></span></div>
              <ul style="margin: 0.9rem 0 0; padding-left: 1.1rem; line-height: 1.7;">
                <li>Hub map scaffolded</li>
                <li>Each world has its own file</li>
                <li>Battle mini-game shell scaffolded</li>
                <li>Final concert route reserved</li>
              </ul>
            </aside>
          </div>
        </header>

        <div class="ls-body">
          <aside class="ls-sidebar">
            <section class="ls-card">
              <p class="ls-card-label">World Doors</p>
              <h3>Concert Hall Map</h3>
              <div class="ls-door-grid">
                ${worldOrder.map((world) => {
                  const isActive = world.id === activeWorld.id;
                  const isUnlocked = state.unlockedWorldIds.includes(world.id) || world.id === 'hub';
                  const classes = ['ls-door', isActive ? 'is-active' : '', isUnlocked ? '' : 'is-locked'].filter(Boolean).join(' ');
                  return `
                    <button type="button" class="${classes}" data-world-select="${escapeHtml(world.id)}" ${isUnlocked ? '' : 'disabled'}>
                      <strong>${escapeHtml(world.shortTitle)}</strong>
                      <span>${escapeHtml(world.environment)}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </section>

            <section class="ls-card">
              <p class="ls-card-label">Recovered Orchestra</p>
              <h3>Section Status</h3>
              <div class="ls-list-grid">
                ${['Strings', 'Brass', 'Woodwinds', 'Percussion'].map((section) => {
                  const recovered = state.reclaimedSections.includes(section);
                  return `
                    <div class="ls-list-card">
                      <strong>${section}</strong>
                      <span>${recovered ? 'Reclaimed and back on stage' : 'Still corrupted in its world'}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>

            <section class="ls-card">
              <p class="ls-card-label">Flow Summary</p>
              <div class="ls-flow-grid">
                <div class="ls-flow-step">Explore a section world</div>
                <div class="ls-flow-step">Find the missing target</div>
                <div class="ls-flow-step">Start Battle of the Sections</div>
                <div class="ls-flow-step">Return the section to the orchestra</div>
              </div>
            </section>
          </aside>

          <main class="ls-world-panel">
            <p class="ls-label">${escapeHtml(activeWorld.statusLabel)}</p>
            <h2>${escapeHtml(activeWorld.title)}</h2>
            <p>${escapeHtml(activeWorld.theme)}</p>

            <div class="ls-tag-row">
              <div class="ls-world-tag"><strong>Section</strong>${escapeHtml(activeWorld.section)}</div>
              <div class="ls-world-tag"><strong>Environment</strong>${escapeHtml(activeWorld.environment)}</div>
              <div class="ls-world-tag"><strong>Goal</strong>${escapeHtml(activeWorld.goal)}</div>
            </div>

            <div class="ls-world-grid" style="margin-top: 1rem;">
              <section class="ls-card">
                <p class="ls-card-label">World Layout</p>
                <h3>${escapeHtml(activeLayout.sceneTitle)}</h3>
                <p>${escapeHtml(activeLayout.sceneCopy)}</p>
                <div class="ls-objective-list" style="margin-top: 1rem;">
                  ${activeLayout.objectives.map((objective) => `
                    <div class="ls-objective">${escapeHtml(objective)}</div>
                  `).join('')}
                </div>
              </section>

              <section class="ls-card">
                <p class="ls-card-label">Encounter Trigger</p>
                <h3>Find Then Fight</h3>
                <p>${escapeHtml(activeLayout.encounterTrigger)}</p>
                <div class="ls-note" style="margin-top: 0.9rem;">
                  <strong>Transition Note</strong>
                  <div>${escapeHtml(activeLayout.transitionNote)}</div>
                </div>
              </section>
            </div>

            <div class="ls-world-meta" style="margin-top: 1rem;">
              <section class="ls-card">
                <p class="ls-card-label">Placeholders To Build Later</p>
                <h4>NPCs and Items</h4>
                <div class="ls-list-grid">
                  ${activeWorld.npcIdeas.map((entry) => `<div class="ls-list-card">NPC: ${escapeHtml(entry)}</div>`).join('')}
                  ${activeWorld.itemIdeas.map((entry) => `<div class="ls-list-card">Item: ${escapeHtml(entry)}</div>`).join('')}
                </div>
              </section>

              <section class="ls-card">
                <p class="ls-card-label">Scene Anchors</p>
                <h4>Background and Navigation Notes</h4>
                <div class="ls-list-grid">
                  ${activeLayout.visualAnchors.map((entry) => `<div class="ls-list-card">${escapeHtml(entry)}</div>`).join('')}
                </div>
              </section>
            </div>

            <div class="ls-battle-grid" style="margin-top: 1rem;">
              <section class="ls-card ls-battle-card">
                <p class="ls-card-label">Embedded Mini-Game</p>
                <h3>${escapeHtml(battleLayout.title)}</h3>
                <p>${escapeHtml(battleLayout.prompt)}</p>
                <div class="ls-list-grid" style="margin-top: 0.85rem;">
                  ${battleLayout.mechanics.map((entry) => `<div class="ls-list-card">${escapeHtml(entry)}</div>`).join('')}
                </div>
              </section>

              <section class="ls-card">
                <p class="ls-card-label">Battle Placement In Flow</p>
                <h3>How It Connects</h3>
                <div class="ls-list-grid">
                  <div class="ls-list-card">Arena: ${escapeHtml(battleLayout.arena)}</div>
                  <div class="ls-list-card">Reward: ${escapeHtml(battleLayout.reward)}</div>
                  <div class="ls-list-card">Missing Target: ${escapeHtml(activeWorld.missingTarget)}</div>
                  <div class="ls-list-card">${escapeHtml(battleLayout.placeholderNote)}</div>
                </div>
              </section>
            </div>

            <div class="ls-files-grid" style="margin-top: 1rem;">
              ${fileMap.map((fileEntry) => `
                <section class="ls-file-card">
                  <p class="ls-card-label">${escapeHtml(fileEntry.label)}</p>
                  <strong>${escapeHtml(fileEntry.title)}</strong>
                  <code>${escapeHtml(fileEntry.path)}</code>
                </section>
              `).join('')}
            </div>

            <div class="ls-action-row" style="margin-top: 1rem;">
              ${activeWorld.unlocks.map((nextWorldId) => `
                <button type="button" class="ls-link-button" data-world-select="${escapeHtml(nextWorldId)}">
                  <strong>Open ${escapeHtml(nextWorldId)}</strong>
                  <span>Preview the next world scaffold</span>
                </button>
              `).join('')}
            </div>
          </main>
        </div>
      </section>
    `;
  }
}