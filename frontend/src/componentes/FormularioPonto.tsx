// Formulario de ponto de coleta, usado por "Novo ponto" e "Editar ponto":
// foto, campos de texto, localizacao GPS, categorias e validacao.
// A tela so decide os valores iniciais e o que fazer com os dados validos.

import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { cores, espaco, raios, tamanhos } from '@/constantes/tema';
import { alertar } from '@/servicos/alerta';
import { mensagemErroApi } from '@/servicos/api';
import {
  capturarFotoPonto,
  escolherFotoPontoDaGaleria,
  resolverFotoParaSalvar,
} from '@/servicos/fotoPonto';
import { preencherEnderecoSeVazio } from '@/servicos/localizacao';
import { DadosCadastroPonto } from '@/tipos/ponto';
import { Botao } from './Botao';
import { BotaoIcone } from './BotaoIcone';
import { CampoTexto } from './CampoTexto';
import { FotoPontoInput } from './FotoPontoInput';
import { Icone, NomeIcone } from './Icone';
import { Pressionavel } from './Pressionavel';
import { SelecionadorCategorias } from './SelecionadorCategorias';
import { Texto } from './Texto';

export interface ValoresIniciaisPonto {
  nome?: string;
  descricao?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  horario?: string;
  fotoUri?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categorias?: number[];
}

interface FormularioPontoProps {
  inicial?: ValoresIniciaisPonto;
  // As coordenadas iniciais foram escolhidas no mapa: aparecem como
  // "Selecionado no mapa" e ja preenchem endereco, bairro e cidade.
  coordenadasDoMapa?: boolean;
  // Editando um ponto que ja tem foto: oferece tambem "Remover foto".
  permiteRemoverFoto?: boolean;
  perguntaFoto: string;
  avisoSemLocalizacao: string;
  // Texto sob as coordenadas quando ja ha localizacao.
  ajudaLocalizacao?: string;
  rotuloSalvar: string;
  iconeSalvar: NomeIcone;
  // Mensagem do alerta quando o envio falha sem explicacao da API.
  erroAoSalvar: string;
  // Recebe os dados ja validados; a foto ja foi enviada.
  aoSalvar: (dados: DadosCadastroPonto) => Promise<void>;
}

