(function () {
  if (window.PSOGamification) return;

  var pageShell = document.querySelector('.pso-foundation, .pso-signin-page');
  if (!pageShell) return;

  var backendURI;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    backendURI = 'http://localhost:8324';
  } else {
    backendURI = 'https://wifighters.opencodingsociety.com';
  }
  var progressionEndpoint = backendURI + '/api/pso/progression';
  var PROGRESSION_SCHEMA_VERSION = 2;
  var ORCHESTRA_GAME_KEYS = ['game-hub', 'orchestra-builder', 'virtual-conductor', 'tune-the-orchestra'];

  var QUESTS = [
    {
      id: 'season-scout',
      title: 'Season Scout',
      description: 'Explore three Poway pages.',
      metric: 'uniquePages',
      goal: 3,
      rewardXp: 100
    },
    {
      id: 'orchestra-spotlight',
      title: 'Orchestra Spotlight',
      description: 'Read about the orchestra, conductor, and musicians pages.',
      metric: 'researchPages',
      goal: 3,
      rewardXp: 150
    },
    {
      id: 'instrument-investigator',
      title: 'Instrument Investigator',
      description: 'Search for a specific instrument.',
      metric: 'instrumentSearches',
      goal: 1,
      rewardXp: 50
    },
    {
      id: 'recording-marathon',
      title: 'Recording Marathon',
      description: 'Listen to five different musician recordings.',
      metric: 'uniqueRecordingKeys',
      goal: 5,
      rewardXp: 200
    },
    {
      id: 'bio-browser',
      title: 'Bio Browser',
      description: 'View at least five different musician cards or bios.',
      metric: 'uniqueMusicianCards',
      goal: 5,
      rewardXp: 300
    },
    {
      id: 'calendar-check',
      title: 'Calendar Check',
      description: 'Check out the concert calendar.',
      metric: 'viewedConcertCalendar',
      goal: 1,
      rewardXp: 100
    },
    {
      id: 'ticket-tour',
      title: 'Ticket Tour',
      description: 'Check out the tickets section.',
      metric: 'viewedTicketsSection',
      goal: 1,
      rewardXp: 100
    },
    {
      id: 'first-play',
      title: 'First Play',
      description: 'Play at least one recording.',
      metric: 'recordingPlays',
      goal: 1,
      rewardXp: 150
    },
    {
      id: 'game-starter',
      title: 'Game Starter',
      description: 'Play at least one orchestra game.',
      metric: 'gamesPlayed',
      goal: 1,
      rewardXp: 50
    },
    {
      id: 'orchestra-game-master',
      title: 'Orchestra Game Master',
      description: 'Play all orchestra games.',
      metric: 'uniqueGames',
      goal: ORCHESTRA_GAME_KEYS.length,
      rewardXp: 200
    }
  ];

  var LEVELS = [
    { title: 'Beginner', xp: 0, requiredQuests: 0 },
    { title: 'Section Member', xp: 250, requiredQuests: 2 },
    { title: 'Principal', xp: 600, requiredQuests: 4 },
    { title: 'Concertmaster', xp: 950, requiredQuests: 7 },
    { title: 'Maestro', xp: 1400, requiredQuests: QUESTS.length }
  ];

  var UI_STORAGE_KEY = 'pso-progression:ui';
  var STATE_STORAGE_KEY_PREFIX = 'pso-progression:state:';
  var currentUser = null;
  var state = null;
  var widget = null;
  var sectionObserver = null;
  var cooldowns = Object.create(null);
  var searchCooldown = null;
  var saveTimer = null;
  var saveInFlight = null;
  var saveQueued = false;
  var pageVisitRecorded = false;
  var widgetCollapsed = false;

  function defaultMetrics() {
    return {
      uniquePages: [],
      researchPages: [],
      instrumentSearches: 0,
      uniqueRecordingKeys: [],
      recordingPlays: 0,
      uniqueMusicianCards: [],
      viewedConcertCalendar: 0,
      viewedTicketsSection: 0,
      gamesPlayed: 0,
      uniqueGames: []
    };
  }

  function defaultState() {
    return {
      schemaVersion: PROGRESSION_SCHEMA_VERSION,
      xp: 0,
      completedQuests: [],
      metrics: defaultMetrics(),
      lastUpdatedAt: ''
    };
  }

  function normalizeProgressionState(raw) {
    var baseState = defaultState();
    var merged = Object.assign({}, baseState, raw || {});
    var schemaVersion = Number(merged.schemaVersion) || 0;
    if (schemaVersion !== PROGRESSION_SCHEMA_VERSION) {
      return defaultState();
    }

    merged.metrics = Object.assign({}, baseState.metrics, raw && raw.metrics ? raw.metrics : {});
    merged.metrics.uniquePages = Array.isArray(merged.metrics.uniquePages) ? merged.metrics.uniquePages : [];
    merged.metrics.researchPages = Array.isArray(merged.metrics.researchPages) ? merged.metrics.researchPages : [];
    merged.metrics.uniqueRecordingKeys = Array.isArray(merged.metrics.uniqueRecordingKeys) ? merged.metrics.uniqueRecordingKeys : [];
    merged.metrics.uniqueMusicianCards = Array.isArray(merged.metrics.uniqueMusicianCards) ? merged.metrics.uniqueMusicianCards : [];
    merged.metrics.uniqueGames = Array.isArray(merged.metrics.uniqueGames) ? merged.metrics.uniqueGames : [];
    merged.completedQuests = Array.isArray(merged.completedQuests) ? merged.completedQuests : [];
    merged.xp = Number(merged.xp) || 0;
    merged.lastUpdatedAt = typeof merged.lastUpdatedAt === 'string' ? merged.lastUpdatedAt : '';
    merged.schemaVersion = PROGRESSION_SCHEMA_VERSION;
    return merged;
  }

  function progressionPayload() {
    return {
      schemaVersion: PROGRESSION_SCHEMA_VERSION,
      xp: Number(state && state.xp) || 0,
      completedQuests: Array.isArray(state && state.completedQuests) ? state.completedQuests.slice() : [],
      metrics: Object.assign({}, defaultMetrics(), state && state.metrics ? state.metrics : {}),
      lastUpdatedAt: state && state.lastUpdatedAt ? state.lastUpdatedAt : ''
    };
  }

  function progressionStorageKey(uid) {
    return STATE_STORAGE_KEY_PREFIX + String(uid || '').trim().toLowerCase();
  }

  function parseProgressionTime(value) {
    var parsed = Date.parse(value || '');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function progressionScore(candidate) {
    if (!candidate) return 0;
    var metrics = candidate.metrics || {};
    return (Number(candidate.xp) || 0) +
      (Array.isArray(candidate.completedQuests) ? candidate.completedQuests.length * 100 : 0) +
      (Array.isArray(metrics.uniquePages) ? metrics.uniquePages.length * 10 : 0) +
      (Array.isArray(metrics.researchPages) ? metrics.researchPages.length * 14 : 0) +
      (Number(metrics.instrumentSearches) || 0) * 8 +
      (Array.isArray(metrics.uniqueRecordingKeys) ? metrics.uniqueRecordingKeys.length * 18 : 0) +
      (Number(metrics.recordingPlays) || 0) * 10 +
      (Array.isArray(metrics.uniqueMusicianCards) ? metrics.uniqueMusicianCards.length * 20 : 0) +
      (Number(metrics.viewedConcertCalendar) || 0) * 12 +
      (Number(metrics.viewedTicketsSection) || 0) * 12 +
      (Number(metrics.gamesPlayed) || 0) * 10 +
      (Array.isArray(metrics.uniqueGames) ? metrics.uniqueGames.length * 25 : 0);
  }

  function chooseProgressionState(primaryState, secondaryState) {
    var normalizedPrimary = primaryState ? normalizeProgressionState(primaryState) : null;
    var normalizedSecondary = secondaryState ? normalizeProgressionState(secondaryState) : null;

    if (!normalizedPrimary) return normalizedSecondary || defaultState();
    if (!normalizedSecondary) return normalizedPrimary;

    var primaryTime = parseProgressionTime(normalizedPrimary.lastUpdatedAt);
    var secondaryTime = parseProgressionTime(normalizedSecondary.lastUpdatedAt);

    if (primaryTime !== secondaryTime) {
      return primaryTime > secondaryTime ? normalizedPrimary : normalizedSecondary;
    }

    return progressionScore(normalizedPrimary) >= progressionScore(normalizedSecondary)
      ? normalizedPrimary
      : normalizedSecondary;
  }

  function shouldPreferCachedProgression(cachedProgression, serverProgression) {
    if (!cachedProgression) return false;
    if (!serverProgression) return true;

    var cachedTime = parseProgressionTime(cachedProgression.lastUpdatedAt);
    var serverTime = parseProgressionTime(serverProgression.lastUpdatedAt);

    if (cachedTime !== serverTime) {
      return cachedTime > serverTime;
    }

    return progressionScore(cachedProgression) > progressionScore(serverProgression);
  }

  function loadCachedProgression(uid) {
    if (!uid) return null;
    try {
      var raw = window.localStorage.getItem(progressionStorageKey(uid));
      if (!raw) return null;
      return normalizeProgressionState(JSON.parse(raw));
    } catch (error) {
      return null;
    }
  }

  function persistCachedProgression() {
    if (!currentUser || !currentUser.uid || !state) return;
    try {
      window.localStorage.setItem(
        progressionStorageKey(currentUser.uid),
        JSON.stringify(progressionPayload())
      );
    } catch (error) {
      console.warn('Unable to cache Poway progression locally.', error);
    }
  }

  function handleProgressionUnauthorized() {
    window.clearTimeout(saveTimer);
    saveTimer = null;
    saveQueued = false;
    currentUser = null;
    state = null;
    pageVisitRecorded = false;
    renderLockedWidget();
  }

  function loadProgression() {
    return fetch(progressionEndpoint, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
      }
    }).then(function (response) {
      if (response.status === 401) {
        var authError = new Error('Progression unauthorized');
        authError.code = 401;
        throw authError;
      }
      if (!response.ok) {
        throw new Error('Failed to load progression: ' + response.status);
      }
      return response.json();
    }).then(normalizeProgressionState);
  }

  function saveProgression(update, options) {
    var requestOptions = options || {};
    return fetch(progressionEndpoint, {
      method: 'PUT',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'include',
      keepalive: Boolean(requestOptions.keepalive),
      headers: {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
      },
      body: JSON.stringify(update)
    }).then(function (response) {
      if (response.status === 401) {
        var authError = new Error('Progression unauthorized');
        authError.code = 401;
        throw authError;
      }
      if (!response.ok) {
        throw new Error('Failed to save progression: ' + response.status);
      }
      return response.json();
    }).then(normalizeProgressionState);
  }

  function flushSave(options) {
    if (!currentUser || !state) return;
    persistCachedProgression();
    saveInFlight = saveProgression(progressionPayload(), options).then(function (serverState) {
      state = serverState;
      persistCachedProgression();
      renderWidget();
      return serverState;
    }).catch(function (error) {
      if (error && error.code === 401) {
        handleProgressionUnauthorized();
        return null;
      }
      console.warn('Unable to save Poway progression.', error);
      return null;
    }).finally(function () {
      saveInFlight = null;
      if (saveQueued) {
        saveQueued = false;
        queueSave(180);
      }
    });
    return saveInFlight;
  }

  function queueSave(delayMs) {
    if (!currentUser || !state) return;
    if (saveInFlight) {
      saveQueued = true;
      return;
    }
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(function () {
      saveTimer = null;
      flushSave();
    }, typeof delayMs === 'number' ? delayMs : 180);
  }

  function saveState() {
    if (!currentUser || !state) return;
    state.lastUpdatedAt = new Date().toISOString();
    persistCachedProgression();
    queueSave();
  }

  function flushProgressionNow() {
    if (!currentUser || !state) return;
    state.lastUpdatedAt = state.lastUpdatedAt || new Date().toISOString();
    persistCachedProgression();
    window.clearTimeout(saveTimer);
    saveTimer = null;
    if (saveInFlight) {
      saveQueued = true;
      return;
    }
    flushSave({ keepalive: true });
  }

  function questRequirementProgress(fromCount, toCount) {
    if (!state) return 0;
    var span = Math.max(1, toCount - fromCount);
    return Math.max(0, Math.min(100, ((state.completedQuests.length - fromCount) / span) * 100));
  }

  function nextLevelCopy() {
    if (!state) return '';
    var next = nextLevel();
    if (!next) {
      return state.completedQuests.length === QUESTS.length
        ? 'All levels and quests complete.'
        : (QUESTS.length - state.completedQuests.length) + ' quests left to fully clear progression';
    }

    var xpRemaining = Math.max(0, next.xp - state.xp);
    var questsRemaining = Math.max(0, (next.requiredQuests || 0) - state.completedQuests.length);
    if (xpRemaining > 0 && questsRemaining > 0) {
      return xpRemaining + ' XP and ' + questsRemaining + ' quests to ' + next.title;
    }
    if (questsRemaining > 0) {
      return questsRemaining + ' quests to ' + next.title;
    }
    if (xpRemaining > 0) {
      return xpRemaining + ' XP to ' + next.title;
    }
    return 'Ready for ' + next.title;
  }

  function sortActiveQuests(left, right) {
    var leftPercent = questProgress(left) / left.goal;
    var rightPercent = questProgress(right) / right.goal;
    if (rightPercent !== leftPercent) return rightPercent - leftPercent;
    return right.rewardXp - left.rewardXp;
  }

  function sortCompletedQuests(left, right) {
    return QUESTS.findIndex(function (quest) { return quest.id === left.id; }) -
      QUESTS.findIndex(function (quest) { return quest.id === right.id; });
  }

  function buildCompletedQuestMarkup(quest) {
    return '<article class="pso-gamify-quest is-complete is-compact">' +
      '<div class="pso-gamify-quest-head"><strong>' + quest.title + '</strong><span>Completed</span></div>' +
      '<p>' + quest.description + '</p>' +
    '</article>';
  }

  function loadUiState() {
    try {
      var raw = window.localStorage.getItem(UI_STORAGE_KEY);
      if (!raw) return { collapsed: false };
      var parsed = JSON.parse(raw);
      return {
        collapsed: Boolean(parsed && parsed.collapsed)
      };
    } catch (error) {
      return { collapsed: false };
    }
  }

  function saveUiState() {
    window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify({ collapsed: widgetCollapsed }));
  }

  function currentMetricValue(metricName) {
    if (!state || !state.metrics) return 0;
    var metric = state.metrics[metricName];
    if (Array.isArray(metric)) return metric.length;
    return Number(metric) || 0;
  }

  function hasCompletedQuest(questId) {
    return state && state.completedQuests.indexOf(questId) !== -1;
  }

  function questProgress(quest) {
    return Math.min(currentMetricValue(quest.metric), quest.goal);
  }

  function completeQuest(quest) {
    if (!state || hasCompletedQuest(quest.id)) return false;
    state.completedQuests.push(quest.id);
    state.xp += quest.rewardXp;
    return true;
  }

  function refreshQuestCompletions() {
    if (!state) return;
    var didChange = false;
    QUESTS.forEach(function (quest) {
      if (!hasCompletedQuest(quest.id) && questProgress(quest) >= quest.goal) {
        didChange = completeQuest(quest) || didChange;
      }
    });
    return didChange;
  }

  function currentLevel() {
    var xp = state ? state.xp : 0;
    var completedQuests = state ? state.completedQuests.length : 0;
    var active = LEVELS[0];
    LEVELS.forEach(function (level) {
      if (xp >= level.xp && completedQuests >= (level.requiredQuests || 0)) {
        active = level;
      }
    });
    return active;
  }

  function nextLevel() {
    var current = currentLevel();
    var currentIndex = LEVELS.findIndex(function (level) {
      return level.title === current.title;
    });
    if (currentIndex === -1 || currentIndex >= LEVELS.length - 1) return null;
    return LEVELS[currentIndex + 1];
  }

  function levelProgressPercent() {
    if (!state) return 0;
    var level = currentLevel();
    var next = nextLevel();
    if (!next) return 100;
    var span = next.xp - level.xp;
    if (!span) return 100;
    return Math.max(0, Math.min(100, ((state.xp - level.xp) / span) * 100));
  }

  function overallQuestPercent() {
    if (!state) return 0;
    if (!QUESTS.length) return 0;
    return Math.round((state.completedQuests.length / QUESTS.length) * 100);
  }

  function derivedBadges() {
    if (!state) return [];
    var badges = [];
    if (state.metrics.uniquePages.length >= 3) badges.push('Season Scout');
    if (state.metrics.researchPages.length >= 3) badges.push('Orchestra Spotlight');
    if (state.metrics.uniqueRecordingKeys.length >= 5) badges.push('Recording Marathon');
    if (state.metrics.uniqueMusicianCards.length >= 5) badges.push('Bio Browser');
    if (state.metrics.uniqueGames.length >= 1) badges.push('Game Starter');
    if (state.completedQuests.length >= 4) badges.push('Principal Focus');
    if (currentLevel().title === 'Concertmaster') badges.push('Concertmaster');
    if (currentLevel().title === 'Maestro') badges.push('Maestro');
    return badges.slice(0, 4);
  }

  function withCooldown(key, waitMs) {
    var now = Date.now();
    if (cooldowns[key] && now - cooldowns[key] < waitMs) return false;
    cooldowns[key] = now;
    return true;
  }

  function recordUnique(metricName, key) {
    if (!currentUser || !state || !key) return;
    var items = state.metrics[metricName];
    if (!Array.isArray(items)) return;
    if (items.indexOf(key) !== -1) return;
    items.push(key);
    refreshQuestCompletions();
    saveState();
    renderWidget();
  }

  function incrementMetric(metricName, amount, cooldownKey, waitMs) {
    if (!currentUser || !state) return;
    if (cooldownKey && !withCooldown(cooldownKey, waitMs || 900)) return;
    state.metrics[metricName] = (Number(state.metrics[metricName]) || 0) + amount;
    refreshQuestCompletions();
    saveState();
    renderWidget();
  }

  function buildQuestMarkup(quest) {
    var progress = questProgress(quest);
    var completed = hasCompletedQuest(quest.id);
    var percent = Math.round((progress / quest.goal) * 100);
    return '<article class="pso-gamify-quest' + (completed ? ' is-complete' : '') + '">' +
      '<div class="pso-gamify-quest-head"><strong>' + quest.title + '</strong><span>' + progress + ' / ' + quest.goal + '</span></div>' +
      '<p>' + quest.description + '</p>' +
      '<div class="pso-gamify-mini-track"><span style="width:' + percent + '%"></span></div>' +
    '</article>';
  }

  function ensureWidget() {
    if (widget) return widget;
    widget = document.createElement('aside');
    widget.className = 'pso-gamify-shell';
    widget.setAttribute('aria-live', 'polite');
    widget.addEventListener('click', function (event) {
      var toggle = event.target.closest('[data-pso-gamify-toggle]');
      if (!toggle) return;
      var shouldCollapse = toggle.getAttribute('data-pso-gamify-toggle') === 'collapse';
      setCollapsed(shouldCollapse);
    });
    document.body.appendChild(widget);
    return widget;
  }

  function setCollapsed(nextValue) {
    widgetCollapsed = Boolean(nextValue);
    saveUiState();
    renderWidget();
  }

  function renderShell(content) {
    var shell = ensureWidget();
    shell.classList.toggle('is-collapsed', widgetCollapsed);
    shell.innerHTML = content;
    return shell;
  }

  function renderLockedWidget() {
    if (widgetCollapsed) {
      renderShell(
        '<button class="pso-gamify-reopen" type="button" data-pso-gamify-toggle="expand" aria-expanded="false" aria-label="Open Poway progression">Open Poway Progression</button>'
      );
      return;
    }

    renderShell(
      '<div class="pso-gamify-card is-locked">' +
        '<div class="pso-gamify-head">' +
          '<div>' +
            '<span class="pso-gamify-kicker">Poway Progression</span>' +
            '<h3>Sign In To Save XP</h3>' +
          '</div>' +
          '<button class="pso-gamify-toggle" type="button" data-pso-gamify-toggle="collapse" aria-expanded="true" aria-label="Close Poway progression">Hide</button>' +
        '</div>' +
        '<p>XP, levels, badges, and quest progress only persist for signed-in users.</p>' +
        '<div class="pso-gamify-track is-muted"><span style="width:0%"></span></div>' +
        '<div class="pso-gamify-locked-actions">' +
          '<a class="pso-gamify-link" href="/powayorchestra/signin/">Open Sign In</a>' +
        '</div>' +
      '</div>'
    );
  }

  function renderWidget() {
    if (!currentUser || !state) {
      renderLockedWidget();
      return;
    }

    if (widgetCollapsed) {
      renderShell(
        '<button class="pso-gamify-reopen" type="button" data-pso-gamify-toggle="expand" aria-expanded="false" aria-label="Open Poway progression">' +
          '<span>Poway Progression</span><strong>' + state.xp + ' XP</strong>' +
        '</button>'
      );
      return;
    }

    var level = currentLevel();
    var next = nextLevel();
    var badges = derivedBadges();
    var activeQuests = QUESTS.filter(function (quest) {
      return !hasCompletedQuest(quest.id);
    }).sort(sortActiveQuests);
    var completedQuests = QUESTS.filter(function (quest) {
      return hasCompletedQuest(quest.id);
    }).sort(sortCompletedQuests);

    renderShell(
      '<div class="pso-gamify-card">' +
        '<div class="pso-gamify-head">' +
          '<div>' +
            '<span class="pso-gamify-kicker">Poway Progression</span>' +
            '<h3>' + level.title + '</h3>' +
          '</div>' +
          '<div class="pso-gamify-head-actions">' +
            '<div class="pso-gamify-xp">' + state.xp + ' XP</div>' +
            '<button class="pso-gamify-toggle" type="button" data-pso-gamify-toggle="collapse" aria-expanded="true" aria-label="Close Poway progression">Hide</button>' +
          '</div>' +
        '</div>' +
        '<p class="pso-gamify-copy">' + escapeHtml(currentUser.name || currentUser.uid || 'Member') + ' is building momentum across the site.</p>' +
        '<div class="pso-gamify-group">' +
          '<div class="pso-gamify-row"><span>XP Progress</span><span>' + nextLevelCopy() + '</span></div>' +
          '<div class="pso-gamify-track"><span style="width:' + levelProgressPercent() + '%"></span></div>' +
        '</div>' +
        '<div class="pso-gamify-group">' +
          '<div class="pso-gamify-row"><span>Quest Progress</span><span>' + state.completedQuests.length + ' / ' + QUESTS.length + '</span></div>' +
          '<div class="pso-gamify-track is-secondary"><span style="width:' + overallQuestPercent() + '%"></span></div>' +
        '</div>' +
        '<div class="pso-gamify-badges">' +
          (badges.length ? badges.map(function (badge) {
            return '<span class="pso-gamify-badge">' + badge + '</span>';
          }).join('') : '<span class="pso-gamify-badge is-muted">No badges yet</span>') +
        '</div>' +
        '<div class="pso-gamify-quest-sections">' +
          '<div class="pso-gamify-group">' +
            '<div class="pso-gamify-row"><span>Active Quests</span><span>' + activeQuests.length + '</span></div>' +
            '<div class="pso-gamify-quest-list">' +
              (activeQuests.length ? activeQuests.map(buildQuestMarkup).join('') : '<p class="pso-gamify-empty">All active quests are cleared. Open completed quests below to review the full run.</p>') +
            '</div>' +
          '</div>' +
          '<details class="pso-gamify-completed">' +
            '<summary><span>Completed Quests</span><span>' + completedQuests.length + '</span></summary>' +
            '<div class="pso-gamify-completed-body">' +
              (completedQuests.length ? completedQuests.map(buildCompletedQuestMarkup).join('') : '<p class="pso-gamify-empty">Completed quests will collect here.</p>') +
            '</div>' +
          '</details>' +
        '</div>' +
      '</div>'
    );
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupSectionTracking() {
    return;
  }

  function addUniqueMetric(metricName, key) {
    if (!state || !state.metrics || !key) return false;
    var list = state.metrics[metricName];
    if (!Array.isArray(list)) return false;
    if (list.indexOf(key) !== -1) return false;
    list.push(key);
    return true;
  }

  function currentPathname() {
    return String(location.pathname || '/').replace(/\/+$/, '') || '/';
  }

  function gameKeyForPath(pathname) {
    var path = String(pathname || '').toLowerCase();
    var hash = String(location.hash || '').toLowerCase();
    if (path.indexOf('/orchestra-builder') !== -1) return 'orchestra-builder';
    if (path.indexOf('/conductor') !== -1) return 'virtual-conductor';
    if (path.indexOf('/games') !== -1) return 'game-hub';
    if (path.indexOf('/media') !== -1 && hash.indexOf('tune-the-orchestra') !== -1) return 'tune-the-orchestra';
    return '';
  }

  function recordPageVisit() {
    if (!currentUser || !state || pageVisitRecorded) return;
    pageVisitRecorded = true;

    var path = currentPathname();
    var normalized = path.toLowerCase();
    var didChange = false;

    didChange = addUniqueMetric('uniquePages', path) || didChange;

    if (normalized.indexOf('/about') !== -1) {
      didChange = addUniqueMetric('researchPages', 'about') || didChange;
    }
    if (normalized.indexOf('/conductor') !== -1) {
      didChange = addUniqueMetric('researchPages', 'conductor') || didChange;
    }
    if (normalized.indexOf('/musicians') !== -1) {
      didChange = addUniqueMetric('researchPages', 'musicians') || didChange;
    }

    if (normalized.indexOf('/concert') !== -1 && Number(state.metrics.viewedConcertCalendar) < 1) {
      state.metrics.viewedConcertCalendar = 1;
      didChange = true;
    }

    if (normalized.indexOf('/tickets') !== -1 && Number(state.metrics.viewedTicketsSection) < 1) {
      state.metrics.viewedTicketsSection = 1;
      didChange = true;
    }

    var gameKey = gameKeyForPath(path);
    if (gameKey) {
      didChange = addUniqueMetric('uniqueGames', gameKey) || didChange;
      var gameCount = Array.isArray(state.metrics.uniqueGames) ? state.metrics.uniqueGames.length : 0;
      if (Number(state.metrics.gamesPlayed) < gameCount) {
        state.metrics.gamesPlayed = gameCount;
        didChange = true;
      }
    }

    if (!didChange) return;
    refreshQuestCompletions();
    saveState();
    renderWidget();
  }

  function keyFromText(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
  }

  function mediaInteractionKey(node) {
    if (!node) return '';
    var dataAudio = node.getAttribute('data-audio') || node.getAttribute('data-family-audio-player-toggle');
    if (dataAudio) return keyFromText(dataAudio);
    if (node.dataset && node.dataset.mediaId) return keyFromText(node.dataset.mediaId);
    if (node.id) return keyFromText(node.id);
    var labelled = node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent;
    return keyFromText(currentPathname() + '|' + labelled);
  }

  function musicianCardKey(node) {
    if (!node) return '';
    if (node.dataset && node.dataset.musicianId) return keyFromText(node.dataset.musicianId);
    if (node.dataset && node.dataset.memberId) return keyFromText(node.dataset.memberId);
    if (node.getAttribute('href')) return keyFromText(node.getAttribute('href'));
    if (node.id) return keyFromText(node.id);
    var heading = node.querySelector('h1, h2, h3, h4, strong');
    return keyFromText((heading && heading.textContent) || node.textContent);
  }

  function recordRecordingPlay(node, providedKey) {
    if (!currentUser || !state) return;
    var key = providedKey || mediaInteractionKey(node);
    var cooldownKey = key ? ('recording:' + key) : 'recording:generic';
    if (!withCooldown(cooldownKey, 700)) return;

    var didChange = false;
    state.metrics.recordingPlays = (Number(state.metrics.recordingPlays) || 0) + 1;
    didChange = true;
    if (key) {
      didChange = addUniqueMetric('uniqueRecordingKeys', key) || didChange;
    }

    if (!didChange) return;
    refreshQuestCompletions();
    saveState();
    renderWidget();
  }

  function recordMusicianCardView(node) {
    if (!currentUser || !state) return;
    var key = musicianCardKey(node);
    if (!key) return;
    if (!addUniqueMetric('uniqueMusicianCards', key)) return;
    refreshQuestCompletions();
    saveState();
    renderWidget();
  }

  function setupClickTracking() {
    document.addEventListener('click', function (event) {
      var target = event.target;
      var mediaButton = target.closest('[data-family-audio-player-toggle], .sample-play-sample-btn[data-audio], #pso-member-profile-sample, [data-media-card], .media-video-card, [data-hero-video-audio-toggle]');
      if (mediaButton) {
        recordRecordingPlay(mediaButton);
      }

      var directoryAction = target.closest('.musician-member-card, .musician-card, .instrument-card, [data-musician-id], [data-musician-card]');
      if (directoryAction) {
        recordMusicianCardView(directoryAction);
      }
    }, true);
  }

  function setupInputTracking() {
    var searchInput = document.querySelector('[data-musician-search]');
    if (!searchInput) return;
    searchInput.addEventListener('input', function () {
      if (!currentUser || !state) return;
      window.clearTimeout(searchCooldown);
      searchCooldown = window.setTimeout(function () {
        var value = String(searchInput.value || '').trim().toLowerCase();
        if (value.length < 2) return;
        incrementMetric('instrumentSearches', 1, 'instrument-search:' + value, 500);
      }, 320);
    });
  }

  function hydrateAuthenticatedUser(user) {
    if (!user || !user.uid) {
      handleProgressionUnauthorized();
      return Promise.resolve(null);
    }

    if (!currentUser || currentUser.uid !== user.uid) {
      pageVisitRecorded = false;
    }
    currentUser = user;
    var cachedState = loadCachedProgression(user.uid);
    if (cachedState) {
      state = cachedState;
      setupSectionTracking();
      renderWidget();
    }
    return loadProgression().then(function (serverState) {
      if (!currentUser || currentUser.uid !== user.uid) return null;
      var useCachedState = shouldPreferCachedProgression(cachedState, serverState);
      state = useCachedState ? cachedState : serverState;
      persistCachedProgression();
      setupSectionTracking();
      renderWidget();
      if (useCachedState && progressionScore(cachedState) > progressionScore(serverState)) {
        queueSave(0);
      }
      recordPageVisit();
      return state;
    }).catch(function (error) {
      if (error && error.code === 401) {
        handleProgressionUnauthorized();
        return null;
      }
      console.warn('Unable to load Poway progression.', error);
      state = cachedState || defaultState();
      persistCachedProgression();
      setupSectionTracking();
      renderWidget();
      recordPageVisit();
      return state;
    });
  }

  function fetchIdentity() {
    return fetch(backendURI + '/api/id', {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
      }
    }).then(function (response) {
      if (!response.ok) throw new Error('Not signed in');
      return response.json();
    }).then(function (user) {
      return hydrateAuthenticatedUser(user).then(function () {
        return user;
      });
    }).catch(function (error) {
      if (error && error.code === 401) {
        handleProgressionUnauthorized();
        return null;
      }
      throw error;
    }).catch(function () {
      handleProgressionUnauthorized();
      return null;
    });
  }

  function track(metricName, payload) {
    if (!currentUser || !state) return;
    if (metricName === 'media') {
      recordRecordingPlay(null, keyFromText(payload && payload.key || 'manual-recording'));
      return;
    }
    if (metricName === 'builder') {
      if (addUniqueMetric('uniqueGames', 'orchestra-builder')) {
        state.metrics.gamesPlayed = Math.max(Number(state.metrics.gamesPlayed) || 0, state.metrics.uniqueGames.length);
        refreshQuestCompletions();
        saveState();
        renderWidget();
      }
      return;
    }
  }

  function init() {
    widgetCollapsed = loadUiState().collapsed;
    ensureWidget();
    renderLockedWidget();
    setupClickTracking();
    setupInputTracking();
    window.addEventListener('pagehide', flushProgressionNow);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        flushProgressionNow();
      }
    });
    fetchIdentity();
  }

  window.PSOGamification = {
    init: init,
    refreshIdentity: fetchIdentity,
    hydrateAuthenticatedUser: hydrateAuthenticatedUser,
    track: track
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());