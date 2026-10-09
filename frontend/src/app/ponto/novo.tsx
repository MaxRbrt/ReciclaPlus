// Tela de cadastro de ponto.
// Pode receber ?lat=...&lng=... quando aberta a partir do mapa.

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { cadastrarPonto } from '@/servicos/pontos';
import { mensagemErroApi } from '@/servicos/api';
import { CamposFormularioPonto } from '@/componentes/CamposFormularioPonto';
import { FotoPontoInput } from '@/componentes/FotoPontoInput';
import { SelecionadorCategorias } from '@/componentes/SelecionadorCategorias';
import {
  capturarFotoPonto,
  escolherFotoPontoDaGaleria,
  resolverFotoParaSalvar,
} from '@/servicos/fotoPonto';
import { preencherEnderecoSeVazio } from '@/servicos/localizacao';
import { Cores, Fontes, Espacamento, Bordas, Sombra } from '@/constantes/tema';
import { alertar } from '@/servicos/alerta';

// Parametro de rota (?lat=...&lng=...) para numero; ausente ou invalido vira null.
function lerCoordenada(valor: string | undefined): number | null {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
}

export default function TelaNovoPonto() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [horario, setHorario] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  // Se a tela veio do mapa, as coordenadas tocadas sao o ponto inicial.
  const [latitude, setLatitude] = useState<number | null>(() => lerCoordenada(params.lat));
  const [longitude, setLongitude] = useState<number | null>(() => lerCoordenada(params.lng));
  const [categorias, setCategorias] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [pegandoGPS, setPegandoGPS] = useState(false);

  // Coordenadas vindas do mapa tambem pre-preenchem endereco e bairro.
  useEffect(() => {
    const lat = lerCoordenada(params.lat);
    const lng = lerCoordenada(params.lng);
    if (lat !== null && lng !== null) {
      preencherEnderecoSeVazio(lat, lng, setEndereco, setBairro, setCidade);
    }
  }, [params.lat, params.lng]);

  function toggleCategoria(id: number) {
    setCategorias(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  // Mantem camera e galeria como opcoes explicitas para o usuario.
  function aoTocarFoto() {
    alertar(
      'Foto do ponto',
      'Como você quer adicionar a foto?',
      [
        { text: 'Tirar foto', onPress: capturarComCamera },
        { text: 'Escolher da galeria', onPress: escolherDaGaleria },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }

  async function capturarComCamera() {
    const uri = await capturarFotoPonto();
    if (uri) setFotoUri(uri);
  }

  async function escolherDaGaleria() {
    const uri = await escolherFotoPontoDaGaleria();
    if (uri) setFotoUri(uri);
  }

  async function aoCapturarGPS() {
    setPegandoGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alertar(
          'Permissão negada',
          'Permita acesso à localização nas configurações.'
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      await preencherEnderecoSeVazio(
        loc.coords.latitude,
        loc.coords.longitude,
        setEndereco,
        setBairro,
        setCidade
      );
    } catch {
      alertar('Erro', 'Não foi possível obter a localização.');
    } finally {
      setPegandoGPS(false);
    }
  }

  function validar(): boolean {
    if (!nome.trim()) {
      alertar('Campos obrigatórios', 'Informe o nome do ponto.');
      return false;
    }
    if (!endereco.trim()) {
      alertar('Campos obrigatórios', 'Informe o endereço.');
      return false;
    }
    if (!bairro.trim()) {
      alertar('Campos obrigatórios', 'Informe o bairro.');
      return false;
    }
    if (!cidade.trim()) {
      alertar('Campos obrigatórios', 'Informe a cidade.');
      return false;
    }
    if (!latitude || !longitude) {
      alertar(
        'Localização',
        'Capture a localização GPS ou selecione um ponto no mapa.'
      );
      return false;
    }
    if (categorias.length === 0) {
      alertar('Categorias', 'Selecione ao menos uma categoria.');
      return false;
    }
    return true;
  }

  async function aoSalvar() {
    if (!validar()) return;
    setSalvando(true);
    try {
      // A foto sobe primeiro; o ponto guarda so o caminho devolvido pela API.
      const fotoUrl = await resolverFotoParaSalvar(fotoUri);
      await cadastrarPonto({
        nome: nome.trim(),
        descricao: descricao.trim(),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        latitude: latitude!,
        longitude: longitude!,
        fotoUrl,
        horarioFuncionamento: horario.trim(),
        categoriaIds: categorias,
      });
      alertar('Sucesso!', 'Ponto cadastrado com sucesso.', [
        { text: 'OK', onPress: () => router.replace('/(abas)/lista') },
      ]);
    } catch (erro) {
      alertar(
        'Erro',
        mensagemErroApi(erro, 'Não foi possível cadastrar o ponto. Tente novamente.')
      );
    } finally {
      setSalvando(false);
    }
  }

  const coordsVemDoMapa = Boolean(params.lat && params.lng);

  return (
    <View style={estilos.raiz}>
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
        <FotoPontoInput fotoUri={fotoUri} onPress={aoTocarFoto} />

        <CamposFormularioPonto
          nome={nome}
          descricao={descricao}
          endereco={endereco}
          bairro={bairro}
          cidade={cidade}
          horario={horario}
          setNome={setNome}
          setDescricao={setDescricao}
          setEndereco={setEndereco}
          setBairro={setBairro}
          setCidade={setCidade}
          setHorario={setHorario}
        />

        <View style={estilos.grupo}>
          <Text style={estilos.label}>Localização GPS *</Text>

          {coordsVemDoMapa && latitude ? (
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
                  : 'Capturar localização atual'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={estilos.grupo}>
          <Text style={estilos.label}>Materiais aceitos *</Text>
          <SelecionadorCategorias
            selecionadas={categorias}
            aoAlternar={toggleCategoria}
          />
        </View>

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

  grupo: { marginBottom: Espacamento.md },
  label: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
    marginBottom: Espacamento.xs,
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
