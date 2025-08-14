const map = L.map('map');

// Basemap sources
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

let basemaps = [
  { name: 'Satelit', layer: esriSat, thumb: 'map-previews/ortofoto.jpg' },
  { name: 'OSM', layer: osm, thumb: 'map-previews/OSM.jpg' },
  { name: 'Topo', layer: topo, thumb: 'map-previews/topo.jpg' }
];

// Create base layers object
const baseLayers = {
  "OpenStreetMap": osm,
  "OpenTopoMap": topo,
  "Satelit": esriSat,
};

var layerControl = L.control.layers(baseLayers).addTo(map);
esriSat.addTo(map);


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
const kžš_loc = { lat: 46.049698, lon: 14.109393 }; // KŽŠ koordinate

const specialMarker = L.marker(kžš_loc, {
  icon: L.divIcon({
    html: `<a href="https://klub-kzs.si" target="_blank">
             <img src="images/kžš-simple.png" width="32" height="32">
           </a>`,
    className: '', // prevent Leaflet default styles
    iconSize: [32, 32]
  }),
  zIndexOffset: -10
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

    const distanceKm = getDistance(kžš_loc.lat, kžš_loc.lon, lat, lon).toFixed(1);

    const popupHtml = `
      <div class="popup-content">
        <!--<div class="datetime">${dateTime || "Unknown date/time"}</div>-->
        <div class="title-row">
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
        <div class="popup-text">
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


// Create help control
const HelpControl = L.Control.extend({
  options: { position: 'bottomleft' },

  onAdd: function (map) {
    const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom help-btn');
    button.innerHTML = '?';
    button.title = "Informacije o zemljevidu";

    L.DomEvent.disableClickPropagation(button);

    button.addEventListener('click', () => {
      document.querySelector('#mapHelpModal').classList.add('show');
    });

    return button;
  }
});

map.addControl(new HelpControl());

// Close modal on click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
    document.querySelector('#mapHelpModal').classList.remove('show');
  }
});

