import { ActivityIndicator, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { cores, espaco, raios, sombras, tamanhos } from '@/constantes/tema';
import { Icone, NomeIcone } from './Icone';
import { Pressionavel } from './Pressionavel';
import { Texto } from './Texto';

type VarianteBotao = 'primario' | 'suave' | 'contorno' | 'perigo' | 'perigoSuave';

const VARIANTES: Record<VarianteBotao, { fundo: string; texto: string; borda?: string }> = {
  primario:    { fundo: cores.primaria,   texto: cores.sobreEscuro },
  suave:       { fundo: cores.nevoa,      texto: cores.floresta },
  contorno:    { fundo: cores.superficie, texto: cores.tinta, borda: cores.borda },
  perigo:      { fundo: cores.erro,       texto: cores.sobreEscuro },
  perigoSuave: { fundo: cores.erroFundo,  texto: cores.erro },
};

interface BotaoProps {
  rotulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  icone?: NomeIcone;
  // Compacto: altura menor e largura do conteudo, para acoes dentro de blocos.
  compacto?: boolean;
  carregando?: boolean;
  desabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Botao({
  rotulo,
  onPress,
  variante = 'primario',
  icone,
  compacto = false,
  carregando = false,
  desabilitado = false,
  style,
}: BotaoProps) {
  const { fundo, texto, borda } = VARIANTES[variante];

  return (
    <Pressionavel
      onPress={onPress}
      disabled={desabilitado || carregando}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado || carregando, busy: carregando }}
      style={[
        estilos.base,
        compacto ? estilos.compacto : estilos.cheio,
        variante === 'primario' && !compacto && sombras.baixa,
        { backgroundColor: fundo },
        borda ? { borderWidth: tamanhos.borda, borderColor: borda } : null,
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={texto} />
      ) : (
        <>
          {icone ? <Icone nome={icone} cor={texto} /> : null}
          <Texto variante={compacto ? 'corpoForte' : 'botao'} cor={texto} numberOfLines={1}>
            {rotulo}
          </Texto>
        </>
      )}
    </Pressionavel>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.xs,
    borderRadius: raios.total,
  },
  cheio: {
    minHeight: tamanhos.botao,
    paddingHorizontal: espaco.xl,
  },
  compacto: {
    minHeight: tamanhos.toque,
    paddingHorizontal: espaco.lg,
    alignSelf: 'center',
  },
});
