(function () {
  'use strict';

  // ---------- Настройки ----------


  const PLACES = [
    {
      name: 'Завод «Юпітер»',
      coords: [50.37448, 30.46728]
    },
    {
      name: 'Кордон',
      coords: [50.37034, 30.46824]
    },    
    {
      name: 'Рудий ліс',
      coords: [50.37056, 30.49776]
    },
    {
      name: 'Свалка',
      coords: [50.36751, 30.4687]
    },    
    {
      name: 'Кафе «Полісся»',
      coords: [50.36995, 30.47415]
    },
    {
      name: 'Бункер вчених',
      coords: [50.37381, 30.47999]
    },
    {
      name: 'База Долгу',
      coords: [50.3686, 30.45798]
    },
    {
      name: 'ЧАЕС',
      coords: [50.37477, 30.44422]
    },
    {
      name: 'Прип’ять',
      coords: [50.36923, 30.44357]
    },
    {
      name: 'Оранжерея «Жгучий пух»',
      coords: [50.37602, 30.47211]
    },
    {
      name: 'Янтар',
      coords: [50.36408, 30.48691]
    },
    {
      name: 'Темна долина',
      coords: [50.37438, 30.50486]
    },
    {
      name: 'Стадіон',
      coords: [50.37256, 30.46629]
    }
  ]

  const STASHES = [
    {
      name: 'Тайник в зоне',
      description: 'Координаты подтверждены. Ищи в обозначенном секторе.',
      coords: [50.37035, 30.47889]
    }
  ]

  // Опасные зоны / аномалии: подходишь ближе DANGER_ZONE_DISTANCE — трещит счётчик Гейгера
  //   name     — надпись на карте
  //   coords   — центр зоны
  //   color    — 'yellow' (по умолчанию) или 'red'
  //   image    — необязательно: картинка зоны, например 'img/anomaly.png'
  //   showName — false: показывать только картинку, без надписи
  //   visible  — false: на карте ничего не видно, остаётся только звук
  const DANGER_ZONES = [
    {
      name: 'Радіаційна пляма',
      coords: [50.37034, 30.46824],
      visible: false
    },
    {
      name: 'Радіаційна пляма 2',
      coords: [50.37004, 30.46769],
      visible: false
    }
    // {
    //   name: 'Аномалія «Жарка»',
    //   coords: [50.37150, 30.47600],
    //   color: 'red',
    //   image: 'img/anomaly.png'
    // },
    // {
    //   name: 'Тихий фон біля бункера',
    //   coords: [50.37381, 30.47999],
    //   visible: false
    // }
  ]

  var MAP_CENTER = [50.37034, 30.46824];
  var MAP_ZOOM = 17;
  var LOCATE_ZOOM = 18;
  var ACCURACY_CIRCLE_SCALE = 0.9; // визуальный масштаб круга точности
  var DANGER_ZONE_DISTANCE = 20;   // м; ближе к опасной зоне — включается счётчик Гейгера
  var DANGER_ZONE_ICON_SIZE = 40;  // px; размер картинки опасной зоны

  // ---------- Карта ----------

  var map = L.map('map', {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  }).addTo(map);

  // ---------- Тайники ----------

  var stashIcon = L.icon({
    iconUrl: 'img/stash.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });

  function createElement(tag, className, text) {
    var el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    return el;
  }

  function addStash(stash) {
    var content = document.createElement('div');
    content.appendChild(createElement('h3', 'pda-popup__title', stash.name));
    if (stash.description) {
      content.appendChild(createElement('p', 'pda-popup__text', stash.description));
    }
    content.appendChild(createElement('p', 'pda-popup__coords', formatCoords(stash.coords[0], stash.coords[1])));

    return L.marker(stash.coords, { icon: stashIcon, title: stash.name })
      .bindPopup(L.popup({ className: 'pda-popup', maxWidth: 260 }).setContent(content))
      .addTo(map);
  }

  STASHES.forEach(addStash);

  // ---------- Текстовые метки локаций ----------

  function addLabel(latlng, text) {
    var span = document.createElement('span');
    span.textContent = text;

    return L.marker(latlng, {
      icon: L.divIcon({
        className: 'stalker-label',
        html: span.outerHTML,
        iconSize: null
      }),
      interactive: false,
      keyboard: false
    }).addTo(map);
  }

  PLACES.forEach(function(place) {
    addLabel(place.coords, '' + place.name);
  });

  // ---------- Опасные зоны на карте ----------

  function addDangerZone(zone) {
    var showName = zone.showName !== false && Boolean(zone.name);
    if (zone.visible === false || (!zone.image && !showName)) {
      return null;
    }

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
      // Центр картинки — ровно в точке зоны, надпись висит под ней
      body.style.marginTop = -(DANGER_ZONE_ICON_SIZE / 2) + 'px';
    } else {
      body.classList.add('danger-zone__body--text-only');
    }

    if (showName) {
      body.appendChild(createElement('span', 'danger-zone__name', zone.name));
    }

    return L.marker(zone.coords, {
      icon: L.divIcon({
        className: 'danger-zone danger-zone--' + (zone.color === 'red' ? 'red' : 'yellow'),
        html: body,
        iconSize: null
      }),
      interactive: false,
      keyboard: false
    }).addTo(map);
  }

  DANGER_ZONES.forEach(addDangerZone);


  // ---------- Интерфейс ----------

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

  // ---------- Геолокация игрока ----------

  // divIcon с вложенной картинкой: transform самого маркера занят Leaflet под позиционирование,
  // поэтому вращаем внутренний <img>
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

    // Нет компаса — разворачиваем стрелку по курсу движения из GPS (он есть только на ходу)
    if (!compassActive && course !== null && !isNaN(course) && speed > MIN_SPEED_FOR_COURSE) {
      applyHeading(course);
    }

    inDangerZone = getNearestDangerDistance(latlng) < DANGER_ZONE_DISTANCE;
    updateGeiger();

    hideWarning();
    setStatus('GPS: ' + formatCoords(latlng[0], latlng[1]) + ' | ±' + Math.round(accuracy) + ' м');
  }

  function onPositionError(err) {
    // Таймаут при уже известной позиции — не тревожим игрока, просто ждём новых данных
    if (err && err.code === err.TIMEOUT && playerMarker) {
      setStatus('GPS: слабый сигнал…');
      return;
    }

    // Позиция потеряна — не оставляем счётчик трещать бесконечно
    inDangerZone = false;
    updateGeiger();

    showWarning();
    setStatus('GPS: нет сигнала');
    if (!playerMarker) {
      locateBtn.classList.add('is-unavailable');
    }

    // При запрете доступа повторных попыток не будет — сворачиваем слежение
    if (err && err.code === err.PERMISSION_DENIED && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  // ---------- Направление игрока (компас / курс GPS) ----------

  var PLAYER_ICON_HEADING = 90;   // куда смотрит стрелка на player.png: 0 — вверх, 90 — вправо
  var MIN_SPEED_FOR_COURSE = 1;   // м/с; медленнее курс GPS скачет случайно

  var compassActive = false;
  var lastHeading = null;
  var currentRotation = null;

  // heading — градусы от севера по часовой стрелке
  function applyHeading(heading) {
    lastHeading = heading;
    if (!playerArrowEl) {
      return;
    }

    var target = heading - PLAYER_ICON_HEADING;
    if (currentRotation === null) {
      currentRotation = target;
    } else {
      // Крутим по кратчайшей дуге, чтобы на переходе 359° → 0° стрелка не делала полный оборот
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
      heading = e.webkitCompassHeading;          // iOS: уже от севера по часовой
    } else if (e.absolute && typeof e.alpha === 'number') {
      heading = 360 - e.alpha;                   // Android: alpha идёт против часовой
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

  // iOS 13+ выдаёт компас только после явного разрешения, и спросить можно лишь по касанию
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

  // ---------- Опасные зоны и счётчик Гейгера ----------

  var geiger = new Audio('geiger.mp3');
  geiger.loop = true;
  geiger.preload = 'auto';

  var inDangerZone = false;

  function getNearestDangerDistance(latlng) {
    var nearest = Infinity;
    DANGER_ZONES.forEach(function (zone) {
      nearest = Math.min(nearest, map.distance(latlng, zone.coords));
    });
    return nearest;
  }

  function updateGeiger() {
    if (inDangerZone) {
      if (geiger.paused) {
        // До первого касания экрана браузер звук не пустит — тогда его включит unlockAudio
        geiger.play().catch(function () {});
      }
    } else if (!geiger.paused) {
      geiger.pause();
      geiger.currentTime = 0;
    }
  }

  // Браузеры запрещают звук без действия пользователя, поэтому на первом касании
  // беззвучно запускаем плеер — после этого его можно включать из кода
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

  // ---------- Запуск GPS ----------

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
