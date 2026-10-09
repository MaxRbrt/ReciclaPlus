// Cabecalho verde com folhas, usado no topo das telas. Com "aoVoltar"
// mostra o botao de voltar (telas empilhadas); sem ele, e o topo de uma aba.

import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FORMAS_CABECALHO } from '@/constantes/formas';
import { cores, espaco, raios } from '@/constantes/tema';
import { BotaoIcone } from './BotaoIcone';
import { FundoOrganico } from './FundoOrganico';
import { Texto } from './Texto';

interface CabecalhoTelaProps {
  titulo: string;
  subtitulo?: string | null;
  aoVoltar?: () => void;
  // Entre o voltar e o titulo (ex.: avatar).
  antes?: ReactNode;
  // Abaixo do titulo, ainda dentro do cabecalho (ex.: campo de busca).
  children?: ReactNode;
}

export function CabecalhoTela({
  titulo,
  subtitulo,
  aoVoltar,
  antes,
  children,
}: CabecalhoTelaProps) {
  const margens = useSafeAreaInsets();

  return (
    <View style={[estilos.cabecalho, { paddingTop: margens.top + espaco.md }]}>
      <FundoOrganico formas={FORMAS_CABECALHO} />

      <View style={estilos.linha}>
        {aoVoltar ? (
          <BotaoIcone
            icone="arrow-left"
            rotulo="Voltar"
            variante="translucido"
            onPress={aoVoltar}
          />
        ) : null}
        {antes}
        <View style={estilos.textos}>
          <Texto
            variante={aoVoltar ? 'subtitulo' : 'titulo'}
            cor={cores.sobreEscuro}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {titulo}
          </Texto>
          {subtitulo ? (
            <Texto
              variante={aoVoltar ? 'detalhe' : 'corpo'}
              cor={cores.sobreEscuroSuave}
              numberOfLines={2}
            >
              {subtitulo}
            </Texto>
          ) : null}
        </View>
      </View>

      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    gap: espaco.md,
    paddingHorizontal: espaco.xl,
    paddingBottom: espaco.lg,
    backgroundColor: cores.floresta,
    borderBottomLeftRadius: raios.lg,
    borderBottomRightRadius: raios.lg,
    overflow: 'hidden',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  textos: {
    flex: 1,
    gap: espaco.xxs / 2,
  },
});