export function FormularioPonto({
  inicial = {},
  coordenadasDoMapa = false,
  permiteRemoverFoto = false,
  perguntaFoto,
  avisoSemLocalizacao,
  ajudaLocalizacao,
  rotuloSalvar,
  iconeSalvar,
  erroAoSalvar,
  aoSalvar,
}: FormularioPontoProps) {
  const [nome, setNome] = useState(inicial.nome ?? '');
  const [descricao, setDescricao] = useState(inicial.descricao ?? '');
  const [endereco, setEndereco] = useState(inicial.endereco ?? '');
  const [bairro, setBairro] = useState(inicial.bairro ?? '');
  const [cidade, setCidade] = useState(inicial.cidade ?? '');
  const [horario, setHorario] = useState(inicial.horario ?? '');
  const [fotoUri, setFotoUri] = useState<string | null>(inicial.fotoUri ?? null);
  const [latitude, setLatitude] = useState<number | null>(inicial.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(inicial.longitude ?? null);
  const [categorias, setCategorias] = useState<number[]>(inicial.categorias ?? []);
  const [salvando, setSalvando] = useState(false);
  const [pegandoGPS, setPegandoGPS] = useState(false);

  // Coordenadas vindas do mapa tambem pre-preenchem endereco e bairro.
  const latitudeDoMapa = coordenadasDoMapa ? inicial.latitude ?? null : null;
  const longitudeDoMapa = coordenadasDoMapa ? inicial.longitude ?? null : null;
  useEffect(() => {
    if (latitudeDoMapa !== null && longitudeDoMapa !== null) {
      preencherEnderecoSeVazio(
        latitudeDoMapa,
        longitudeDoMapa,
        setEndereco,
        setBairro,
        setCidade
      );
    }
  }, [latitudeDoMapa, longitudeDoMapa]);

  function alternarCategoria(id: number) {
    setCategorias(atuais =>
      atuais.includes(id) ? atuais.filter(atual => atual !== id) : [...atuais, id]
    );
  }

  // Mantem camera e galeria como opcoes explicitas para o usuario.
  function aoTocarFoto() {
    alertar(
      'Foto do ponto',
      perguntaFoto,
      [
        { text: 'Tirar foto', onPress: capturarComCamera },
        { text: 'Escolher da galeria', onPress: escolherDaGaleria },
        ...(permiteRemoverFoto
          ? [
              {
                text: 'Remover foto',
                style: 'destructive' as const,
                onPress: () => setFotoUri(null),
              },
            ]
          : []),
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

  // Devolve o aviso do primeiro problema encontrado, ou null se esta tudo certo.
  function problemaNoFormulario(): [titulo: string, mensagem: string] | null {
    if (!nome.trim()) return ['Campos obrigatórios', 'Informe o nome do ponto.'];
    if (!endereco.trim()) return ['Campos obrigatórios', 'Informe o endereço.'];
    if (!bairro.trim()) return ['Campos obrigatórios', 'Informe o bairro.'];
    if (!cidade.trim()) return ['Campos obrigatórios', 'Informe a cidade.'];
    if (latitude === null || longitude === null) {
      return ['Localização', avisoSemLocalizacao];
    }
    if (categorias.length === 0) {
      return ['Categorias', 'Selecione ao menos uma categoria.'];
    }
    return null;
  }

  async function aoEnviar() {
    const problema = problemaNoFormulario();
    if (problema || latitude === null || longitude === null) {
      if (problema) alertar(problema[0], problema[1]);
      return;
    }

    setSalvando(true);
    try {
      // A foto sobe primeiro; o ponto guarda so o caminho devolvido pela API.
      const fotoUrl = await resolverFotoParaSalvar(fotoUri);
      await aoSalvar({
        nome: nome.trim(),
        descricao: descricao.trim(),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        latitude,
        longitude,
        fotoUrl,
        horarioFuncionamento: horario.trim(),
        categoriaIds: categorias,
      });
    } catch (erro) {
      alertar('Erro', mensagemErroApi(erro, erroAoSalvar));
    } finally {
      setSalvando(false);
    }
  }

  const temLocalizacao = latitude !== null && longitude !== null;
  const coordenadas = temLocalizacao
    ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    : null;
  // Enquanto o usuario nao trocar o local, ele ainda e o escolhido no mapa.
  const aindaDoMapa =
    coordenadasDoMapa &&
    latitude === (inicial.latitude ?? null) &&
    longitude === (inicial.longitude ?? null);

  return (
    <ScrollView
      contentContainerStyle={estilos.conteudo}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FotoPontoInput fotoUri={fotoUri} onPress={aoTocarFoto} />

      <CampoTexto
        rotulo="Nome do ponto *"
        value={nome}
        onChangeText={setNome}
        placeholder="Ex: Ecoponto Centro"
      />
      <CampoTexto
        rotulo="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Informações adicionais sobre o ponto..."
        multiline
        numberOfLines={3}
      />
      <CampoTexto
        rotulo="Endereço *"
        value={endereco}
        onChangeText={setEndereco}
        placeholder="Rua, número"
      />
      <CampoTexto
        rotulo="Bairro *"
        value={bairro}
        onChangeText={setBairro}
        placeholder="Nome do bairro"
      />
      <CampoTexto
        rotulo="Cidade *"
        value={cidade}
        onChangeText={setCidade}
        placeholder="Nome da cidade"
      />
      <CampoTexto
        rotulo="Horário de funcionamento"
        value={horario}
        onChangeText={setHorario}
        placeholder="Ex: Seg a Sex, 08:00 - 18:00"
      />

      <View style={estilos.grupo}>
        <Texto variante="corpoForte">Localização GPS *</Texto>

        {aindaDoMapa && coordenadas ? (
          <View style={[estilos.gps, estilos.gpsAtivo]}>
            <Icone nome="map-marker-check" cor={cores.primaria} />
            <View style={estilos.gpsTextos}>
              <Texto variante="rotulo" cor={cores.tintaSuave}>
                Selecionado no mapa
              </Texto>
              <Texto variante="corpoForte" cor={cores.floresta}>
                {coordenadas}
              </Texto>
            </View>
            <BotaoIcone
              icone="crosshairs-gps"
              rotulo="Usar minha localização atual"
              variante="simples"
              cor={cores.primaria}
              carregando={pegandoGPS}
              onPress={aoCapturarGPS}
            />
          </View>
        ) : (
          <Pressionavel
            style={[estilos.gps, temLocalizacao && estilos.gpsAtivo]}
            escala={0.98}
            onPress={aoCapturarGPS}
            disabled={pegandoGPS}
            accessibilityRole="button"
          >
            {pegandoGPS ? (
              <ActivityIndicator size="small" color={cores.primaria} />
            ) : (
              <Icone
                nome="crosshairs-gps"
                cor={temLocalizacao ? cores.primaria : cores.tintaFraca}
              />
            )}
            <View style={estilos.gpsTextos}>
              <Texto
                variante={temLocalizacao ? 'corpoForte' : 'corpo'}
                cor={temLocalizacao ? cores.floresta : cores.tintaSuave}
              >
                {coordenadas ?? 'Capturar localização atual'}
              </Texto>
              {temLocalizacao && ajudaLocalizacao ? (
                <Texto variante="detalhe" cor={cores.tintaSuave}>
                  {ajudaLocalizacao}
                </Texto>
              ) : null}
            </View>
          </Pressionavel>
        )}
      </View>

      <View style={estilos.grupo}>
        <Texto variante="corpoForte">Materiais aceitos *</Texto>
        <SelecionadorCategorias
          selecionadas={categorias}
          aoAlternar={alternarCategoria}
        />
      </View>

      <Botao
        rotulo={rotuloSalvar}
        icone={iconeSalvar}
        carregando={salvando}
        onPress={aoEnviar}
        style={estilos.salvar}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    gap: espaco.md,
    padding: espaco.xl,
    paddingBottom: espaco.xxxl,
  },
  grupo: {
    gap: espaco.xs,
  },
  gps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: tamanhos.botao,
    paddingVertical: espaco.xs,
    paddingLeft: espaco.md,
    paddingRight: espaco.xxs,
    borderRadius: raios.md,
    borderWidth: tamanhos.borda,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  gpsAtivo: {
    borderColor: cores.primaria,
    backgroundColor: cores.nevoa,
  },
  gpsTextos: {
    flex: 1,
    gap: espaco.xxs / 2,
  },
  salvar: {
    marginTop: espaco.xs,
  },
});
