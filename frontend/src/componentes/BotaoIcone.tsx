import { ActivityIndicator, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { cores, raios, sombras, tamanhos } from '@/constantes/tema';
import { Icone, NomeIcone } from './Icone';
import { Pressionavel } from './Pressionavel';

type VarianteBotaoIcone = 'superficie' | 'translucido' | 'simples';

const VARIANTES: Record<VarianteBotaoIcone, { fundo: string; icone: string }> = {
  superficie:  { fundo: cores.superficie, icone: cores.tinta },
  translucido: { fundo: cores.vidro,      icone: cores.sobreEscuro },
  simples:     { fundo: 'transparent',    icone: cores.tintaSuave },
};

interface BotaoIconeProps {
  icone: NomeIcone;
  // Lido por leitores de tela: o botao nao tem texto visivel.
  rotulo: string;
  onPress: () => void;
  variante?: VarianteBotaoIcone;
  cor?: string;
  carregando?: boolean;
  desabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BotaoIcone({
  icone,
  rotulo,
  onPress,
  variante = 'superficie',
  cor,
  carregando = false,
  desabilitado = false,
  style,
}: BotaoIconeProps) {
  const visual = VARIANTES[variante];
  const corIcone = cor ?? visual.icone;

  return (
    <Pressionavel
      onPress={onPress}
      disabled={desabilitado || carregando}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={8}
      style={[
        estilos.botao,
        { backgroundColor: visual.fundo },
        variante === 'superficie' && sombras.baixa,
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={corIcone} />
      ) : (
        <Icone nome={icone} cor={corIcone} />
      )}
    </Pressionavel>
  );
}

const estilos = StyleSheet.create({
  botao: {
    width: tamanhos.toque,
    height: tamanhos.toque,
    borderRadius: raios.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
