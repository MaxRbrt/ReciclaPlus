// ============================================================
// TELA: Editar Ponto
// Rota: /ponto/editar/[id]
//
// RESPONSABILIDADES:
//   1. Buscar os dados atuais do ponto pelo ID da rota.
//   2. Preencher o formulario com nome, descricao, endereco,
//      bairro, horario, foto, coordenadas e categorias atuais.
//   3. Permitir que o dono do ponto altere esses dados.
//   4. Enviar a edicao para PUT /pontos/:id.
//
// OBSERVACAO DE SEGURANCA:
//   - O frontend esconde a edicao para quem nao e dono.
//   - O backend tambem valida usuario_id antes de atualizar.
//     Essa segunda validacao e a que realmente protege os dados.
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { buscarPonto, atualizarPonto } from '@/servicos/pontos';
import { CATEGORIAS } from '@/constantes/categorias';
import { Cores, Fontes, Espacamento, Bordas, Sombra } from '@/constantes/tema';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { Ponto } from '@/tipos/ponto';

export default function TelaEditarPonto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAutenticacao();

  // Estados da tela: carregamento inicial, erro e salvamento.
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [pegandoGPS, setPegandoGPS] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pontoOriginal, setPontoOriginal] = useState<Ponto | null>(null);

  // Estados do formulario. Eles espelham os campos aceitos pelo backend.
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [horario, setHorario] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<number[]>([]);

  // ------------------------------------------------------------
  // Carregamento inicial
  // ------------------------------------------------------------
  useEffect(() => {
    let ativo = true;

    async function carregarPonto() {
      setCarregando(true);
      setErro(null);

      try {
        const dados = await buscarPonto(Number(id));
        if (!ativo) return;

        if (usuario && dados.usuarioId !== usuario.id) {
          setErro('Voce so pode editar pontos cadastrados pela sua conta.');
          setPontoOriginal(null);
          return;
        }

        setPontoOriginal(dados);
        preencherFormulario(dados);
      } catch {
        if (ativo) {
          setErro('Nao foi possivel carregar os dados deste ponto.');
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPonto();

    return () => {
      ativo = false;
    };
  }, [id, usuario]);

  // Copia os dados do ponto para os states editaveis.
  // Manter essa funcao separada deixa claro o limite entre
  // "dado vindo da API" e "dado alteravel no formulario".
  function preencherFormulario(ponto: Ponto) {
    setNome(ponto.nome ?? '');
    setDescricao(ponto.descricao ?? '');
    setEndereco(ponto.endereco ?? '');
    setBairro(ponto.bairro ?? '');
    setHorario(ponto.horarioFuncionamento ?? '');
    setFotoUri(ponto.fotoUrl || null);
    setLatitude(Number(ponto.latitude));
    setLongitude(Number(ponto.longitude));
    setCategorias(ponto.categorias?.map(cat => cat.id) ?? []);
  }

  // ------------------------------------------------------------
  // Categorias
  // ------------------------------------------------------------
  function toggleCategoria(idCategoria: number) {
    setCategorias(prev =>
      prev.includes(idCategoria)
        ? prev.filter(idAtual => idAtual !== idCategoria)
        : [...prev, idCategoria]
    );
  }

  // ------------------------------------------------------------
  // Foto
  // ------------------------------------------------------------
  function aoTocarFoto() {
    Alert.alert(
      'Foto do ponto',
      'Como voce quer atualizar a foto?',
      [
        { text: 'Tirar foto', onPress: capturarComCamera },
        { text: 'Escolher da galeria', onPress: escolherDaGaleria },
        { text: 'Remover foto', style: 'destructive', onPress: () => setFotoUri(null) },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }

  async function capturarComCamera() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissao negada', 'Permita acesso a camera nas configuracoes do app.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets?.[0]) {
      setFotoUri(resultado.assets[0].uri);
    }
  }

  async function escolherDaGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissao negada', 'Permita acesso a galeria nas configuracoes do app.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets?.[0]) {
      setFotoUri(resultado.assets[0].uri);
    }
  }

  // ------------------------------------------------------------
  // Localizacao
  // ------------------------------------------------------------
  async function aoCapturarGPS() {
    setPegandoGPS(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissao negada', 'Permita acesso a localizacao nas configuracoes.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel obter a localizacao.');
    } finally {
      setPegandoGPS(false);
    }
  }

  // ------------------------------------------------------------
  // Validacao e envio
  // ------------------------------------------------------------
  function validar(): boolean {
    if (!nome.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe o nome do ponto.');
      return false;
    }
    if (!endereco.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe o endereco.');
      return false;
    }
    if (!bairro.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe o bairro.');
      return false;
    }
    if (latitude === null || longitude === null) {
      Alert.alert('Localizacao', 'Capture a localizacao GPS do ponto.');
      return false;
    }
    if (categorias.length === 0) {
      Alert.alert('Categorias', 'Selecione ao menos uma categoria.');
      return false;
    }
    return true;
  }

  async function aoSalvar() {
    if (!pontoOriginal || !validar()) return;

    setSalvando(true);
    try {
      await atualizarPonto(pontoOriginal.id, {
        nome: nome.trim(),
        descricao: descricao.trim(),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        latitude: latitude!,
        longitude: longitude!,
        fotoUrl: fotoUri ?? '',
        horarioFuncionamento: horario.trim(),
        categoriaIds: categorias,
      });

      Alert.alert('Sucesso!', 'Ponto atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.replace(`/ponto/${pontoOriginal.id}`) },
      ]);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel atualizar o ponto. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  // ------------------------------------------------------------
  // Estados especiais
  // ------------------------------------------------------------
  if (carregando) {
    return (
      <View style={estilos.estadoCentral}>
        <ActivityIndicator size="large" color={Cores.primaria} />
        <Text style={estilos.estadoTexto}>Carregando ponto...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={estilos.estadoCentral}>
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color={Cores.erro} />
        <Text style={estilos.estadoTitulo}>Nao foi possivel editar</Text>
        <Text style={estilos.estadoTexto}>{erro}</Text>
        <TouchableOpacity style={estilos.btnVoltarErro} onPress={() => router.back()}>
          <Text style={estilos.btnVoltarErroTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.raiz}>
      {/* Header fixo da tela */}
      <View style={estilos.header}>
        <TouchableOpacity style={estilos.voltarBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Cores.branco} />
        </TouchableOpacity>
        <View style={estilos.headerTextoArea}>
          <Text style={estilos.headerTitulo}>Editar Ponto</Text>
          <Text style={estilos.headerSubtitulo} numberOfLines={1}>
            {pontoOriginal?.nome}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Foto atual ou placeholder */}
        <TouchableOpacity style={estilos.fotoArea} onPress={aoTocarFoto} activeOpacity={0.85}>
          {fotoUri ? (
            <>
              <Image source={{ uri: fotoUri }} style={estilos.fotoImagem} />
              <View style={estilos.fotoOverlay}>
                <View style={estilos.fotoBadge}>
                  <MaterialCommunityIcons name="camera-retake" size={16} color={Cores.branco} />
                  <Text style={estilos.fotoBadgeTexto}>Trocar foto</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={estilos.fotoPlaceholder}>
              <MaterialCommunityIcons name="camera-plus" size={36} color={Cores.primaria} />
              <Text style={estilos.fotoTitulo}>Adicionar foto do ponto</Text>
              <Text style={estilos.fotoSub}>Toque para tirar foto ou escolher da galeria</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Dados basicos */}
        <View style={estilos.grupo}>
          <Text style={estilos.label}>Nome do ponto *</Text>
          <TextInput
            style={estilos.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Ecoponto Centro"
            placeholderTextColor={Cores.cinzaMedio}
          />
        </View>

        <View style={estilos.grupo}>
          <Text style={estilos.label}>Descricao</Text>
          <TextInput
            style={[estilos.input, estilos.inputMultilinha]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Informacoes adicionais sobre o ponto..."
            placeholderTextColor={Cores.cinzaMedio}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={estilos.grupo}>
          <Text style={estilos.label}>Endereco *</Text>
          <TextInput
            style={estilos.input}
            value={endereco}
            onChangeText={setEndereco}
            placeholder="Rua, numero"
            placeholderTextColor={Cores.cinzaMedio}
          />
        </View>

        <View style={estilos.grupo}>
          <Text style={estilos.label}>Bairro *</Text>
          <TextInput
            style={estilos.input}
            value={bairro}
            onChangeText={setBairro}
            placeholder="Nome do bairro"
            placeholderTextColor={Cores.cinzaMedio}
          />
        </View>

        <View style={estilos.grupo}>
          <Text style={estilos.label}>Horario de funcionamento</Text>
          <TextInput
            style={estilos.input}
            value={horario}
            onChangeText={setHorario}
            placeholder="Ex: Seg a Sex, 08:00 - 18:00"
            placeholderTextColor={Cores.cinzaMedio}
          />
        </View>

        {/* Localizacao GPS */}
        <View style={estilos.grupo}>
          <Text style={estilos.label}>Localizacao GPS *</Text>
          <TouchableOpacity
            style={[estilos.btnGPS, latitude !== null && estilos.btnGPSAtivo]}
            onPress={aoCapturarGPS}
            disabled={pegandoGPS}
            activeOpacity={0.85}
          >
            {pegandoGPS ? (
              <ActivityIndicator size="small" color={Cores.primaria} />
            ) : (
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color={latitude !== null ? Cores.primaria : Cores.cinzaMedio}
              />
            )}
            <View style={estilos.gpsTextoArea}>
              <Text style={[estilos.btnGPSTexto, latitude !== null && { color: Cores.primaria }]}>
                {latitude !== null && longitude !== null
                  ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                  : 'Capturar localizacao atual'}
              </Text>
              {latitude !== null && longitude !== null ? (
                <Text style={estilos.gpsAjuda}>Toque para substituir pela sua localizacao atual</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        </View>

        {/* Categorias aceitas */}
        <View style={estilos.grupo}>
          <Text style={estilos.label}>Materiais aceitos *</Text>
          <View style={estilos.categoriasGrid}>
            {CATEGORIAS.map(cat => {
              const selecionado = categorias.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    estilos.catChip,
                    selecionado && { backgroundColor: cat.cor, borderColor: cat.cor },
                  ]}
                  onPress={() => toggleCategoria(cat.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={cat.icone as any}
                    size={16}
                    color={selecionado ? Cores.branco : cat.cor}
                  />
                  <Text style={[estilos.catChipTexto, selecionado && { color: Cores.branco }]}>
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Acao principal */}
        <TouchableOpacity
          style={[estilos.btnSalvar, salvando && estilos.btnDesabilitado]}
          onPress={aoSalvar}
          disabled={salvando}
          activeOpacity={0.85}
        >
          {salvando ? (
            <ActivityIndicator color={Cores.branco} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={20} color={Cores.branco} />
              <Text style={estilos.btnSalvarTexto}>Salvar Alteracoes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ============================================================
// ESTILOS
// Mantem a linguagem visual do formulario de novo ponto, mas
// adiciona estados de carregamento/erro e textos de contexto.
// ============================================================
const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Cores.cinzaClaro },

  estadoCentral: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Cores.cinzaClaro,
    padding: Espacamento.lg,
    gap: Espacamento.sm,
  },
  estadoTitulo: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
    textAlign: 'center',
  },
  estadoTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    textAlign: 'center',
  },
  btnVoltarErro: {
    marginTop: Espacamento.md,
    backgroundColor: Cores.primaria,
    borderRadius: Bordas.raio,
    paddingHorizontal: Espacamento.xl,
    paddingVertical: Espacamento.sm,
  },
  btnVoltarErroTexto: {
    color: Cores.branco,
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
  },

  header: {
    backgroundColor: Cores.primaria,
    paddingTop: 56,
    paddingBottom: Espacamento.lg,
    paddingHorizontal: Espacamento.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
  },
  voltarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextoArea: { flex: 1 },
  headerTitulo: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.negrito,
    color: Cores.branco,
  },
  headerSubtitulo: {
    fontSize: Fontes.pequena,
    color: Cores.primariaClara,
    marginTop: 2,
  },

  scroll: { padding: Espacamento.lg, paddingBottom: Espacamento.xxl },

  fotoArea: {
    borderRadius: Bordas.raioGrande,
    overflow: 'hidden',
    marginBottom: Espacamento.lg,
    ...Sombra.suave,
  },
  fotoImagem: { width: '100%', height: 200 },
  fotoOverlay: {
    position: 'absolute',
    bottom: Espacamento.sm,
    right: Espacamento.sm,
  },
  fotoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 4,
    borderRadius: Bordas.raioTotal,
  },
  fotoBadgeTexto: {
    color: Cores.branco,
    fontSize: Fontes.pequena,
    fontWeight: Fontes.negrito,
  },
  fotoPlaceholder: {
    height: 180,
    backgroundColor: Cores.branco,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Cores.cinzaBorda,
    borderStyle: 'dashed',
    borderRadius: Bordas.raioGrande,
    gap: 6,
    padding: Espacamento.md,
  },
  fotoTitulo: {
    fontSize: Fontes.normal,
    color: Cores.preto,
    fontWeight: Fontes.muitoNegrito,
    marginTop: 4,
  },
  fotoSub: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    textAlign: 'center',
  },

  grupo: { marginBottom: Espacamento.md },
  label: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
    marginBottom: Espacamento.xs,
  },
  input: {
    backgroundColor: Cores.branco,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raio,
    paddingHorizontal: Espacamento.md,
    height: 48,
    fontSize: Fontes.normal,
    color: Cores.preto,
  },
  inputMultilinha: {
    height: 90,
    paddingTop: Espacamento.sm,
  },

  btnGPS: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.branco,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raio,
    paddingHorizontal: Espacamento.md,
    minHeight: 52,
    paddingVertical: 6,
  },
  btnGPSAtivo: {
    borderColor: Cores.primaria,
    backgroundColor: Cores.primariaFundo,
  },
  gpsTextoArea: { flex: 1 },
  btnGPSTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
  },
  gpsAjuda: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    marginTop: 1,
  },

  categoriasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raioTotal,
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 7,
    backgroundColor: Cores.branco,
  },
  catChipTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
  },

  btnSalvar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Cores.primaria,
    borderRadius: Bordas.raio,
    height: 52,
    marginTop: Espacamento.lg,
    gap: Espacamento.sm,
    ...Sombra.suave,
  },
  btnDesabilitado: { opacity: 0.7 },
  btnSalvarTexto: {
    color: Cores.branco,
    fontSize: Fontes.media,
    fontWeight: Fontes.negrito,
  },
});
