// Tela de edicao de ponto.
// Somente quem cadastrou o ponto pode editar (a API tambem valida).

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
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { buscarPonto, atualizarPonto } from '@/servicos/pontos';
import { mensagemErroApi } from '@/servicos/api';
import { CamposFormularioPonto } from '@/componentes/CamposFormularioPonto';
import { FotoPontoInput } from '@/componentes/FotoPontoInput';
import { SelecionadorCategorias } from '@/componentes/SelecionadorCategorias';
import {
  capturarFotoPonto,
  escolherFotoPontoDaGaleria,
  montarUrlFoto,
  resolverFotoParaSalvar,
} from '@/servicos/fotoPonto';
import { preencherEnderecoSeVazio } from '@/servicos/localizacao';
import { Cores, Fontes, Espacamento, Bordas, Sombra } from '@/constantes/tema';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { Ponto } from '@/tipos/ponto';
import { alertar } from '@/servicos/alerta';

export default function TelaEditarPonto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAutenticacao();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [pegandoGPS, setPegandoGPS] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pontoOriginal, setPontoOriginal] = useState<Ponto | null>(null);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [horario, setHorario] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<number[]>([]);

  // Copia o dado da API para os campos editaveis.
  function preencherFormulario(ponto: Ponto) {
    setNome(ponto.nome ?? '');
    setDescricao(ponto.descricao ?? '');
    setEndereco(ponto.endereco ?? '');
    setBairro(ponto.bairro ?? '');
    setCidade(ponto.cidade ?? '');
    setHorario(ponto.horarioFuncionamento ?? '');
    setFotoUri(montarUrlFoto(ponto.fotoUrl));
    setLatitude(Number(ponto.latitude));
    setLongitude(Number(ponto.longitude));
    setCategorias(ponto.categorias?.map(cat => cat.id) ?? []);
  }

  useEffect(() => {
    let ativo = true;

    async function carregarPonto() {
      setCarregando(true);
      setErro(null);

      try {
        const dados = await buscarPonto(Number(id));
        if (!ativo) return;

        if (dados.usuarioId !== usuario?.id) {
          setErro('Apenas quem cadastrou este ponto pode editá-lo.');
          return;
        }

        setPontoOriginal(dados);
        preencherFormulario(dados);
      } catch {
        if (ativo) {
          setErro('Não foi possível carregar os dados deste ponto.');
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

  function toggleCategoria(idCategoria: number) {
    setCategorias(prev =>
      prev.includes(idCategoria)
        ? prev.filter(idAtual => idAtual !== idCategoria)
        : [...prev, idCategoria]
    );
  }

  function aoTocarFoto() {
    alertar(
      'Foto do ponto',
      'Como você quer atualizar a foto?',
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
        alertar('Permissão negada', 'Permita acesso à localização nas configurações.');
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
    if (latitude === null || longitude === null) {
      alertar('Localização', 'Capture a localização GPS do ponto.');
      return false;
    }
    if (categorias.length === 0) {
      alertar('Categorias', 'Selecione ao menos uma categoria.');
      return false;
    }
    return true;
  }

  async function aoSalvar() {
    if (!pontoOriginal || !validar()) return;

    setSalvando(true);
    try {
      // Foto nova sobe primeiro; foto ja enviada mantem o mesmo caminho.
      const fotoUrl = await resolverFotoParaSalvar(fotoUri);
      await atualizarPonto(pontoOriginal.id, {
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

      alertar('Sucesso!', 'Ponto atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.replace(`/ponto/${pontoOriginal.id}`) },
      ]);
    } catch (erro) {
      alertar(
        'Erro',
        mensagemErroApi(erro, 'Não foi possível atualizar o ponto. Tente novamente.')
      );
    } finally {
      setSalvando(false);
    }
  }

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
        <Text style={estilos.estadoTitulo}>Não foi possível editar</Text>
        <Text style={estilos.estadoTexto}>{erro}</Text>
        <TouchableOpacity style={estilos.btnVoltarErro} onPress={() => router.back()}>
          <Text style={estilos.btnVoltarErroTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.raiz}>
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
                  : 'Capturar localização atual'}
              </Text>
              {latitude !== null && longitude !== null ? (
                <Text style={estilos.gpsAjuda}>Toque para substituir pela sua localização atual</Text>
              ) : null}
            </View>
          </TouchableOpacity>
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
              <MaterialCommunityIcons name="content-save" size={20} color={Cores.branco} />
              <Text style={estilos.btnSalvarTexto}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

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
