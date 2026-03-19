// ===============================
// MAPA
// ===============================

var map = L.map("map").setView([4.538, -75.681], 13);

// ===============================
// MAPAS BASE
// ===============================

var satelite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { attribution: "Tiles © Esri" },
);

var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
});

var cartodb = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution: "© OpenStreetMap © CartoDB",
    subdomains: "abcd",
    maxZoom: 20,
  },
).addTo(map);

// ===============================
// GRUPOS DE CAPAS
// ===============================

var capaInfraestructura = L.layerGroup().addTo(map);
var capaComunas = L.layerGroup().addTo(map);

// ===============================
// CONTROL DE CAPAS
// ===============================

L.control
  .layers(
    {
      Satélite: satelite,
      OpenStreetMap: osm,
      CartoDB: cartodb,
    },
    {
      Infraestructura: capaInfraestructura,
      Comunas: capaComunas,
    },
  )
  .addTo(map);

// ===============================
// VARIABLES
// ===============================

var datosInfraestructura;
var capaGeoInfraestructura;

var datosComunas;
var capaGeoComunas;

// ===============================
// COLORES
// ===============================

function colorPorPoblacion(pob) {
  if (pob > 35000) return "#e74c3c";
  if (pob > 25000) return "#f39c12";
  return "#f1c40f";
}

// ===============================
// CARGAR INFRAESTRUCTURA
// ===============================

function cargarInfraestructura() {
  fetch("datos/infraestructura.geojson")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      datosInfraestructura = data;

      capaGeoInfraestructura = L.geoJSON(null, {
        onEachFeature: function (feature, layer) {
          var p = feature.properties;

          layer.bindPopup(
            "<b>" +
              p.nombre +
              "</b><br>" +
              "Tipo: " +
              p.tipo +
              "<br>" +
              "Capacidad: " +
              p.capacidad,
          );
        },
      }).addTo(capaInfraestructura);

      capaGeoInfraestructura.addData(datosInfraestructura);
    });
}

// ===============================
// CARGAR COMUNAS
// ===============================

function cargarComunas() {
  fetch("datos/comunas.geojson")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      datosComunas = data;

      capaGeoComunas = L.geoJSON(null, {
        style: function (feature) {
          return {
            fillColor: colorPorPoblacion(feature.properties.population),
            fillOpacity: 0.6,
            color: "#2c3e50",
            weight: 1.5,
          };
        },

        onEachFeature: function (feature, layer) {
          var p = feature.properties;

          layer.bindPopup(
            "<b>" +
              p.name +
              "</b><br>" +
              "Población: " +
              p.population.toLocaleString(),
          );
        },
      }).addTo(capaComunas);

      capaGeoComunas.addData(datosComunas);
    });
}

// ===============================
// LEYENDA
// ===============================

var leyenda = L.control({ position: "bottomleft" });

leyenda.onAdd = function () {
  var div = L.DomUtil.create("div", "leyenda");

  div.innerHTML =
    "<h4>Población</h4>" +
    '<span style="background:#e74c3c"></span> > 35.000 hab.<br>' +
    '<span style="background:#f39c12"></span> 25.001 – 35.000 hab.<br>' +
    '<span style="background:#f1c40f"></span> ≤ 25.000 hab.';

  return div;
};

leyenda.addTo(map);

// ===============================
// INICIAR
// ===============================

cargarInfraestructura();
cargarComunas();
