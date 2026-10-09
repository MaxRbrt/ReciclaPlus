// Tela de cadastro de ponto.
// Pode receber ?lat=...&lng=... quando aberta a partir do mapa.

import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CabecalhoTela } from '@/componentes/CabecalhoTela';
import { FormularioPonto } from '@/componentes/FormularioPonto';
import { cores } from '@/constantes/tema';
import { alertar } from '@/servicos/alerta';
import { cadastrarPonto } from '@/servicos/pontos';
import { DadosCadastroPonto } from '@/tipos/ponto';

// Parametro de rota (?lat=...&lng=...) para numero; ausente ou invalido vira null.
function lerCoordenada(valor: string | undefined): number | null {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
}

export default function TelaNovoPonto() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();

  // Se a tela veio do mapa, as coordenadas tocadas sao o ponto inicial.
  const latitude = lerCoordenada(params.lat);
  const longitude = lerCoordenada(params.lng);

  async function aoSalvar(dados: DadosCadastroPonto) {
    await cadastrarPonto(dados);
    alertar('Sucesso!', 'Ponto cadastrado com sucesso.', [
      { text: 'OK', onPress: () => router.replace('/(abas)/lista') },
    ]);
  }

  return (
    <View style={estilos.raiz}>
      <CabecalhoTela titulo="Novo Ponto" aoVoltar={() => router.back()} />

      <FormularioPonto
        inicial={{ latitude, longitude }}
        coordenadasDoMapa={latitude !== null && longitude !== null}
        perguntaFoto="Como você quer adicionar a foto?"
        avisoSemLocalizacao="Capture a localização GPS ou selecione um ponto no mapa."
        rotuloSalvar="Cadastrar Ponto"
        iconeSalvar="check"
        erroAoSalvar="Não foi possível cadastrar o ponto. Tente novamente."
        aoSalvar={aoSalvar}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
});
