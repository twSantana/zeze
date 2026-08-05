/**
 * Serviço de Geocodificação para CEPs e Endereços na RMC
 * Utiliza BrasilAPI (gratuita) com fallback para Nominatim (OSM)
 */

/**
 * Busca dados de CEP usando BrasilAPI (V2 com dados espaciais)
 * @param {string} rawCep CEP contendo ou não hífen
 */
export async function geocodeCep(rawCep) {
  const cep = rawCep.replace(/\D/g, '');
  if (cep.length !== 8) {
    return { success: false, error: 'CEP inválido. Deve possuir 8 dígitos.' };
  }

  try {
    // 1. Tentar BrasilAPI V2
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (res.ok) {
      const data = await res.json();
      
      const hasCoordinates = 
        data.location && 
        data.location.coordinates && 
        data.location.coordinates.latitude && 
        data.location.coordinates.longitude;

      if (hasCoordinates) {
        return {
          success: true,
          cep: data.cep,
          street: data.street || '',
          neighborhood: data.neighborhood || '',
          city: data.city || 'Curitiba',
          state: data.state || 'PR',
          lat: parseFloat(data.location.coordinates.latitude),
          lng: parseFloat(data.location.coordinates.longitude),
          source: 'BrasilAPI V2'
        };
      }
      
      // Se a BrasilAPI retornou o endereço mas sem coordenadas, tenta Nominatim usando os dados obtidos
      const addressQuery = `${data.street || ''}, ${data.neighborhood || ''}, ${data.city || 'Curitiba'}, PR, Brasil`;
      const coords = await geocodeNominatim(addressQuery, cep);
      if (coords.success) {
        return {
          success: true,
          cep: data.cep,
          street: data.street || '',
          neighborhood: data.neighborhood || '',
          city: data.city || 'Curitiba',
          state: data.state || 'PR',
          lat: coords.lat,
          lng: coords.lng,
          source: 'BrasilAPI + Nominatim'
        };
      }
    }
  } catch (error) {
    console.error('Erro ao consultar BrasilAPI:', error);
  }

  // 2. Se falhar, tentar geocodificação direta via Nominatim com o CEP
  try {
    const coords = await geocodeNominatim('', cep);
    if (coords.success) {
      return {
        success: true,
        cep,
        street: coords.street || '',
        neighborhood: coords.neighborhood || '',
        city: coords.city || 'Curitiba',
        state: 'PR',
        lat: coords.lat,
        lng: coords.lng,
        source: 'Nominatim'
      };
    }
  } catch (err) {
    console.error('Erro de fallback no Nominatim:', err);
  }

  return { success: false, error: 'Não foi possível encontrar a localização para este CEP.' };
}

/**
 * Consulta geocodificação no Nominatim (OpenStreetMap)
 * @param {string} query Endereço completo para consulta
 * @param {string} postalCode CEP (opcional)
 */
async function geocodeNominatim(query, postalCode = '') {
  let url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&country=Brazil';
  
  if (postalCode) {
    // Formata CEP para 00000-000 se necessário
    const formattedCep = postalCode.length === 8 
      ? `${postalCode.slice(0, 5)}-${postalCode.slice(5)}` 
      : postalCode;
    url += `&postalcode=${encodeURIComponent(formattedCep)}`;
  }
  
  if (query) {
    url += `&q=${encodeURIComponent(query)}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RealEstateMappingApp/1.0 (RMC)'
      }
    });

    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        const item = results[0];
        
        // Tenta extrair detalhes se disponíveis, senão retorna o padrão
        const displayNameParts = item.display_name.split(', ');
        
        return {
          success: true,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          // Nominatim dá displayName longo, que pode conter o bairro/cidade
          neighborhood: displayNameParts[1] || '',
          city: displayNameParts[2] || 'Curitiba'
        };
      }
    }
  } catch (error) {
    console.error('Erro no fetch Nominatim:', error);
  }

  return { success: false };
}
