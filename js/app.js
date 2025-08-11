const map = L.map('map').setView([0, 0], 2);

var Stadia_OSMBright = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}', {
  minZoom: 0,
  maxZoom: 20,
  attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  ext: 'png'
});

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
});

const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: '© OpenTopoMap contributors'
});

const esriSat = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and others',
  maxZoom: 19,
});


// Add default layer to map
esriSat.addTo(map);

// Create base layers object
const baseLayers = {
  "Svetla karta": Stadia_OSMBright,
  "OpenStreetMap": osm,
  "OpenTopoMap": topo,
  "Satelit": esriSat,
};

// Add layer control to map
L.control.layers(baseLayers, null, { collapsed: false }).addTo(map);


const markers = L.markerClusterGroup({
  iconCreateFunction: function (cluster) {
    const count = cluster.getChildCount();
    // size buckets — tweak thresholds/sizes if you want
    const bucket =
      count < 3 ? { cls: 'small', size: 10 } :
        count < 10 ? { cls: 'medium', size: 30 } :
          { cls: 'large', size: 54 };

    const html = `
      <div class="custom-cluster ${bucket.cls}" role="button" aria-label="${count} items">
        <div class="cluster-inner">
          <span class="cluster-count">${count}</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-cluster-wrapper',
      iconSize: L.point(bucket.size, bucket.size),
      iconAnchor: L.point(Math.round(bucket.size / 2), Math.round(bucket.size / 2))
    });
  }
});

map.addLayer(markers);

const markerBounds = L.latLngBounds();
const refPoint = { lat: 46.049698, lon: 14.109393 }; // KŽŠ koordinate

const specialMarker = L.marker(refPoint, {
  icon: L.icon({
    iconUrl: 'images/kžš-simple.png',
    iconSize: [32, 32],
  }),
  zIndexOffset: -1000 // makes it appear below others
}).addTo(map);


// Haversine distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Reverse geocode city using Nominatim API (async)
async function getCityName(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

  const lang = 'local';

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': lang
      }
    });

    const data = await res.json();
    return data.address.city || data.address.town || data.address.village || data.address.country;
  } catch {
    return 'Unknown location';
  }
}



// Main image loading function
async function loadImages(images) {
  for (const { path, coordinates, description, city, dateTime} of images) {
    const [lat, lon] = coordinates.split(',').map(Number);
    const isVideo = /\.(mp4|webm|ogg)$/i.test(path);
    const thumbUrl = isVideo ? path.replace(/\.[^\/.]+/, ".jpg") : path;

    const distanceKm = getDistance(refPoint.lat, refPoint.lon, lat, lon).toFixed(1);

    const popupHtml = `
      <div class="popup-content">
        <div class="popup-text">
          <div class="datetime">${dateTime || "Unknown date/time"}</div>
          <div class="city-row">
            <div class="city-name">${city}</div>
            <div class="distance">${distanceKm} km</div>
          </div>
          <div class="popup-image">
            ${
                isVideo
                  ? `<video autoplay muted loop playsinline" src="${path}"></video>`
                  : `<img src="${thumbUrl}" alt="Preview"/>`
              }
          </div>
          ${description}
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'photo-marker',
      html: `<img src="${thumbUrl}" alt="">`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    const marker = L.marker([lat, lon], { icon }).bindPopup(popupHtml, { closeButton: false });
    markers.addLayer(marker);
    markerBounds.extend([lat, lon]);
  }

  if (markerBounds.isValid()) {
    map.fitBounds(markerBounds, { padding: [50, 50] });
  }
}





fetch('images.json')
  .then(res => res.json())
  .then(images => {(
    loadImages(images));
  })
  .catch(err => console.error('Failed to load image list:', err));
