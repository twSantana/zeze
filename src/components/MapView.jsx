import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

const INITIAL_CENTER = [-25.4372, -49.2700];
const INITIAL_ZOOM = 12;

function MapEvents({ onBboxChange }) {
  const map = useMapEvents({
    moveend: () => {
      handleBboxUpdate();
    },
    zoomend: () => {
      handleBboxUpdate();
    }
  });

  const handleBboxUpdate = () => {
    const bounds = map.getBounds();
    onBboxChange({
      minLng: bounds.getWest(),
      minLat: bounds.getSouth(),
      maxLng: bounds.getEast(),
      maxLat: bounds.getNorth()
    });
  };

  useEffect(() => {
    setTimeout(() => {
      handleBboxUpdate();
    }, 100);
  }, []);

  return null;
}

function MapFocus({ focusLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (focusLocation) {
      map.flyTo([focusLocation.lat, focusLocation.lng], focusLocation.zoom || 15, {
        duration: 1.5
      });
    }
  }, [focusLocation, map]);

  return null;
}

// Controla a troca dinâmica do tema do mapa recarregando a camada de tiles do Leaflet
function MapThemeHandler({ theme }) {
  const map = useMap();
  const tileLayerRef = useRef(null);

  useEffect(() => {
    // Remove camada anterior
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = theme === 'dark' 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    });

    tileLayerRef.current.addTo(map);

  }, [theme, map]);

  return null;
}

function MarkerClusterer({ properties, hoveredPropertyId, onPropertyClick, theme }) {
  const map = useMap();
  const clusterGroupRef = useRef(null);
  const markersMapRef = useRef(new Map());

  useEffect(() => {
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: true
      });
      map.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;
    clusterGroup.clearLayers();
    markersMapRef.current.clear();

    properties.forEach((prop) => {
      if (!prop.lat || !prop.lng) return;

      const isHovered = hoveredPropertyId === prop.id;
      
      const customIcon = L.divIcon({
        className: `custom-pin-container ${isHovered ? 'active-map-pin' : ''}`,
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg border border-white transition-all duration-300 ${
            isHovered 
              ? 'bg-emerald-500 text-white scale-125 z-[9999] ring-4 ring-emerald-500/20' 
              : 'bg-slate-900 dark:bg-slate-950 text-emerald-450 dark:text-emerald-400 hover:bg-slate-800'
          }">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([prop.lat, prop.lng], { icon: customIcon });

      const formatPrice = (value) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0
        }).format(value);
      };

      const popupContent = `
        <div class="flex flex-col w-[260px] bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
          ${prop.imagem_url ? `
            <div class="h-28 w-full overflow-hidden relative">
              <img src="${prop.imagem_url}" class="w-full h-full object-cover" alt="${prop.titulo}" />
              <div class="absolute top-2 left-2 bg-slate-900/80 text-white px-2 py-0.5 text-[9px] font-bold rounded-full border border-white/10 backdrop-blur-sm">
                ${prop.tipo}
              </div>
            </div>
          ` : ''}
          <div class="p-3 text-slate-800 dark:text-slate-200">
            <h4 class="text-xs font-extrabold text-slate-800 dark:text-slate-50 line-clamp-1">${prop.titulo}</h4>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">${prop.bairro}, ${prop.cidade}</p>
            
            ${prop.conteudo_url ? `
              <a href="${prop.conteudo_url}" target="_blank" rel="noopener noreferrer" class="text-[10px] text-blue-500 dark:text-blue-400 hover:underline font-bold mt-2 inline-block">
                Ver Página de Conteúdo ➔
              </a>
            ` : ''}

            <div class="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400">
              ${prop.created_by_name ? `Cadastrado por ${prop.created_by_name}` : ''}
            </div>
            <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span class="text-xs font-black text-slate-900 dark:text-white">${formatPrice(prop.preco)}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/50">
                ${prop.status}
              </span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -10]
      });

      marker.on('click', () => {
        if (onPropertyClick) onPropertyClick(prop);
      });

      clusterGroup.addLayer(marker);
      markersMapRef.current.set(prop.id, marker);
    });

  }, [properties, map, theme]); // Recarrega marcadores se o tema mudar para aplicar classes Tailwind corretas

  useEffect(() => {
    if (hoveredPropertyId) {
      const marker = markersMapRef.current.get(hoveredPropertyId);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 50);
      }
    } else {
      map.closePopup();
    }
  }, [hoveredPropertyId, map]);

  return null;
}

export default function MapView({
  properties,
  hoveredPropertyId,
  onBboxChange,
  onPropertyClick,
  focusLocation,
  theme
}) {
  return (
    <div className="w-full h-full relative min-h-[320px]">
      <MapContainer
        center={INITIAL_CENTER}
        zoom={INITIAL_ZOOM}
        zoomControl={false}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Controle dinâmico do Tile do mapa baseado no tema */}
        <MapThemeHandler theme={theme} />

        {/* Gerenciador de Clusters e Marcadores */}
        <MarkerClusterer
          properties={properties}
          hoveredPropertyId={hoveredPropertyId}
          onPropertyClick={onPropertyClick}
          theme={theme}
        />

        {/* Eventos Geográficos do Viewport */}
        <MapEvents onBboxChange={onBboxChange} />

        {/* Efeito de Centralização Geográfica */}
        <MapFocus focusLocation={focusLocation} />

        {/* Controle de Zoom Customizado */}
        <div className="absolute right-4 top-4 z-[999] flex flex-col gap-1 shadow-md rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
          <button
            onClick={() => {
              const leafletMap = document.querySelector('.leaflet-container')?._leaflet_map;
              if (leafletMap) leafletMap.zoomIn();
            }}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-bold border-b border-slate-100 dark:border-slate-800 transition"
            title="Aumentar Zoom"
          >
            +
          </button>
          <button
            onClick={() => {
              const leafletMap = document.querySelector('.leaflet-container')?._leaflet_map;
              if (leafletMap) leafletMap.zoomOut();
            }}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition"
            title="Diminuir Zoom"
          >
            −
          </button>
        </div>
      </MapContainer>
    </div>
  );
}
