// Estados de carregando, erro e vazio, iguais em todas as telas.

import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { cores, espaco, raios, tamanhos } from '@/constantes/tema';
import { Botao } from './Botao';
import { Icone, NomeIcone } from './Icone';
import { Texto } from './Texto';

interface AcaoEstado {
  rotulo: string;
  onPress: () => void;
  icone?: NomeIcone;
}

interface EstadoTelaProps {
  // Carregando: mostra o indicador no lugar do icone.
  carregando?: boolean;
  icone?: NomeIcone;
  titulo?: string;
  mensagem?: string | null;
  acao?: AcaoEstado;
  acaoSecundaria?: AcaoEstado;
  // Ocupa e centraliza no espaco livre da tela (em vez de um bloco na pagina).
  preencher?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EstadoTela({
  carregando = false,
  icone,
  titulo,
  mensagem,
  acao,
  acaoSecundaria,
  preencher = false,
  style,
}: EstadoTelaProps) {
  return (
    <View style={[estilos.raiz, preencher && estilos.preencher, style]}>
      {carregando ? (
        <ActivityIndicator size="large" color={cores.primaria} />
      ) : icone ? (
        <View style={estilos.icone}>
          <Icone nome={icone} tamanho={tamanhos.iconeMaior} cor={cores.primaria} />
        </View>
      ) : null}

      {titulo ? (
        <Texto variante="subtitulo" style={estilos.centro}>
          {titulo}
        </Texto>
      ) : null}
      {mensagem ? (
        <Texto cor={cores.tintaSuave} style={estilos.centro}>
          {mensagem}
        </Texto>
      ) : null}

      {acao || acaoSecundaria ? (
        <View style={estilos.acoes}>
          {acaoSecundaria ? (
            <Botao
              compacto
              variante="contorno"
              rotulo={acaoSecundaria.rotulo}
              icone={acaoSecundaria.icone}
              onPress={acaoSecundaria.onPress}
            />
          ) : null}
          {acao ? (
            <Botao
              compacto
              variante="suave"
              rotulo={acao.rotulo}
              icone={acao.icone}
              onPress={acao.onPress}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    alignItems: 'center',
    gap: espaco.xs,
    paddingVertical: espaco.xxl,
    paddingHorizontal: espaco.xl,
  },
  preencher: {
    flex: 1,
    justifyContent: 'center',
  },
  icone: {
    width: tamanhos.toque + espaco.lg,
    height: tamanhos.toque + espaco.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raios.lg,
    borderBottomLeftRadius: raios.sm / 2,
    backgroundColor: cores.nevoa,
    marginBottom: espaco.xxs,
  },
  centro: {
    textAlign: 'center',
  },
  acoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: espaco.xs,
    marginTop: espaco.xs,
  },
});
