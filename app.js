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
      datosComunas = {
        type: "FeatureCollection",
        features: data.features.filter(function (f) {
          return f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon";
        }),
      };

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
              (p.population ? p.population.toLocaleString() : "N/D") +
              "<br>" +
              "Área: " +
              (p.area_km2 || "N/D") +
              " km²",
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
// FILTROS – COMUNAS
// ===============================

function actualizarConteo() {
  var n = capaGeoComunas ? capaGeoComunas.getLayers().length : 0;
  document.getElementById("conteo").textContent = n + " comunas visibles";
}

function mostrarTodos() {
  if (!datosComunas || !capaGeoComunas) return;
  capaGeoComunas.clearLayers();
  capaGeoComunas.addData(datosComunas);
  document.getElementById("filtro-poblacion").value = "todos";
  document.getElementById("buscar-comuna").value = "";
  actualizarConteo();
}

function filtrarAreaGrande() {
  if (!datosComunas || !capaGeoComunas) return;
  var filtrado = datosComunas.features.filter(function (f) {
    return f.properties.area_km2 > 3;
  });
  capaGeoComunas.clearLayers();
  capaGeoComunas.addData(filtrado);
  actualizarConteo();
}

function aplicarFiltroPoblacion() {
  var valor = document.getElementById("filtro-poblacion").value;
  if (!datosComunas || !capaGeoComunas) return;

  var filtrado;
  if (valor === "todos") {
    filtrado = datosComunas.features;
  } else if (valor === "menor25") {
    filtrado = datosComunas.features.filter(function (f) {
      return f.properties.population <= 25000;
    });
  } else if (valor === "25a35") {
    filtrado = datosComunas.features.filter(function (f) {
      var p = f.properties.population;
      return p > 25000 && p <= 35000;
    });
  } else if (valor === "mayor35") {
    filtrado = datosComunas.features.filter(function (f) {
      return f.properties.population > 35000;
    });
  }

  capaGeoComunas.clearLayers();
  capaGeoComunas.addData(filtrado);
  actualizarConteo();
}

function buscarPorNombre(texto) {
  if (!datosComunas || !capaGeoComunas) return;
  var t = texto.toLowerCase();
  var filtrado = datosComunas.features.filter(function (f) {
    var nombre = f.properties.name || "";
    return nombre.toLowerCase().indexOf(t) !== -1;
  });
  capaGeoComunas.clearLayers();
  capaGeoComunas.addData(filtrado);
  actualizarConteo();
}

// ===============================
// FILTROS – INFRAESTRUCTURA
// ===============================

function aplicarFiltroTipo() {
  var valor = document.getElementById("filtro-tipo").value;
  if (!datosInfraestructura || !capaGeoInfraestructura) return;

  capaGeoInfraestructura.clearLayers();
  if (valor === "todos") {
    capaGeoInfraestructura.addData(datosInfraestructura);
  } else {
    var filtrado = datosInfraestructura.features.filter(function (f) {
      return f.properties.tipo === valor;
    });
    capaGeoInfraestructura.addData(filtrado);
  }
}

// ===============================
// INICIAR
// ===============================

cargarInfraestructura();
cargarComunas();
