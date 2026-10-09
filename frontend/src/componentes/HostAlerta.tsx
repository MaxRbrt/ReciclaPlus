// Dialogo de alerta usado no navegador, onde o Alert.alert nativo nao existe.
// Montado uma unica vez no layout raiz; no celular nao renderiza nada.

import { useEffect, useState } from 'react';
import {
  AlertButton,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertaPendente, registrarHostAlerta } from '@/servicos/alerta';
import { Bordas, Cores, Espacamento, Fontes, Sombra } from '@/constantes/tema';

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
          <Text style={estilos.titulo}>{alerta.titulo}</Text>
          {alerta.mensagem ? (
            <Text style={estilos.mensagem}>{alerta.mensagem}</Text>
          ) : null}

          <View style={[estilos.botoes, empilhar && estilos.botoesEmpilhados]}>
            {alerta.botoes.map((botao, indice) => (
              <TouchableOpacity
                key={`${indice}-${botao.text}`}
                style={[estilos.botao, !empilhar && estilos.botaoLadoALado]}
                onPress={() => aoEscolher(botao)}
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    estilos.botaoTexto,
                    botao.style === 'destructive' && estilos.botaoTextoDestrutivo,
                    botao.style === 'cancel' && estilos.botaoTextoCancelar,
                  ]}
                >
                  {botao.text ?? 'OK'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Espacamento.lg,
  },
  caixa: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raioGrande,
    padding: Espacamento.lg,
    ...Sombra.forte,
  },
  titulo: {
    fontSize: Fontes.grande,
    fontWeight: Fontes.negrito,
    color: Cores.preto,
  },
  mensagem: {
    fontSize: Fontes.normal,
    color: Cores.cinzaEscuro,
    lineHeight: 20,
    marginTop: Espacamento.sm,
  },
  botoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Espacamento.sm,
    marginTop: Espacamento.lg,
  },
  botoesEmpilhados: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  botao: {
    paddingVertical: Espacamento.sm + 2,
    paddingHorizontal: Espacamento.md,
    borderRadius: Bordas.raio,
    backgroundColor: Cores.cinzaClaro,
    alignItems: 'center',
  },
  botaoLadoALado: {
    minWidth: 96,
  },
  botaoTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.primaria,
  },
  botaoTextoDestrutivo: {
    color: Cores.erro,
  },
  botaoTextoCancelar: {
    color: Cores.cinzaEscuro,
  },
});
