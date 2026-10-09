// Dialogo de alerta usado no navegador, onde o Alert.alert nativo nao existe.
// Montado uma unica vez no layout raiz; no celular nao renderiza nada.

import { useEffect, useState } from 'react';
import { AlertButton, Modal, Platform, StyleSheet, View } from 'react-native';
import { cores, espaco, raios, sombras } from '@/constantes/tema';
import { AlertaPendente, registrarHostAlerta } from '@/servicos/alerta';
import { Botao } from './Botao';
import { Texto } from './Texto';

// Largura maxima do dialogo em telas largas.
const LARGURA_MAXIMA = 360;

export function HostAlerta() {
  // Fila: um alerta aberto dentro do onPress de outro aparece em seguida.
  const [fila, setFila] = useState<AlertaPendente[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    registrarHostAlerta(alerta => setFila(atual => [...atual, alerta]));
    return () => registrarHostAlerta(null);
  }, []);

  const alerta = fila[0];
  if (!alerta) return null;

  function aoEscolher(botao: AlertButton) {
    setFila(atual => atual.slice(1));
    botao.onPress?.();
  }

  // Ate dois botoes ficam lado a lado; listas maiores (ex.: opcoes de foto) empilham.
  const empilhar = alerta.botoes.length > 2;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={estilos.fundo}>
        <View style={estilos.caixa} accessibilityRole="alert">
          <Texto variante="subtitulo">{alerta.titulo}</Texto>
          {alerta.mensagem ? (
            <Texto cor={cores.tintaSuave}>{alerta.mensagem}</Texto>
          ) : null}

          <View style={[estilos.botoes, empilhar && estilos.botoesEmpilhados]}>
            {alerta.botoes.map((botao, indice) => (
              <Botao
                key={`${indice}-${botao.text}`}
                compacto
                variante={
                  botao.style === 'destructive'
                    ? 'perigoSuave'
                    : botao.style === 'cancel'
                      ? 'contorno'
                      : 'suave'
                }
                rotulo={botao.text ?? 'OK'}
                onPress={() => aoEscolher(botao)}
                style={empilhar ? estilos.botaoEmpilhado : estilos.botaoLadoALado}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.veu,
    padding: espaco.xl,
  },
  caixa: {
    width: '100%',
    maxWidth: LARGURA_MAXIMA,
    gap: espaco.xs,
    padding: espaco.xl,
    borderRadius: raios.lg,
    backgroundColor: cores.superficie,
    ...sombras.alta,
  },
  botoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: espaco.xs,
    marginTop: espaco.md,
  },
  botoesEmpilhados: {
    flexDirection: 'column',
  },
  botaoLadoALado: {
    flex: 1,
  },
  botaoEmpilhado: {
    alignSelf: 'stretch',
  },
});
