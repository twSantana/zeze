import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, 
  MapPin, X, Trash2, RefreshCw, Loader2, Sparkles, Building, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/Toast';
import { batchAddProperties, parsePtBrNumber } from '../services/propertyService';
import { geocodeAddress, geocodeCep } from '../services/geocoding';

export default function BatchImportModal({ isOpen, onClose, onSuccess }) {
  const { user, isMaster } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [parsedRows, setParsedRows] = useState([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState({ current: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  if (!isOpen) return null;

  if (!isMaster) {
    return (
      <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full text-center border border-slate-200 dark:border-slate-800 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Acesso Restrito</h3>
          <p className="text-xs text-slate-500 mt-1">Apenas usuários com privilégios Admin / Master podem realizar importação de imóveis em lote.</p>
          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // 1. Download do Modelo CSV Pré-formatado
  const handleDownloadTemplate = () => {
    const headers = [
      'titulo', 'tipo', 'status', 'preco', 'quartos', 'quartos_max',
      'vagas', 'vagas_max', 'area_m2', 'area_max_m2', 'endereco',
      'bairro', 'cidade', 'cep', 'latitude', 'longitude',
      'imagem_url', 'drive_url', 'observacoes'
    ];

    const sampleRows = [
      [
        'Residencial Parque das Flores', 'Apartamento', 'Lançamento', '350000', '2', '3',
        '1', '1', '65', '80', 'Rua das Flores 123', 'Portão', 'Curitiba', '80000000',
        '-25.4284', '-49.2733', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://drive.google.com', 'Excelente lançamento com sacada e churrasqueira gourmet.'
      ],
      [
        'Solar dos Pinheirais', 'Sobrado', 'Em Obras', '480000', '3', '3',
        '2', '2', '110', '125', 'Av. das Araucárias 450', 'Centro', 'São José dos Pinhais', '83005000',
        '-25.5333', '-49.2000', '', '', 'Sobrado triplex em condomínio fechado com piscina.'
      ]
    ];

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sellmaps_modelo_importacao.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.showSuccess('Planilha Modelo Padrão baixada com sucesso!');
  };

  // 2. Leitura & Parsing do Arquivo CSV em Memória
  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      toast.showError('O arquivo CSV parece estar vazio ou sem cabeçalhos válidos.');
      return;
    }

    // Detectar separador (ponto-e-vírgula ou vírgula ou tab)
    const firstLine = lines[0];
    let delimiter = ';';
    if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
    else if (firstLine.includes(',') && !firstLine.includes(';')) delimiter = ',';
    else if ((firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length) delimiter = ';';
    else delimiter = ',';

    const parseLine = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const rawHeaders = parseLine(lines[0]).map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());

    // Mapeador de colunas flexível
    const getColIndex = (names) => {
      for (const name of names) {
        const idx = rawHeaders.indexOf(name);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idxTitulo = getColIndex(['titulo', 'nome', 'empreendimento', 'imovel', 'title']);
    const idxTipo = getColIndex(['tipo', 'categoria', 'type']);
    const idxStatus = getColIndex(['status', 'fase', 'situacao']);
    const idxPreco = getColIndex(['preco', 'valor', 'price']);
    const idxQuartos = getColIndex(['quartos', 'dormitorios', 'dorms', 'bedrooms']);
    const idxQuartosMax = getColIndex(['quartos_max', 'quartosmax', 'dorms_max']);
    const idxVagas = getColIndex(['vagas', 'garagem', 'vagas_min']);
    const idxVagasMax = getColIndex(['vagas_max', 'vagasmax']);
    const idxArea = getColIndex(['area_m2', 'area', 'metragem', 'area_min']);
    const idxAreaMax = getColIndex(['area_max_m2', 'areamax']);
    const idxEndereco = getColIndex(['endereco', 'rua', 'logradouro', 'address']);
    const idxBairro = getColIndex(['bairro', 'neighborhood', 'suburb']);
    const idxCidade = getColIndex(['cidade', 'municipio', 'city']);
    const idxCep = getColIndex(['cep', 'zip', 'zipcode']);
    const idxLat = getColIndex(['latitude', 'lat']);
    const idxLng = getColIndex(['longitude', 'lng', 'lon']);
    const idxImagem = getColIndex(['imagem_url', 'imagem', 'foto', 'foto_url', 'image']);
    const idxDrive = getColIndex(['drive_url', 'drive', 'tabela_url', 'link_drive']);
    const idxObs = getColIndex(['observacoes', 'observacao', 'descricao', 'diferenciais', 'notes']);

    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length === 0 || cols.every(c => c === '')) continue;

      const getValue = (idx) => (idx !== -1 && cols[idx] ? cols[idx] : '');

      const item = {
        tempId: `row_${i}_${Date.now()}`,
        titulo: getValue(idxTitulo),
        tipo: getValue(idxTipo) || 'Apartamento',
        status: getValue(idxStatus) || 'Pronto',
        preco: getValue(idxPreco),
        quartos: getValue(idxQuartos) || '1',
        quartos_max: getValue(idxQuartosMax),
        vagas: getValue(idxVagas) || '0',
        vagas_max: getValue(idxVagasMax),
        area_m2: getValue(idxArea) || '50',
        area_max_m2: getValue(idxAreaMax),
        endereco: getValue(idxEndereco),
        bairro: getValue(idxBairro),
        cidade: getValue(idxCidade) || 'Curitiba',
        cep: getValue(idxCep),
        lat: getValue(idxLat),
        lng: getValue(idxLng),
        imagem_url: getValue(idxImagem),
        drive_url: getValue(idxDrive),
        observacoes: getValue(idxObs)
      };

      items.push(item);
    }

    setParsedRows(items);
    toast.showSuccess(`${items.length} linhas carregadas da planilha!`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result || '';
        parseCSVText(text);
      } catch (err) {
        toast.showError('Erro ao ler o arquivo CSV. Verifique a codificação.');
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.onerror = () => {
      toast.showError('Falha na leitura do arquivo.');
      setIsProcessingFile(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 3. Status de Cada Linha (Validação)
  const getRowStatus = (row) => {
    const hasTitle = Boolean(row.titulo && row.titulo.trim());
    const hasAddress = Boolean((row.endereco && row.endereco.trim()) || (row.cep && row.cep.trim()));
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

    if (!hasTitle || (!hasAddress && !hasCoords)) {
      return { code: 'INCOMPLETE', label: 'Incompleto', bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    }
    if (!hasCoords && hasAddress) {
      return { code: 'PENDING_GEO', label: 'Pendente Coordenadas', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    }
    return { code: 'READY', label: 'Pronto', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  };

  // 4. Auto-Geocodificação em Lote para Linhas Pendentes
  const handleGeocodePending = async () => {
    const pendingRows = parsedRows.filter(r => getRowStatus(r).code === 'PENDING_GEO');
    if (pendingRows.length === 0) {
      toast.showInfo('Não há nenhuma linha pendente de coordenadas.');
      return;
    }

    setIsGeocoding(true);
    setGeocodeProgress({ current: 0, total: pendingRows.length });

    const updatedRows = [...parsedRows];

    for (let i = 0; i < pendingRows.length; i++) {
      const target = pendingRows[i];
      setGeocodeProgress({ current: i + 1, total: pendingRows.length });

      let result = null;
      if (target.cep) {
        result = await geocodeCep(target.cep);
      }
      if ((!result || !result.success) && target.endereco) {
        result = await geocodeAddress(target.endereco, target.bairro, target.cidade || 'Curitiba');
      }

      if (result && result.success) {
        const rowIndex = updatedRows.findIndex(r => r.tempId === target.tempId);
        if (rowIndex !== -1) {
          updatedRows[rowIndex] = {
            ...updatedRows[rowIndex],
            lat: String(result.lat),
            lng: String(result.lng),
            bairro: updatedRows[rowIndex].bairro || result.neighborhood || '',
            cidade: updatedRows[rowIndex].cidade || result.city || 'Curitiba'
          };
        }
      }

      // Pequena pausa para evitar bloqueio de rate-limit
      await new Promise(res => setTimeout(res, 250));
    }

    setParsedRows(updatedRows);
    setIsGeocoding(false);
    toast.showSuccess('Processamento de coordenadas concluído!');
  };

  const handleRemoveRow = (tempId) => {
    setParsedRows(prev => prev.filter(r => r.tempId !== tempId));
  };

  // 5. Inserção em Lote no Supabase
  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter(r => getRowStatus(r).code === 'READY');
    if (validRows.length === 0) {
      toast.showError('Nenhuma linha está pronta para envio. Verifique os títulos e coordenadas.');
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(10);

    try {
      setSubmitProgress(50);
      const inserted = await batchAddProperties(validRows, user);
      setSubmitProgress(100);

      toast.showSuccess(`Sucesso! ${inserted.length} empreendimentos foram cadastrados no sistema!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro na importação em lote:', err);
      toast.showError(err.message || 'Erro ao realizar importação em lote.');
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(0);
    }
  };

  const readyCount = parsedRows.filter(r => getRowStatus(r).code === 'READY').length;
  const pendingGeoCount = parsedRows.filter(r => getRowStatus(r).code === 'PENDING_GEO').length;
  const incompleteCount = parsedRows.filter(r => getRowStatus(r).code === 'INCOMPLETE').length;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header da Modal */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Importação de Imóveis em Lote
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Admin / Master
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Anexe a planilha preenchida no padrão do sistema para cadastrar múltiplos empreendimentos de uma só vez.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Principal Scrollável */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          
          {/* Seção de Download do Modelo & Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Baixar Planilha Modelo */}
            <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">1. Baixar Planilha Modelo Padrão</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Faça o download do modelo em formato `.csv` pré-formatado com os cabeçalhos aceitos pelo SellMaps e exemplos de preenchimento.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                Baixar Planilha Modelo Padrão (.csv)
              </button>
            </div>

            {/* Card 2: Anexar Planilha Alimentada */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-5 h-5 text-teal-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">2. Anexar Planilha Preenchida</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Selecione ou arraste o arquivo `.csv` já alimentado com os seus empreendimentos. O arquivo será lido diretamente na memória.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    Processando Arquivo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-teal-400" />
                    Selecionar Planilha (.csv)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabela de Pré-visualização & Ajustes */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              
              {/* Barra de Status e Ações */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    🟢 {readyCount} Prontos
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    🟡 {pendingGeoCount} Pendentes
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    🔴 {incompleteCount} Incompletos
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {pendingGeoCount > 0 && (
                    <button
                      onClick={handleGeocodePending}
                      disabled={isGeocoding}
                      className="py-2 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      {isGeocoding ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Geocodificando ({geocodeProgress.current}/{geocodeProgress.total})...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Geocodificar Coordenadas Automaticamente
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setParsedRows([])}
                    className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 transition"
                  >
                    Limpar Tabela
                  </button>
                </div>
              </div>

              {/* Tabela Scrollável com Lista */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-white dark:bg-slate-950">
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Empreendimento</th>
                        <th className="p-3">Tipo / Fase</th>
                        <th className="p-3">Preço</th>
                        <th className="p-3">Endereço / Cidade</th>
                        <th className="p-3">Coordenadas</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {parsedRows.map((row, index) => {
                        const status = getRowStatus(row);
                        return (
                          <tr key={row.tempId} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                            <td className="p-3 text-slate-400 font-bold">{index + 1}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {row.titulo || <span className="text-rose-500 italic">Sem título</span>}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {row.tipo} • <span className="font-semibold">{row.status}</span>
                            </td>
                            <td className="p-3 text-emerald-500 font-bold">
                              {row.preco ? `R$ ${parsePtBrNumber(row.preco).toLocaleString('pt-BR')}` : '-'}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate" title={`${row.endereco || ''} ${row.bairro || ''} ${row.cidade || ''}`}>
                              {row.endereco ? `${row.endereco}${row.bairro ? `, ${row.bairro}` : ''}` : (row.cep ? `CEP: ${row.cep}` : '-')}
                            </td>
                            <td className="p-3 font-mono text-[10px]">
                              {row.lat && row.lng ? (
                                <span className="text-emerald-400 font-semibold">{row.lat.slice(0,7)}, {row.lng.slice(0,7)}</span>
                              ) : (
                                <span className="text-amber-500 italic">Falta pino</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemoveRow(row.tempId)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                                title="Remover linha da importação"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé Fixo com Botão de Confirmação */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {parsedRows.length > 0 ? (
              <span>Prontos para envio: <strong className="text-emerald-500">{readyCount} de {parsedRows.length}</strong> empreendimentos</span>
            ) : (
              <span>Nenhuma planilha anexada</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
            >
              Cancelar
            </button>

            <button
              onClick={handleImportSubmit}
              disabled={isSubmitting || readyCount === 0}
              className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Importando ({submitProgress}%)...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-slate-950 fill-current" />
                  Confirmar e Importar {readyCount} Imóveis
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
