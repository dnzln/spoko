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
    // {
    //   name: 'Пожежная частина (СВПЧ-6)',
    //   coords: [50.36782, 30.47241]
    // },
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

  var MAP_CENTER = [50.37034, 30.46824];
  var MAP_ZOOM = 17;
  var STASH_COORDS = [50.37035, 30.47889];
  var LOCATE_ZOOM = 18;
  var ACCURACY_CIRCLE_SCALE = 0.3; // визуальный масштаб круга точности

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

  // ---------- Тайник ----------

  var stashIcon = L.icon({
    iconUrl: 'img/stash.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });

  var stashPopup = L.popup({ className: 'pda-popup', maxWidth: 260 })
    .setContent(
      '<h3 class="pda-popup__title">Тайник в зоне</h3>' +
      '<p class="pda-popup__text">Координаты подтверждены. Ищи в обозначенном секторе.</p>' +
      '<p class="pda-popup__coords">' + formatCoords(STASH_COORDS[0], STASH_COORDS[1]) + '</p>'
    );

  L.marker(STASH_COORDS, { icon: stashIcon, title: 'Тайник' })
    .bindPopup(stashPopup)
    .addTo(map);

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

  var playerIcon = L.icon({
    iconUrl: 'img/player.png',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    className: 'player-marker'
  });

  var playerMarker = null;
  var accuracyCircle = null;

  function onPosition(pos) {
    var latlng = [pos.coords.latitude, pos.coords.longitude];
    var accuracy = pos.coords.accuracy || 0;

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

      locateBtn.classList.remove('is-unavailable');
      locateBtn.classList.add('is-tracking');
    } else {
      playerMarker.setLatLng(latlng);
      accuracyCircle.setLatLng(latlng);
      accuracyCircle.setRadius(accuracy * ACCURACY_CIRCLE_SCALE);
    }

    hideWarning();
    setStatus('GPS: ' + formatCoords(latlng[0], latlng[1]) + ' | ±' + Math.round(accuracy) + ' м');
  }

  function onPositionError(err) {
    // Таймаут при уже известной позиции — не тревожим игрока, просто ждём новых данных
    if (err && err.code === err.TIMEOUT && playerMarker) {
      setStatus('GPS: слабый сигнал…');
      return;
    }

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
