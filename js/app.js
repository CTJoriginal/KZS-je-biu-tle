const map = L.map('map').setView([0, 0], 2);

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

var Stadia_StamenToner = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.{ext}', {
  minZoom: 0,
  maxZoom: 20,
  attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  ext: 'png'
});

// Add default layer to map
osm.addTo(map);

// Create base layers object
const baseLayers = {
  "OpenStreetMap": osm,
  "OpenTopoMap": topo,
  "Ortofoto": esriSat,
  "Toner": Stadia_StamenToner,
};

// Add layer control to map
L.control.layers(baseLayers).addTo(map);



// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution: '&copy; OpenStreetMap contributors'
// }).addTo(map);





const markerCluster = L.markerClusterGroup();
map.addLayer(markerCluster);

const markerBounds = L.latLngBounds();
const refPoint = { lat: 46.049698, lon: 14.109393 }; // KŽŠ koordinate



const specialMarker = L.marker(refPoint, {
  icon: L.icon({
    iconUrl: 'images/kžš.png',
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

function formatExifDateTime(dateTimeRaw) {
  if (!dateTimeRaw) return "Unknown date/time";
  // "YYYY:MM:DD HH:MM:SS" → "DD.MM.YYYY HH.MM"
  const [date, time] = dateTimeRaw.split(' ');
  const [year, month, day] = date.split(':');
  const [hour, minute] = time.split(':');
  return `${day}.${month}.${year} ${hour}.${minute}`;
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
    return data.address.city || data.address.town || data.address.village || 'Unknown location';
  } catch {
    return 'Unknown location';
  }
}


// Main image loading function
async function loadImages(images) {
  for (const {path, description} of images) {
    // Load image
    const img = new Image();
    img.src = path;

    // Wait for image to load EXIF data
    await new Promise((resolve) => {
      img.onload = () => {
        EXIF.getData(img, async function () {
          // Extract GPS data
          const lat = EXIF.getTag(this, 'GPSLatitude');
          const lon = EXIF.getTag(this, 'GPSLongitude');
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef') || 'N';
          const lonRef = EXIF.getTag(this, 'GPSLongitudeRef') || 'E';

          if (!lat || !lon) {
            console.warn(`No GPS data for ${path}, skipping.`);
            resolve();
            return;
          }

          // Convert GPS coordinates to decimal degrees
          function toDecimal(coords, ref) {
            const d = coords[0].numerator / coords[0].denominator;
            const m = coords[1].numerator / coords[1].denominator;
            const s = coords[2].numerator / coords[2].denominator;
            let dec = d + m / 60 + s / 3600;
            if (ref === 'S' || ref === 'W') dec = -dec;
            return dec;
          }

          const latitude = toDecimal(lat, latRef);
          const longitude = toDecimal(lon, lonRef);

          // Calculate distance and get other EXIF data
          const distanceKm = getDistance(refPoint.lat, refPoint.lon, latitude, longitude).toFixed(1);
          const dateTime = formatExifDateTime(EXIF.getTag(this, "DateTimeOriginal"));


          // Get city name (async)
          const cityName = await getCityName(latitude, longitude);

          // Build popup HTML
          const popupHtml = `
            <div class="popup-content">
            
            <div class="popup-text">
            <div class="datetime">${dateTime}</div>
            <div class="city-row">
            <div class="city-name">${cityName}</div>
            <div class="distance">${distanceKm} km</div>
            </div>
              <div class="popup-image">
                  <img src="${path}" alt="Image" />
              </div>
              ${description}
                </div>
            </div>
          `;

          // Create marker icon
          const icon = L.divIcon({
            className: 'photo-marker',
            html: `<div class="photo-marker-inner"><img src="${path}" alt=""></div>`,
            iconSize: [48, 48],
          });

          // Create and add marker to cluster group
          const marker = L.marker([latitude, longitude], { icon })
            .bindPopup(popupHtml, { closeButton: false });

          markerCluster.addLayer(marker);
          markerBounds.extend([latitude, longitude]);

          resolve();
        });

    

      };
    });
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
