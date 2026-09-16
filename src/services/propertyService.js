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

export function parsePtBrNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    str = str.replace(/\./g, '');
  }
  
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function calculateFaixa(preco) {
  const p = parsePtBrNumber(preco);
  if (isNaN(p) || p <= 0) return 'Faixa 2';
  if (p <= 275000) return 'Faixa 2';
  if (p <= 400000) return 'Faixa 3';
  if (p <= 600000) return 'Faixa 4';
  return 'SBPE';
}

/**
 * Formata o código de referência único (ex: SM-0042)
 */
export function formatCodigoRef(property) {
  if (!property) return 'SM-0000';
  if (property.codigo_ref && String(property.codigo_ref).trim()) {
    return String(property.codigo_ref).trim();
  }
  const idNum = parseInt(property.id, 10);
  if (!isNaN(idNum)) {
    return `SM-${String(idNum).padStart(4, '0')}`;
  }
  return `SM-${String(property.id || '0000').slice(-4).toUpperCase()}`;
}

/**
 * Inserção em Lote (Batch Import)
 * Restrito a usuários Admin/Master
 */
export async function batchAddProperties(propertiesList, user) {
  assertSupabaseConfigured();
  if (!user || !user.id) {
    throw new Error('Usuário não autenticado.');
  }

  if (user.role !== 'master' && !user.isMaster) {
    throw new Error('Apenas usuários com privilégios Admin / Master podem realizar importação em lote.');
  }

  if (!Array.isArray(propertiesList) || propertiesList.length === 0) {
    throw new Error('A lista de imóveis fornecida está vazia.');
  }

  // Obter o maior id numérico atual para gerar códigos sequenciais se necessário
  let currentIdCounter = 1;
  try {
    const { data: maxRecord } = await supabase
      .from('empreendimentos')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (maxRecord && maxRecord[0] && maxRecord[0].id) {
      const parsedId = parseInt(maxRecord[0].id, 10);
      if (!isNaN(parsedId)) currentIdCounter = parsedId + 1;
    }
  } catch (e) {
    console.warn('Erro ao consultar id máximo para codigo_ref:', e);
  }

  const recordsToInsert = propertiesList.map((item, idx) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lng);
    const wktLocation = `POINT(${lng} ${lat})`;
    const precoNum = parsePtBrNumber(item.preco);
    const areaMinNum = parsePtBrNumber(item.area_m2);
    const areaMaxNum = item.area_max_m2 ? parsePtBrNumber(item.area_max_m2) : areaMinNum;
    const generatedCode = item.codigo_ref || `SM-${String(currentIdCounter + idx).padStart(4, '0')}`;

    const rec = {
      titulo: item.titulo || 'Empreendimento Sem Título',
      tipo: item.tipo || 'Apartamento',
      status: item.status || 'Pronto',
      preco: precoNum,
      quartos: parseInt(item.quartos || 0),
      vagas: parseInt(item.vagas || 0),
      area_m2: areaMinNum,
      imagem_url: item.imagem_url || '',
      endereco: item.endereco || '',
      bairro: item.bairro || '',
      cidade: item.cidade || 'Curitiba',
      conteudo_url: item.conteudo_url || '',
      localizacao: wktLocation,
      created_by: user.id,
      created_by_name: user.nome || 'Admin',
      created_by_role: user.role || 'master',
      prioridade: Boolean(item.prioridade),
      observacoes: item.observacoes || '',
      averbacao: item.averbacao || '',
      quartos_max: item.quartos_max ? parseInt(item.quartos_max) : parseInt(item.quartos || 0),
      vagas_max: item.vagas_max ? parseInt(item.vagas_max) : parseInt(item.vagas || 0),
      area_max_m2: areaMaxNum,
      faixa: calculateFaixa(precoNum),
      drive_url: item.drive_url || '',
      previsao_entrega: (item.status === 'Lançamento' || item.status === 'Em Obras') ? (item.previsao_entrega || '') : ''
    };

    if (generatedCode) {
      rec.codigo_ref = generatedCode;
    }

    return rec;
  });

  let data, error;
  try {
    const res = await supabase.from('empreendimentos').insert(recordsToInsert).select();
    data = res.data;
    error = res.error;
  } catch (err) {
    error = err;
  }

  // Fallback se a coluna codigo_ref ainda não existir no banco
  if (error && (error.code === '42703' || (error.message && error.message.includes('codigo_ref')))) {
    const recordsWithoutCode = recordsToInsert.map(({ codigo_ref, ...rest }) => rest);
    const retryRes = await supabase.from('empreendimentos').insert(recordsWithoutCode).select();
    data = retryRes.data;
    error = retryRes.error;
  }

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

  const lat = parseFloat(propertyData.lat);
  const lng = parseFloat(propertyData.lng);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Coordenadas geográficas (latitude e longitude) inválidas. Selecione um ponto no mapa.');
  }

  const wktLocation = `POINT(${lng} ${lat})`;
  const precoNum = parsePtBrNumber(propertyData.preco);
  const areaMinNum = parsePtBrNumber(propertyData.area_m2);
  const areaMaxNum = propertyData.area_max_m2 ? parsePtBrNumber(propertyData.area_max_m2) : areaMinNum;

  const { data, error } = await supabase
    .from('empreendimentos')
    .insert([{
      titulo: propertyData.titulo,
      tipo: propertyData.tipo,
      status: propertyData.status,
      preco: precoNum,
      quartos: parseInt(propertyData.quartos || 0),
      vagas: parseInt(propertyData.vagas || 0),
      area_m2: areaMinNum,
      imagem_url: propertyData.imagem_url || '',
      endereco: propertyData.endereco,
      bairro: propertyData.bairro,
      cidade: propertyData.cidade,
      conteudo_url: propertyData.conteudo_url || '',
      localizacao: wktLocation,
      created_by: user.id,
      created_by_name: user.nome,
      created_by_role: user.role,
      prioridade: Boolean(propertyData.prioridade),
      observacoes: propertyData.observacoes || '',
      averbacao: propertyData.averbacao || '',
      quartos_max: propertyData.quartos_max ? parseInt(propertyData.quartos_max) : parseInt(propertyData.quartos || 0),
      vagas_max: propertyData.vagas_max ? parseInt(propertyData.vagas_max) : parseInt(propertyData.vagas || 0),
      area_max_m2: areaMaxNum,
      faixa: calculateFaixa(precoNum),
      drive_url: propertyData.drive_url || '',
      previsao_entrega: (propertyData.status === 'Lançamento' || propertyData.status === 'Em Obras') ? (propertyData.previsao_entrega || '') : ''
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
    lat,
    lng
  };
}

/**
 * Edição
 */
export async function updateProperty(id, propertyData) {
  assertSupabaseConfigured();

  const updatePayload = {};

  if (propertyData.titulo !== undefined) updatePayload.titulo = propertyData.titulo;
  if (propertyData.tipo !== undefined) updatePayload.tipo = propertyData.tipo;
  if (propertyData.status !== undefined) updatePayload.status = propertyData.status;
  if (propertyData.preco !== undefined && propertyData.preco !== '') {
    const precoNum = parsePtBrNumber(propertyData.preco);
    updatePayload.preco = precoNum;
    updatePayload.faixa = calculateFaixa(precoNum);
  }
  if (propertyData.quartos !== undefined) updatePayload.quartos = parseInt(propertyData.quartos || 0);
  if (propertyData.vagas !== undefined) updatePayload.vagas = parseInt(propertyData.vagas || 0);
  if (propertyData.area_m2 !== undefined && propertyData.area_m2 !== '') {
    updatePayload.area_m2 = parsePtBrNumber(propertyData.area_m2);
  }
  if (propertyData.imagem_url !== undefined) updatePayload.imagem_url = propertyData.imagem_url;
  if (propertyData.endereco !== undefined) updatePayload.endereco = propertyData.endereco;
  if (propertyData.bairro !== undefined) updatePayload.bairro = propertyData.bairro;
  if (propertyData.cidade !== undefined) updatePayload.cidade = propertyData.cidade;
  if (propertyData.conteudo_url !== undefined) updatePayload.conteudo_url = propertyData.conteudo_url;
  if (propertyData.drive_url !== undefined) updatePayload.drive_url = propertyData.drive_url;
  if (propertyData.prioridade !== undefined) updatePayload.prioridade = Boolean(propertyData.prioridade);
  if (propertyData.observacoes !== undefined) updatePayload.observacoes = propertyData.observacoes || '';
  if (propertyData.averbacao !== undefined) updatePayload.averbacao = propertyData.averbacao || '';
  if (propertyData.quartos_max !== undefined) updatePayload.quartos_max = propertyData.quartos_max ? parseInt(propertyData.quartos_max) : parseInt(propertyData.quartos || 0);
  if (propertyData.vagas_max !== undefined) updatePayload.vagas_max = propertyData.vagas_max ? parseInt(propertyData.vagas_max) : parseInt(propertyData.vagas || 0);
  if (propertyData.area_max_m2 !== undefined && propertyData.area_max_m2 !== '') {
    updatePayload.area_max_m2 = parsePtBrNumber(propertyData.area_max_m2);
  }
  if (propertyData.previsao_entrega !== undefined) updatePayload.previsao_entrega = propertyData.previsao_entrega;

  // Apenas atualiza a localização se lat e lng válidos tiverem sido informados
  if (propertyData.lat !== undefined && propertyData.lng !== undefined && propertyData.lat !== null && propertyData.lng !== null) {
    const lat = parseFloat(propertyData.lat);
    const lng = parseFloat(propertyData.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      updatePayload.localizacao = `POINT(${lng} ${lat})`;
    }
  }

  const { data, error } = await supabase
    .from('empreendimentos')
    .update(updatePayload)
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
    lat: propertyData.lat !== undefined ? parseFloat(propertyData.lat) : data[0].lat,
    lng: propertyData.lng !== undefined ? parseFloat(propertyData.lng) : data[0].lng
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

export async function deletePropertyImage(id, bucket, path) {
  assertSupabaseConfigured();
  
  const { error: dbError } = await supabase
    .from('property_images')
    .delete()
    .eq('id', id);
  if (dbError) throw dbError;

  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch (storageErr) {
    console.warn('Erro ao deletar do storage, mas registro removido do banco:', storageErr);
  }
  
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

export async function updateConstrutora(id, nome) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('construtoras')
    .update({ nome })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

export async function deleteConstrutora(id) {
  assertSupabaseConfigured();
  const { error } = await supabase
    .from('construtoras')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function getMeusEmpreendimentos(brokerId, userRole) {
  assertSupabaseConfigured();
  const { data, error } = await supabase.rpc('get_meus_empreendimentos', {
    broker_id: brokerId,
    user_role: userRole
  });
  if (error) throw error;
  return data || [];
}

export async function togglePropertySold(id, vendidoStatus) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('empreendimentos')
    .update({ vendido: vendidoStatus })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}
