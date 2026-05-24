// ============================================================
// TELA: Cadastrar Novo Ponto — VERSAO COM CAMERA + PRE-FILL
// Rota: /ponto/novo
//   query params opcionais: ?lat=...&lng=...
//
// NOVIDADES:
//   1. Pre-preenche latitude/longitude se vier do mapa
//      (tela /(abas)/mapa.tsx passa as coords ao tocar).
//   2. Botao de foto agora oferece 3 opcoes via Alert:
//        - Tirar foto (camera ao vivo, NECESSARIO para o trabalho)
//        - Escolher da galeria
//        - Cancelar
//      Cada caminho pede sua propria permissao.
//   3. Pre-visualizacao da foto com botao para trocar.
//
// PERMISSOES no app.json:
//   plugin expo-image-picker injeta camera+photos permissions.
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
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { cadastrarPonto } from '@/servicos/pontos';
import { CATEGORIAS } from '@/constantes/categorias';
import { Cores, Fontes, Espacamento, Bordas, Sombra } from '@/constantes/tema';

export default function TelaNovoPonto() {
  // Le coords opcionais vindas do mapa (?lat=...&lng=...)
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [horario, setHorario] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [pegandoGPS, setPegandoGPS] = useState(false);

  // Pre-preenche coordenadas ao montar (se vier do mapa)
  useEffect(() => {
    if (params.lat && params.lng) {
      const lat = Number(params.lat);
      const lng = Number(params.lng);
      // So aplica se forem numeros validos
      if (!isNaN(lat) && !isNaN(lng)) {
        setLatitude(lat);
        setLongitude(lng);
      }
    }
  }, [params.lat, params.lng]);

  function toggleCategoria(id: number) {
    setCategorias(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  // ========================================
  // FOTO: 3 opcoes (camera / galeria / cancelar)
  // ========================================

  // Abre Alert com as opcoes. Atende exigencia do trabalho:
  // usuario pode tirar foto AO VIVO no local do ponto.
  function aoTocarFoto() {
    Alert.alert(
      'Foto do ponto',
      'Como voce quer adicionar a foto?',
      [
        { text: 'Tirar foto', onPress: capturarComCamera },
        { text: 'Escolher da galeria', onPress: escolherDaGaleria },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }

  // --- Camera ao vivo ---
  async function capturarComCamera() {
    // Pede permissao especifica de camera (diferente de galeria)
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        'Permissao negada',
        'Permita acesso a camera nas configuracoes do app.'
      );
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

  // --- Galeria ---
  async function escolherDaGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        'Permissao negada',
        'Permita acesso a galeria nas configuracoes do app.'
      );
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

  // ========================================
  // GPS atual (botao se quiser re-capturar)
  // ========================================
  async function aoCapturarGPS() {
    setPegandoGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissao negada',
          'Permita acesso a localizacao nas configuracoes.'
        );
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
    if (!latitude || !longitude) {
      Alert.alert(
        'Localizacao',
        'Capture a localizacao GPS ou selecione um ponto no mapa.'
      );
      return false;
    }
    if (categorias.length === 0) {
      Alert.alert('Categorias', 'Selecione ao menos uma categoria.');
      return false;
    }
    return true;
  }

  async function aoSalvar() {
    if (!validar()) return;
    setSalvando(true);
    try {
      await cadastrarPonto({
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
      Alert.alert('Sucesso!', 'Ponto cadastrado com sucesso.', [
        { text: 'OK', onPress: () => router.replace('/(abas)/lista') },
      ]);
    } catch {
      Alert.alert(
        'Erro',
        'Nao foi possivel cadastrar o ponto. Tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  }

  // Indica se as coordenadas vieram via tap no mapa
  const coordsVemDoMapa = Boolean(params.lat && params.lng);

  return (
    <View style={estilos.raiz}>
      {/* Header */}
      <View style={estilos.header}>
        <TouchableOpacity
          style={estilos.voltarBtn}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={Cores.branco}
          />
        </TouchableOpacity>
        <Text style={estilos.headerTitulo}>Novo Ponto</Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================ */}
        {/* FOTO — tirar com camera ou escolher galeria  */}
        {/* ============================================ */}
        <TouchableOpacity
          style={estilos.fotoArea}
          onPress={aoTocarFoto}
          activeOpacity={0.85}
        >
          {fotoUri ? (
            <>
              <Image source={{ uri: fotoUri }} style={estilos.fotoImagem} />
              {/* Overlay com botao de trocar */}
              <View style={estilos.fotoOverlay}>
                <View style={estilos.fotoBadge}>
                  <MaterialCommunityIcons
                    name="camera-retake"
                    size={16}
                    color={Cores.branco}
                  />
                  <Text style={estilos.fotoBadgeTexto}>Trocar foto</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={estilos.fotoPlaceholder}>
              <View style={estilos.fotoIconRow}>
                <MaterialCommunityIcons
                  name="camera"
                  size={28}
                  color={Cores.primaria}
                />
                <Text style={estilos.fotoSeparador}>ou</Text>
                <MaterialCommunityIcons
                  name="image-multiple"
                  size={28}
                  color={Cores.primaria}
                />
              </View>
              <Text style={estilos.fotoTitulo}>Adicionar foto do ponto</Text>
              <Text style={estilos.fotoSub}>
                Toque para tirar uma foto ou escolher da galeria
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Campos */}
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

        {/* ============================================ */}
        {/* GPS — destaque se veio do mapa               */}
        {/* ============================================ */}
        <View style={estilos.grupo}>
          <Text style={estilos.label}>Localizacao GPS *</Text>

          {coordsVemDoMapa && latitude ? (
            // Caso 1: coords vieram do mapa — mostra info + opcao recapturar
            <View style={[estilos.btnGPS, estilos.btnGPSAtivo]}>
              <MaterialCommunityIcons
                name="map-marker-check"
                size={20}
                color={Cores.primaria}
              />
              <View style={{ flex: 1 }}>
                <Text style={estilos.gpsLabelOrigem}>
                  Selecionado no mapa
                </Text>
                <Text style={estilos.btnGPSTextoAtivo}>
                  {latitude.toFixed(5)}, {longitude!.toFixed(5)}
                </Text>
              </View>
              <TouchableOpacity onPress={aoCapturarGPS} hitSlop={8}>
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={20}
                  color={Cores.primaria}
                />
              </TouchableOpacity>
            </View>
          ) : (
            // Caso 2: sem coords — botao para capturar GPS atual
            <TouchableOpacity
              style={[estilos.btnGPS, latitude ? estilos.btnGPSAtivo : null]}
              onPress={aoCapturarGPS}
              disabled={pegandoGPS}
              activeOpacity={0.85}
            >
              {pegandoGPS ? (
                <ActivityIndicator
                  size="small"
                  color={latitude ? Cores.primaria : Cores.cinzaMedio}
                />
              ) : (
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={20}
                  color={latitude ? Cores.primaria : Cores.cinzaMedio}
                />
              )}
              <Text
                style={[
                  estilos.btnGPSTexto,
                  latitude ? { color: Cores.primaria } : null,
                ]}
              >
                {latitude
                  ? `${latitude.toFixed(5)}, ${longitude!.toFixed(5)}`
                  : 'Capturar localizacao atual'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categorias */}
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
                    selecionado && {
                      backgroundColor: cat.cor,
                      borderColor: cat.cor,
                    },
                  ]}
                  onPress={() => toggleCategoria(cat.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={cat.icone as any}
                    size={16}
                    color={selecionado ? Cores.branco : cat.cor}
                  />
                  <Text
                    style={[
                      estilos.catChipTexto,
                      selecionado && { color: Cores.branco },
                    ]}
                  >
                    {cat.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botao salvar */}
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
              <MaterialCommunityIcons
                name="check"
                size={20}
                color={Cores.branco}
              />
              <Text style={estilos.btnSalvarTexto}>Cadastrar Ponto</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Cores.cinzaClaro },

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
  headerTitulo: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.negrito,
    color: Cores.branco,
  },

  scroll: { padding: Espacamento.lg, paddingBottom: Espacamento.xxl },

  // ----- Foto -----
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
  fotoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
  },
  fotoSeparador: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    fontWeight: Fontes.medio_peso,
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

  // ----- Campos -----
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

  // ----- GPS -----
  btnGPS: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.branco,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raio,
    paddingHorizontal: Espacamento.md,
    minHeight: 48,
    paddingVertical: 6,
  },
  btnGPSAtivo: {
    borderColor: Cores.primaria,
    backgroundColor: Cores.primariaFundo,
  },
  btnGPSTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    flex: 1,
  },
  btnGPSTextoAtivo: {
    fontSize: Fontes.normal,
    color: Cores.primaria,
    fontWeight: Fontes.negrito,
  },
  gpsLabelOrigem: {
    fontSize: 10,
    color: Cores.cinzaMedio,
    fontWeight: Fontes.muitoNegrito,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ----- Categorias -----
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

  // ----- Botao salvar -----
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
