import { supabase, isSupabaseConfigured } from './supabase';

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado corretamente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
}

/**
 * Busca por Viewport
 */
export async function getPropertiesBbox({ minLng, minLat, maxLng, maxLat }) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.rpc('get_empreendimentos_bbox', {
    min_lng: minLng,
    min_lat: minLat,
    max_lng: maxLng,
    max_lat: maxLat
  });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Criação
 */
export async function addProperty(propertyData, user) {
  assertSupabaseConfigured();
  if (!user || !user.id) {
    throw new Error('Usuário não autenticado. Faça login antes de cadastrar um imóvel.');
  }

  const wktLocation = `POINT(${propertyData.lng} ${propertyData.lat})`;
  const { data, error } = await supabase
    .from('empreendimentos')
    .insert([{
      titulo: propertyData.titulo,
      tipo: propertyData.tipo,
      status: propertyData.status,
      preco: parseFloat(propertyData.preco),
      quartos: parseInt(propertyData.quartos || 0),
      vagas: parseInt(propertyData.vagas || 0),
      area_m2: parseFloat(propertyData.area_m2),
      imagem_url: propertyData.imagem_url,
      endereco: propertyData.endereco,
      bairro: propertyData.bairro,
      cidade: propertyData.cidade,
      conteudo_url: propertyData.conteudo_url,
      localizacao: wktLocation,
      created_by: user.id,
      created_by_name: user.nome,
      created_by_role: user.role
    }])
    .select();

  if (error) {
    throw error;
  }

  if (!data || !data[0]) {
    throw new Error('Falha ao criar empreendimento no Supabase.');
  }

  return {
    ...data[0],
    lat: propertyData.lat,
    lng: propertyData.lng
  };
}

/**
 * Edição
 */
export async function updateProperty(id, propertyData) {
  assertSupabaseConfigured();

  const wktLocation = `POINT(${propertyData.lng} ${propertyData.lat})`;
  const { data, error } = await supabase
    .from('empreendimentos')
    .update({
      titulo: propertyData.titulo,
      tipo: propertyData.tipo,
      status: propertyData.status,
      preco: parseFloat(propertyData.preco),
      quartos: parseInt(propertyData.quartos || 0),
      vagas: parseInt(propertyData.vagas || 0),
      area_m2: parseFloat(propertyData.area_m2),
      imagem_url: propertyData.imagem_url,
      endereco: propertyData.endereco,
      bairro: propertyData.bairro,
      cidade: propertyData.cidade,
      conteudo_url: propertyData.conteudo_url,
      localizacao: wktLocation
    })
    .eq('id', id)
    .select();

  if (error) {
    throw error;
  }

  if (!data || !data[0]) {
    throw new Error('Empreendimento não encontrado.');
  }

  return {
    ...data[0],
    lat: propertyData.lat,
    lng: propertyData.lng
  };
}

/**
 * Exclusão
 */
export async function deleteProperty(id) {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from('empreendimentos')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}
