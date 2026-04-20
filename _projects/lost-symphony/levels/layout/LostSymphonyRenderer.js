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
        position: relative;
        min-height: 720px;
        height: 100%;
        font-family: Georgia, 'Times New Roman', serif;
      }

      body.pso-lost-symphony-fullscreen .lost-symphony-shell,
      .pso-game-runner.is-fullscreen .lost-symphony-shell,
      .pso-game-runner-stage:fullscreen .lost-symphony-shell {
        min-height: 100vh;
        width: 100%;
        height: 100vh;
        border-radius: 0;
        border: 0;
        box-shadow: none;
      }

      .ls-stage,
      .ls-ending-stage {
        min-height: 720px;
        height: 100%;
      }

      body.pso-lost-symphony-fullscreen .ls-stage,
      body.pso-lost-symphony-fullscreen .ls-ending-stage,
      .pso-game-runner.is-fullscreen .ls-stage,
      .pso-game-runner.is-fullscreen .ls-ending-stage,
      .pso-game-runner-stage:fullscreen .ls-stage,
      .pso-game-runner-stage:fullscreen .ls-ending-stage {
        min-height: 100vh;
        height: 100vh;
      }

      .ls-stage {
        position: relative;
        display: flex;
        align-items: flex-end;
        background:
          linear-gradient(180deg, rgba(17, 7, 8, 0.08) 0%, rgba(17, 7, 8, 0.28) 55%, rgba(17, 7, 8, 0.84) 100%),
          center / cover no-repeat var(--ls-opening-image);
      }

      .ls-stage::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(12, 6, 7, 0.06) 0%, rgba(12, 6, 7, 0) 48%, rgba(12, 6, 7, 0.78) 100%);
        pointer-events: none;
      }

      .ls-ending-stage {
        display: grid;
        place-items: center;
        padding: 2rem;
        background:
          radial-gradient(circle at top left, rgba(201, 150, 58, 0.22), transparent 26%),
          radial-gradient(circle at 80% 18%, rgba(92, 17, 24, 0.18), transparent 24%),
          linear-gradient(180deg, #1f0d10 0%, #120708 100%);
      }

      .ls-ending-card {
        width: min(720px, 100%);
        padding: 2rem;
        border-radius: 28px;
        border: 1px solid rgba(255, 248, 240, 0.14);
        background: rgba(17, 8, 10, 0.82);
        color: #fff9f3;
        text-align: center;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
      }

      .ls-ending-card h2 {
        margin: 0.45rem 0 0;
        font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
        font-size: clamp(2rem, 4vw, 3.5rem);
      }

      .ls-ending-card p {
        margin: 0.9rem auto 0;
        max-width: 34ch;
        color: rgba(255, 249, 243, 0.78);
        line-height: 1.7;
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

      .ls-hero-actions {
        margin-top: 1rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .ls-hero-button {
        border: 1px solid rgba(255, 249, 243, 0.28);
        background: rgba(255, 249, 243, 0.08);
        color: #fff9f3;
        border-radius: 999px;
        padding: 0.7rem 1rem;
        cursor: pointer;
        font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .ls-opening-overlay {
        position: absolute;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        background: rgba(18, 7, 8, 0.74);
        backdrop-filter: blur(12px);
      }

      .ls-opening-frame {
        width: min(1080px, 100%);
        overflow: hidden;
        border-radius: 28px;
        border: 1px solid rgba(255, 248, 240, 0.22);
        background: #15080a;
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34);
      }

      .ls-opening-visual {
        position: relative;
        min-height: min(62vh, 680px);
        display: flex;
        align-items: flex-end;
        background:
          linear-gradient(180deg, rgba(17, 7, 8, 0.08) 0%, rgba(17, 7, 8, 0.28) 55%, rgba(17, 7, 8, 0.84) 100%),
          center / cover no-repeat var(--ls-opening-image);
      }

      .ls-opening-copy {
        position: relative;
        z-index: 1;
        width: 100%;
        padding: 1.25rem;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .ls-opening-dialogue-bar {
        width: min(100%, 1160px);
        display: grid;
        gap: 0.9rem;
      }

      .ls-opening-dialogue {
        width: 100%;
        padding: 1rem 1.15rem;
        border-radius: 22px;
        background: rgba(17, 8, 10, 0.86);
        border: 1px solid rgba(255, 248, 240, 0.16);
        color: #fff9f3;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.24);
      }

      .ls-opening-speaker {
        margin: 0;
        font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #f2c876;
      }

      .ls-opening-tone {
        margin-left: 0.45rem;
        color: rgba(255, 249, 243, 0.64);
      }

      .ls-opening-line {
        margin: 0.55rem 0 0;
        font-size: clamp(1.05rem, 1.55vw, 1.28rem);
        line-height: 1.75;
        min-height: calc(1.75em * 2);
      }

      .ls-opening-line.is-thought {
        font-style: italic;
      }

      .ls-opening-line.is-direction {
        margin-top: 0;
        font-weight: 700;
      }

      .ls-opening-line.is-typing::after {
        content: '';
        display: inline-block;
        width: 0.1em;
        height: 1em;
        margin-left: 0.14em;
        vertical-align: -0.08em;
        background: currentColor;
        animation: ls-dialogue-caret 0.8s steps(1, end) infinite;
      }

      @keyframes ls-dialogue-caret {
        0%,
        45% {
          opacity: 1;
        }

        46%,
        100% {
          opacity: 0;
        }
      }

      .ls-opening-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      .ls-opening-button,
      .ls-opening-link {
        border-radius: 999px;
        padding: 0.8rem 1.05rem;
        font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
        font-weight: 700;
        letter-spacing: 0.04em;
        cursor: pointer;
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2);
      }

      .ls-opening-button {
        border: 0;
        background: linear-gradient(135deg, #e8b553 0%, #c9963a 100%);
        color: #2d110e;
      }

      .ls-opening-link {
        border: 1px solid rgba(255, 248, 240, 0.18);
        background: transparent;
        color: #fff9f3;
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
        .ls-link-button,
        .ls-opening-button,
        .ls-opening-link {
          width: 100%;
        }

        .ls-opening-overlay {
          padding: 0.75rem;
        }

        .ls-opening-copy,
        .ls-opening-dialogue {
          padding: 1rem;
        }

        .ls-opening-actions {
          justify-content: stretch;
        }

        .ls-opening-button,
        .ls-opening-link {
          width: 100%;
        }
      }
    `;
  }

  static render({ openingScene }) {
    const currentLine = openingScene?.currentLine;
    const isDirection = currentLine?.tone === 'direction';
    const isThought = currentLine?.tone === 'internal thought';
    const lineClasses = ['ls-opening-line', isDirection ? 'is-direction' : '', isThought ? 'is-thought' : '']
      .filter(Boolean)
      .join(' ');

    return `
      <section class="lost-symphony-shell">
        ${openingScene?.isVisible ? `
          <div class="ls-stage" aria-live="polite" style="--ls-opening-image: url('${escapeHtml(openingScene.imagePath)}');">
            <div class="ls-opening-copy">
              <div class="ls-opening-dialogue-bar">
                <div class="ls-opening-dialogue">
                  ${isDirection ? '' : `
                    <p class="ls-opening-speaker">
                      ${escapeHtml(currentLine.speaker)}
                      <span class="ls-opening-tone">${escapeHtml(currentLine.tone)}</span>
                    </p>
                  `}
                  <p class="${lineClasses}" data-opening-line data-full-text="${escapeHtml(currentLine.text)}">${escapeHtml(currentLine.text)}</p>
                </div>
                <div class="ls-opening-actions">
                  <button type="button" class="ls-opening-button" data-opening-next>
                    ${openingScene.hasNext ? 'Next line' : 'Finish intro'}
                  </button>
                  <button type="button" class="ls-opening-link" data-opening-skip>Skip intro</button>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <div class="ls-ending-stage">
            <article class="ls-ending-card">
              <p class="ls-kicker">The Lost Symphony</p>
              <h2>To be continued</h2>
              <p>The rest of the game is still in development.</p>
            </article>
          </div>
        `}
      </section>
    `;
  }
}