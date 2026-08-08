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
      created_by_role: user.role,
      prioridade: Boolean(propertyData.prioridade),
      observacoes: propertyData.observacoes || '',
      averbacao: propertyData.averbacao || '',
      quartos_max: propertyData.quartos_max ? parseInt(propertyData.quartos_max) : parseInt(propertyData.quartos || 0),
      vagas_max: propertyData.vagas_max ? parseInt(propertyData.vagas_max) : parseInt(propertyData.vagas || 0),
      area_max_m2: propertyData.area_max_m2 ? parseFloat(propertyData.area_max_m2) : parseFloat(propertyData.area_m2)
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
      localizacao: wktLocation,
      prioridade: Boolean(propertyData.prioridade),
      observacoes: propertyData.observacoes || '',
      averbacao: propertyData.averbacao || '',
      quartos_max: propertyData.quartos_max ? parseInt(propertyData.quartos_max) : parseInt(propertyData.quartos || 0),
      vagas_max: propertyData.vagas_max ? parseInt(propertyData.vagas_max) : parseInt(propertyData.vagas || 0),
      area_max_m2: propertyData.area_max_m2 ? parseFloat(propertyData.area_max_m2) : parseFloat(propertyData.area_m2)
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

// ======================
// Imagens de Propriedade
// ======================

export async function getPropertyImages(propertyId) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('"order"', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function uploadPropertyImage(file, propertyId, options = {}) {
  assertSupabaseConfigured();
  if (!file) throw new Error('Arquivo inválido para upload.');
  if (!propertyId) throw new Error('propertyId é obrigatório para associar a imagem.');

  const bucket = options.bucket || 'property-images';
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `properties/${propertyId}/${timestamp}_${safeName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = urlData?.publicUrl || '';

  // Optional: try to read image dimensions in metadata if provided by client
  const meta = options.meta || {};

  const { data: insertData, error: insertError } = await supabase
    .from('property_images')
    .insert([{
      property_id: propertyId,
      bucket,
      path,
      filename: safeName,
      url: publicUrl,
      width: meta.width || null,
      height: meta.height || null,
      "order": meta.order || 0
    }])
    .select();

  if (insertError) {
    // rollback: delete uploaded file
    try {
      await supabase.storage.from(bucket).remove([path]);
    } catch (e) {
      // ignore
    }
    throw insertError;
  }

  return insertData && insertData[0] ? insertData[0] : null;
}

export async function uploadPropertyImages(files, propertyId, options = {}) {
  if (!Array.isArray(files)) files = [files];
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const inserted = await uploadPropertyImage(file, propertyId, { ...options, meta: { order: i } });
      results.push(inserted);
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      // continue with others
    }
  }
  return results;
}

export async function deletePropertyImageByPath(bucket, path) {
  assertSupabaseConfigured();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
  return true;
}

export async function getConstrutoras() {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('construtoras')
    .select('*')
    .order('nome', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addConstrutora(nome) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('construtoras')
    .insert([{ nome }])
    .select();
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

export async function uploadAvatar(file, userId) {
  assertSupabaseConfigured();
  if (!file) throw new Error('Arquivo inválido.');
  const bucket = 'property-images'; // Reuso do bucket existente para simplificar e garantir que funcione
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `properties/avatars/${userId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl(path);
  return urlData?.publicUrl || null;
}
