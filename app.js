(function () {
  'use strict';

  const PLACES = [
    {
      name: 'Завод «Юпітер»',
      description: 'Порожні цехи, де колись збирали щось секретне. Уночі тут гудуть трансформатори, яких давно немає.',
      coords: [50.37448, 30.46728]
    },
    {
      name: 'Кордон',
      description: 'Цей бетонний паркан — це і є межа Зони. По цей бік ще звичайний світ, по той — уже ні. Перевір спорядження, увімкни КПК і проходь: звідси починається твій шлях.',
      coords: [50.37034, 30.46824]
    },
    {
      name: 'Рудий ліс',
      description: 'Дерева тут іржаві навіть улітку. Компас бреше, а стежки самі змінюють напрямок — тримайся своїх.',
      coords: [50.36783619706897, 30.478709188318227]
    },
    {
      name: 'Копачі',
      description: 'Село, яке не евакуювали — його поховали. Хати засипали землею, лишилися тільки горби з жовтими знаками. Краще тут не копай, і взагалі тримайся подалі.',
      coords: [50.36751, 30.4687]
    },
    {
      name: 'Кафе «Полісся»',
      description: 'Колись тут наливали каву й травили байки. Тепер — вибиті вікна, перекинуті стільці й пил. Але хтось досі лишає тут недопиту чашку.',
      coords: [50.36995, 30.47415]
    },
    {
      name: 'Бункер вчених',
      description: 'Екологи обміняють артефакти на спорядження й не ставитимуть зайвих питань. Майже.',
      coords: [50.37381, 30.47999]
    },
    {
      name: 'Оранжерея «Пекучий пух»',
      description: 'Скляний купол, зарослий дивною рослинністю. Пух у повітрі обпікає шкіру — не знімай протигаз.',
      coords: [50.37602, 30.47211]
    },
    {
      name: 'Стадіон',
      description: 'Пусті трибуни й тиша, від якої дзвенить у вухах.',
      coords: [50.37256, 30.46629]
    },
    {
      name: 'Хата лісника',
      description: 'Колись тут жив лісник. Після пожежі лишилися обвуглені стіни. Інколи тут зупиняються мандрівники, щоб перепочити, але довго залишатися не радять.',
      coords: [50.374946119000136, 30.470839378062863]
    }
  ];

  const STASHES = [
    {
      name: 'Схованка в Зоні',
      description: 'Хтось залишив тут припаси й не повернувся. Координати підтверджено — шукай у позначеному секторі.',
      coords: [50.37035, 30.47889]
    }
  ];

  const ANOMALIES = [
    {
      name: 'Поле Шепоту',
      description: 'Звичайне на вигляд поле, де трава шелестить навіть без вітру. Десь тут лежить артефакт — але без детектора його не знайти. Увімкни КПК і слухай: він подасть сигнал, коли будеш поруч.',
      coords: [50.372638007141155, 30.472695628852165]
    }
  ];

  const ARTIFACTS = [
    {
      name: 'Артефакт',
      coords: [50.372527774499154, 30.470685237475667]
    },
    {
      name: 'Артефакт',
      coords: [50.37034, 30.46824]
    }
  ];

  const DANGER_ZONES = [
    {
      name: 'Радіаційна пляма',
      description: 'Прохід на Юпитер - лічильник Гейгера тут захлинається. Не затримуйся довше, ніж треба, і тримай антирад напоготові.',
      coords: [50.37433, 30.47018],
      image: 'img/rad.webp',
      showName: false
    },
    {
      name: 'Тепла стіна',
      description: 'Кам’яна стіна посеред лісу — від будинку, якого вже немає. Кажуть, під час викиду вона прийняла удар на себе й досі фонить. Каміння тепле навіть узимку — руками не чіпай.',
      coords: [50.369533159256214, 30.470544563913652],
      image: 'img/rad.webp',
      showName: false
    },
    {
      name: 'Будка Бюрера',
      description: 'Бетонна коробка без вікон, схожа на маленький саркофаг. Що всередині — не знає ніхто, але інколи там щось шебуртить, да і фонить поруч сильно.',
      coords: [50.37194851311824, 30.469461228030625],
      image: 'img/rad.webp',
      showName: false
    }
  ];

  var MAP_CENTER = [50.37034, 30.46824];
  var MAP_ZOOM = 17;
  var LOCATE_ZOOM = 18;
  var ACCURACY_CIRCLE_SCALE = 0.9;
  var DANGER_ZONE_DISTANCE = 20;
  var DANGER_ZONE_ICON_SIZE = 40;
  var ANOMALY_ICON_SIZE = 36;
  var PLAYER_ICON_HEADING = 90;
  var MIN_SPEED_FOR_COURSE = 1;
  var DETECTOR_VOLUME = 0.8;
  var DETECTOR_CONTINUOUS_DISTANCE = 3;
  var DETECTOR_SMOOTHING = 0.5;
  var DETECTOR_CURVE = [
    { distance: 3, interval: 200 },
    { distance: 5, interval: 300 },
    { distance: 10, interval: 650 },
    { distance: 15, interval: 1100 }
  ];

  var map = L.map('map', {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  }).addTo(map);

  function createElement(tag, className, text) {
    var el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    return el;
  }

  var POPUP_KICKERS = {
    stash: '▣ Тайник',
    place: '◈ Локація',
    radiation: '☢ Радіація',
    anomaly: '✷ Аномалія'
  };

  function createPopup(type, item, extraClass) {
    var content = document.createElement('div');
    content.appendChild(createElement('div', 'pda-popup__kicker', POPUP_KICKERS[type]));
    content.appendChild(createElement('h3', 'pda-popup__title', item.name || 'Без назви'));
    if (item.description) {
      content.appendChild(createElement('p', 'pda-popup__text', item.description));
    }
    content.appendChild(createElement('p', 'pda-popup__coords', formatCoords(item.coords[0], item.coords[1])));

    return L.popup({
      className: 'pda-popup pda-popup--' + type + (extraClass ? ' ' + extraClass : ''),
      maxWidth: 260,
      autoPanPaddingTopLeft: [10, 70],
      autoPanPaddingBottomRight: [70, 40]
    }).setContent(content);
  }

  var stashIcon = L.icon({
    iconUrl: 'img/stash.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });

  function addStash(stash) {
    return L.marker(stash.coords, { icon: stashIcon, title: stash.name })
      .bindPopup(createPopup('stash', stash))
      .addTo(map);
  }

  STASHES.forEach(addStash);

  function addPlace(place) {
    var span = createElement('span', '', place.name);

    return L.marker(place.coords, {
      icon: L.divIcon({
        className: 'stalker-label',
        html: span,
        iconSize: null,
        popupAnchor: [0, -12]
      }),
      title: place.name
    })
      .bindPopup(createPopup('place', place))
      .addTo(map);
  }

  PLACES.forEach(addPlace);

  function addAnomaly(anomaly) {
    var img = document.createElement('img');
    img.className = 'anomaly-marker__image';
    img.src = 'img/anomaly.svg';
    img.alt = '';

    return L.marker(anomaly.coords, {
      icon: L.divIcon({
        className: 'anomaly-marker',
        html: img,
        iconSize: [ANOMALY_ICON_SIZE, ANOMALY_ICON_SIZE],
        iconAnchor: [ANOMALY_ICON_SIZE / 2, ANOMALY_ICON_SIZE / 2],
        popupAnchor: [0, -ANOMALY_ICON_SIZE / 2]
      }),
      title: anomaly.name
    })
      .bindPopup(createPopup('anomaly', anomaly))
      .addTo(map);
  }

  ANOMALIES.forEach(addAnomaly);

  function addDangerZone(zone) {
    var showName = zone.showName !== false && Boolean(zone.name);
    if (zone.visible === false || (!zone.image && !showName)) {
      return null;
    }

    var isRed = zone.color === 'red';
    var body = document.createElement('div');
    body.className = 'danger-zone__body';

    if (zone.image) {
      var img = document.createElement('img');
      img.className = 'danger-zone__image';
      img.src = zone.image;
      img.alt = '';
      img.width = DANGER_ZONE_ICON_SIZE;
      img.height = DANGER_ZONE_ICON_SIZE;
      body.appendChild(img);
      body.style.marginTop = -(DANGER_ZONE_ICON_SIZE / 2) + 'px';
    } else {
      body.classList.add('danger-zone__body--text-only');
    }

    if (showName) {
      body.appendChild(createElement('span', 'danger-zone__name', zone.name));
    }

    return L.marker(zone.coords, {
      icon: L.divIcon({
        className: 'danger-zone danger-zone--' + (isRed ? 'red' : 'yellow'),
        html: body,
        iconSize: null,
        popupAnchor: [0, zone.image ? -DANGER_ZONE_ICON_SIZE / 2 : -12]
      }),
      title: zone.name || ''
    })
      .bindPopup(createPopup('radiation', zone, isRed ? 'pda-popup--red' : ''))
      .addTo(map);
  }

  DANGER_ZONES.forEach(addDangerZone);

  var warningEl = document.getElementById('gps-warning');
  var warningTextEl = document.getElementById('gps-warning-text');
  var statusEl = document.getElementById('pda-status');
  var locateBtn = document.getElementById('btn-locate');

  function showWarning(text) {
    warningTextEl.textContent = text || 'Помилка зв\'язку з КПК: GPS недоступний';
    warningEl.hidden = false;
  }

  function hideWarning() {
    warningEl.hidden = true;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function formatCoords(lat, lng) {
    return lat.toFixed(5) + '° N, ' + lng.toFixed(5) + '° E';
  }

  document.getElementById('btn-zoom-in').addEventListener('click', function () {
    map.zoomIn();
  });

  document.getElementById('btn-zoom-out').addEventListener('click', function () {
    map.zoomOut();
  });

  locateBtn.addEventListener('click', function () {
    if (!playerMarker) {
      showWarning();
      return;
    }
    map.flyTo(playerMarker.getLatLng(), Math.max(map.getZoom(), LOCATE_ZOOM), {
      duration: 1.2
    });
  });

  var playerIcon = L.divIcon({
    className: 'player-marker',
    html: '<img class="player-marker__arrow" src="img/player.png" alt="">',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  var playerMarker = null;
  var playerArrowEl = null;
  var accuracyCircle = null;

  function onPosition(pos) {
    var latlng = [pos.coords.latitude, pos.coords.longitude];
    var accuracy = pos.coords.accuracy || 0;
    var course = pos.coords.heading;
    var speed = pos.coords.speed;

    if (!playerMarker) {
      accuracyCircle = L.circle(latlng, {
        radius: accuracy * ACCURACY_CIRCLE_SCALE,
        color: '#00ff66',
        weight: 1,
        opacity: 0.4,
        fillColor: '#00ff66',
        fillOpacity: 0.15,
        interactive: false
      }).addTo(map);

      playerMarker = L.marker(latlng, {
        icon: playerIcon,
        title: 'Вы здесь',
        keyboard: false,
        zIndexOffset: 1000
      }).addTo(map);

      playerArrowEl = playerMarker.getElement().querySelector('.player-marker__arrow');
      if (lastHeading !== null) {
        applyHeading(lastHeading);
      }

      locateBtn.classList.remove('is-unavailable');
      locateBtn.classList.add('is-tracking');
    } else {
      playerMarker.setLatLng(latlng);
      accuracyCircle.setLatLng(latlng);
      accuracyCircle.setRadius(accuracy * ACCURACY_CIRCLE_SCALE);
    }

    if (!compassActive && course !== null && !isNaN(course) && speed > MIN_SPEED_FOR_COURSE) {
      applyHeading(course);
    }

    inDangerZone = getNearestDistance(DANGER_ZONES, latlng) < DANGER_ZONE_DISTANCE;
    updateGeiger();

    updateDetector(latlng);

    hideWarning();
    setStatus('GPS: ' + formatCoords(latlng[0], latlng[1]) + ' | ±' + Math.round(accuracy) + ' м');
  }

  function onPositionError(err) {
    if (err && err.code === err.TIMEOUT && playerMarker) {
      setStatus('GPS: слабый сигнал…');
      return;
    }

    inDangerZone = false;
    updateGeiger();
    resetDetector();

    showWarning();
    setStatus('GPS: нет сигнала');
    if (!playerMarker) {
      locateBtn.classList.add('is-unavailable');
    }

    if (err && err.code === err.PERMISSION_DENIED && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  var compassActive = false;
  var lastHeading = null;
  var currentRotation = null;

  function applyHeading(heading) {
    lastHeading = heading;
    if (!playerArrowEl) {
      return;
    }

    var target = heading - PLAYER_ICON_HEADING;
    if (currentRotation === null) {
      currentRotation = target;
    } else {
      var delta = ((target - currentRotation) % 360 + 540) % 360 - 180;
      if (Math.abs(delta) < 1) {
        return;
      }
      currentRotation += delta;
    }
    playerArrowEl.style.transform = 'rotate(' + currentRotation + 'deg)';
  }

  function getScreenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') {
      return screen.orientation.angle;
    }
    return typeof window.orientation === 'number' ? window.orientation : 0;
  }

  function onDeviceOrientation(e) {
    var heading = null;

    if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) {
      heading = e.webkitCompassHeading;
    } else if (e.absolute && typeof e.alpha === 'number') {
      heading = 360 - e.alpha;
    }

    if (heading === null) {
      return;
    }

    compassActive = true;
    applyHeading((heading + getScreenAngle()) % 360);
  }

  function startCompass() {
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', onDeviceOrientation);
    } else if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', onDeviceOrientation);
    }
  }

  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
    var compassAsked = false;
    var askCompass = function () {
      if (compassAsked) {
        return;
      }
      compassAsked = true;
      document.removeEventListener('click', askCompass, true);
      document.removeEventListener('touchend', askCompass, true);

      DeviceOrientationEvent.requestPermission()
        .then(function (state) {
          if (state === 'granted') {
            startCompass();
          }
        })
        .catch(function () {});
    };
    document.addEventListener('click', askCompass, true);
    document.addEventListener('touchend', askCompass, true);
  } else {
    startCompass();
  }

  var geiger = new Audio('geiger.mp3');
  geiger.loop = true;
  geiger.preload = 'auto';

  var inDangerZone = false;

  function getNearestDistance(items, latlng) {
    var nearest = Infinity;
    items.forEach(function (item) {
      nearest = Math.min(nearest, map.distance(latlng, item.coords));
    });
    return nearest;
  }

  function updateGeiger() {
    if (inDangerZone) {
      if (geiger.paused) {
        geiger.play().catch(function () {});
      }
    } else if (!geiger.paused) {
      geiger.pause();
      geiger.currentTime = 0;
    }
  }

  function unlockAudio() {
    geiger.muted = true;
    geiger.play()
      .then(function () {
        geiger.muted = false;
        document.removeEventListener('click', unlockAudio, true);
        document.removeEventListener('touchend', unlockAudio, true);
        if (!inDangerZone) {
          geiger.pause();
          geiger.currentTime = 0;
        }
      })
      .catch(function () {
        geiger.muted = false;
      });
  }

  document.addEventListener('click', unlockAudio, true);
  document.addEventListener('touchend', unlockAudio, true);

  if (navigator.audioSession) {
    navigator.audioSession.type = 'playback';
  }

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var audioCtx = AudioContextClass ? new AudioContextClass() : null;
  var beepBuffer = null;
  var detectorInterval = null;
  var detectorTimer = null;
  var detectorLoop = null;
  var lastBeepAt = 0;
  var smoothedArtifactDistance = null;

  if (audioCtx) {
    fetch('beep.mp3')
      .then(function (response) {
        return response.arrayBuffer();
      })
      .then(function (data) {
        return audioCtx.decodeAudioData(data);
      })
      .then(function (buffer) {
        beepBuffer = buffer;
        startDetector();
      })
      .catch(function () {});
  }

  function resumeAudioContext() {
    if (audioCtx && audioCtx.state !== 'running') {
      audioCtx.resume().then(startDetector).catch(function () {});
    }
  }

  document.addEventListener('click', resumeAudioContext, true);
  document.addEventListener('touchend', resumeAudioContext, true);

  function getDetectorInterval(distance) {
    var last = DETECTOR_CURVE[DETECTOR_CURVE.length - 1];

    if (distance < DETECTOR_CONTINUOUS_DISTANCE) {
      return 0;
    }
    if (distance > last.distance) {
      return null;
    }

    for (var i = 1; i < DETECTOR_CURVE.length; i++) {
      var from = DETECTOR_CURVE[i - 1];
      var to = DETECTOR_CURVE[i];
      if (distance <= to.distance) {
        var t = Math.max(0, (distance - from.distance) / (to.distance - from.distance));
        return Math.round(from.interval + t * (to.interval - from.interval));
      }
    }
    return last.interval;
  }

  function updateDetector(latlng) {
    var distance = getNearestDistance(ARTIFACTS, latlng);

    if (smoothedArtifactDistance === null) {
      smoothedArtifactDistance = distance;
    } else {
      smoothedArtifactDistance += DETECTOR_SMOOTHING * (distance - smoothedArtifactDistance);
    }

    setDetectorInterval(getDetectorInterval(smoothedArtifactDistance));
  }

  function resetDetector() {
    smoothedArtifactDistance = null;
    setDetectorInterval(null);
  }

  function playBeep(length, loop) {
    if (!beepBuffer || audioCtx.state !== 'running') {
      return null;
    }

    var now = audioCtx.currentTime;
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(DETECTOR_VOLUME, now);
    gain.connect(audioCtx.destination);

    var source = audioCtx.createBufferSource();
    source.buffer = beepBuffer;
    source.loop = loop;
    source.connect(gain);
    source.start(now);

    if (!loop) {
      var end = now + Math.min(length, beepBuffer.duration);
      gain.gain.setValueAtTime(DETECTOR_VOLUME, end - 0.015);
      gain.gain.linearRampToValueAtTime(0, end);
      source.stop(end);
    }

    return source;
  }

  function beepTick() {
    lastBeepAt = Date.now();
    playBeep(detectorInterval * 0.8 / 1000, false);
    scheduleNextBeep();
  }

  function scheduleNextBeep() {
    clearTimeout(detectorTimer);
    detectorTimer = setTimeout(beepTick, Math.max(0, lastBeepAt + detectorInterval - Date.now()));
  }

  function stopDetector() {
    clearTimeout(detectorTimer);
    detectorTimer = null;
    if (detectorLoop) {
      detectorLoop.stop();
      detectorLoop = null;
    }
  }

  function startDetector() {
    stopDetector();

    if (detectorInterval === null) {
      return;
    }

    if (detectorInterval === 0) {
      detectorLoop = playBeep(0, true);
      return;
    }

    scheduleNextBeep();
  }

  function setDetectorInterval(interval) {
    if (interval === detectorInterval) {
      return;
    }

    var modeChanged = (interval === null) !== (detectorInterval === null) ||
      (interval === 0) !== (detectorInterval === 0);

    detectorInterval = interval;

    if (modeChanged) {
      startDetector();
    } else {
      scheduleNextBeep();
    }
  }

  var watchId = null;

  if ('geolocation' in navigator && window.isSecureContext !== false) {
    watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 5000
    });
  } else {
    onPositionError(null);
  }
})();
