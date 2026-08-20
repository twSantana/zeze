import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

const INITIAL_CENTER = [-25.4372, -49.2700];
const INITIAL_ZOOM = 12;

function MapStableTracker({ onStable }) {
  useMapEvents({
    moveend: () => {
      onStable();
    },
    zoomend: () => {
      onStable();
    }
  });
  return null;
}

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

// Controla a troca dinâmica do tema do mapa recarregando a camada de tiles do Leaflet (com suporte a Mapbox)
function MapThemeHandler({ theme }) {
  const map = useMap();
  const tileLayerRef = useRef(null);

  useEffect(() => {
    // Remove camada anterior
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    let tileUrl;
    let attribution;

    if (mapboxToken) {
      const styleId = theme === 'dark' ? 'dark-v11' : 'streets-v12';
      tileUrl = `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
      attribution = '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    } else {
      tileUrl = theme === 'dark' 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 20,
      tileSize: mapboxToken ? 512 : 256,
      zoomOffset: mapboxToken ? -1 : 0
    });

    tileLayerRef.current.addTo(map);

  }, [theme, map]);

  return null;
}

// Invalida o tamanho do mapa para corrigir o bug de pin no canto superior esquerdo (out of sync no Leaflet)
function MapResizeHandler({ properties, hoveredPropertyId }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [properties, hoveredPropertyId, map]);
  return null;
}

function MarkerClusterer({ properties, hoveredPropertyId, onPropertyClick, theme, mapStableIndex }) {
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
      
      const getTypeSvg = (type) => {
        if (type === 'Casa') {
          return `<path d="M12 3 3 11.5V21h6v-6h6v6h6v-9.5L12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`;
        }
        if (type === 'Apartamento') {
          return `
            <path d="M3 21h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M9 7h2v2H9V7Zm4 0h2v2h-2V7Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Z" fill="currentColor"/>
          `;
        }
        return `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`;
      };
      const pinSvg = getTypeSvg(prop.tipo);
      const isPriority = prop.prioridade;
      const pinColorClass = prop.vendido
        ? (isHovered 
            ? 'bg-red-500 text-white scale-125 z-[9999] ring-4 ring-red-500/20 border-red-300' 
            : 'bg-red-950/60 dark:bg-red-950/80 text-red-400 border-red-900/40 shadow-md')
        : isPriority
          ? (isHovered 
              ? 'bg-amber-500 text-slate-950 scale-125 z-[9999] ring-4 ring-amber-500/25 border-amber-300' 
              : 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 border-amber-200 shadow-md shadow-amber-500/10')
          : (isHovered 
              ? 'bg-emerald-500 text-white scale-125 z-[9999] ring-4 ring-emerald-500/20' 
              : 'bg-slate-900 dark:bg-slate-950 text-emerald-400 hover:bg-slate-800');

      const customIcon = L.divIcon({
        className: 'custom-pin-container',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg border border-white transition-all duration-300 ${pinColorClass} ${isHovered ? 'active-map-pin' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${pinSvg}
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
        <div class="flex flex-col w-[260px] bg-white dark:bg-slate-900 overflow-hidden rounded-xl border ${prop.vendido ? 'border-red-500' : isPriority ? 'border-amber-500' : 'border-transparent'}">
          ${prop.imagem_url ? `
            <div class="h-28 w-full overflow-hidden relative">
              <img src="${prop.imagem_url}" class="w-full h-full object-cover" alt="${prop.titulo}" />
              <div class="absolute top-2 left-2 flex gap-1 z-[100]">
                ${prop.vendido ? `
                  <div class="bg-red-650 text-white px-2 py-0.5 text-[9px] font-black rounded-full shadow-md uppercase">
                    Vendido
                  </div>
                ` : isPriority ? `
                  <div class="bg-amber-500 text-slate-950 px-2 py-0.5 text-[9px] font-black rounded-full shadow-md">
                    ★ Prioridade
                  </div>
                ` : ''}
                <div class="bg-slate-900/80 text-white px-2 py-0.5 text-[9px] font-bold rounded-full border border-white/10 backdrop-blur-sm">
                  ${prop.tipo}
                </div>
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
              <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
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

  }, [properties, map, theme, hoveredPropertyId, onPropertyClick, mapStableIndex]);

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
  const [mapStableIndex, setMapStableIndex] = useState(0);

  const handleStable = () => {
    setMapStableIndex(prev => prev + 1);
  };

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

        {/* Invalidador de tamanho para reposicionar pins e evitar bugs de canto esquerdo */}
        <MapResizeHandler properties={properties} hoveredPropertyId={hoveredPropertyId} />

        {/* Gerenciador de Clusters e Marcadores */}
        <MarkerClusterer
          properties={properties}
          hoveredPropertyId={hoveredPropertyId}
          onPropertyClick={onPropertyClick}
          theme={theme}
          mapStableIndex={mapStableIndex}
        />

        {/* Rastreador de estabilização do mapa após movimentações/animações */}
        <MapStableTracker onStable={handleStable} />

        {/* Eventos Geográficos do Viewport */}
        <MapEvents onBboxChange={onBboxChange} />

        {/* Efeito de Centralização Geográfica */}
        <MapFocus focusLocation={focusLocation} />

        {/* Controle de Zoom Customizado */}
        <div className="absolute right-4 top-20 md:top-4 z-[999] flex flex-col gap-1 shadow-md rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
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
