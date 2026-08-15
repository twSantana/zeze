/**
 * Serviço de Geocodificação para CEPs e Endereços na RMC
 * Utiliza BrasilAPI e ViaCEP com fallback para Nominatim (OSM)
 */

/**
 * Busca dados de CEP usando múltiplos serviços
 * @param {string} rawCep CEP contendo ou não hífen
 */
export async function geocodeCep(rawCep) {
  const cep = rawCep.replace(/\D/g, '');
  if (cep.length !== 8) {
    return { success: false, error: 'CEP inválido. Deve possuir 8 dígitos.' };
  }

  // 1. Tentar BrasilAPI V2 (dá endereço + coordenadas em um único request se disponível)
  try {
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
    }
  } catch (error) {
    console.warn('Erro ao consultar BrasilAPI V2:', error);
  }

  // 2. Fallback: ViaCEP (extremamente estável e sem CORS) + Nominatim
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.erro) {
        const street = data.logradouro || '';
        const neighborhood = data.bairro || '';
        const city = data.localidade || 'Curitiba';
        const state = data.uf || 'PR';

        // Tentar obter coordenadas para este endereço no Nominatim
        const addressResult = await geocodeAddress(street, neighborhood, city, state);
        if (addressResult.success) {
          return {
            success: true,
            cep: data.cep.replace('-', ''),
            street,
            neighborhood,
            city,
            state,
            lat: addressResult.lat,
            lng: addressResult.lng,
            source: 'ViaCEP + Nominatim'
          };
        }

        // Se falhar o geocódigo das coordenadas, pelo menos retorna os dados textuais da ViaCEP
        return {
          success: false,
          cep: data.cep.replace('-', ''),
          street,
          neighborhood,
          city,
          state,
          error: 'CEP encontrado, mas ajuste as coordenadas no mapa.'
        };
      }
    }
  } catch (error) {
    console.warn('Erro ao consultar ViaCEP:', error);
  }

  // 3. Fallback final: Geocodificar apenas o CEP direto no Nominatim
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
        source: 'Nominatim (Apenas CEP)'
      };
    }
  } catch (err) {
    console.error('Erro de fallback final no Nominatim:', err);
  }

  return { success: false, error: 'Não foi possível encontrar a localização para este CEP.' };
}

/**
 * Consulta geocodificação no Nominatim (OpenStreetMap)
 * @param {string} query Endereço completo para consulta
 * @param {string} postalCode CEP (opcional)
 */
async function geocodeNominatim(query, postalCode = '') {
  let url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&addressdetails=1';
  
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
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });

    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        const item = results[0];
        const addr = item.address || {};
        
        // Extrai bairro
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || '';
        
        // Extrai cidade
        const city = addr.city || addr.town || addr.village || addr.municipality || 'Curitiba';
        
        return {
          success: true,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          neighborhood,
          city
        };
      }
    }
  } catch (error) {
    console.error('Erro no fetch Nominatim:', error);
  }

  return { success: false };
}

/**
 * Busca dados de coordenadas por texto de endereço com fallback tolerante a erros de digitação (ex: erros no bairro)
 * @param {string} street Rua/Logradouro e número (opcional)
 * @param {string} neighborhood Bairro (opcional)
 * @param {string} city Cidade (padrão Curitiba)
 * @param {string} state Estado (padrão PR)
 */
export async function geocodeAddress(street, neighborhood = '', city = 'Curitiba', state = 'PR') {
  if (!street) {
    return { success: false, error: 'O endereço (rua) é obrigatório para geocodificação.' };
  }
  const cleanStreet = street.trim();
  const cleanNeighborhood = neighborhood.trim();
  const cleanCity = city.trim();
  
  // 1. Tentar busca detalhada com Rua, Bairro e Cidade
  let addressQuery = `${cleanStreet}${cleanNeighborhood ? `, ${cleanNeighborhood}` : ''}, ${cleanCity}, ${state}, Brasil`;
  
  try {
    let coords = await geocodeNominatim(addressQuery);
    if (coords.success) {
      return {
        success: true,
        lat: coords.lat,
        lng: coords.lng,
        street: cleanStreet,
        neighborhood: cleanNeighborhood || coords.neighborhood,
        city: cleanCity,
        state,
        source: 'Nominatim'
      };
    }

    // 2. Fallback tolerante: se falhou e havia bairro, tentar APENAS Rua e Cidade (ignora erros de digitação no bairro)
    if (cleanNeighborhood) {
      addressQuery = `${cleanStreet}, ${cleanCity}, ${state}, Brasil`;
      coords = await geocodeNominatim(addressQuery);
      if (coords.success) {
        return {
          success: true,
          lat: coords.lat,
          lng: coords.lng,
          street: cleanStreet,
          neighborhood: coords.neighborhood || cleanNeighborhood,
          city: cleanCity,
          state,
          source: 'Nominatim (Sem Bairro)'
        };
      }
    }
  } catch (err) {
    console.error('Erro ao geocodificar endereço:', err);
  }
  return { success: false, error: 'Não foi possível encontrar a localização para este endereço.' };
}


