// ============================================================
// SERVICO: Alertas
// Mesma assinatura do Alert.alert do React Native. No celular usa o
// alerta nativo; no navegador o Alert.alert nao faz nada, entao o
// alerta e entregue ao HostAlerta, que desenha um dialogo na tela.
// ============================================================

import { Alert, AlertButton, AlertOptions, Platform } from 'react-native';

export interface AlertaPendente {
  titulo: string;
  mensagem?: string;
  botoes: AlertButton[];
}

type OuvinteAlerta = (alerta: AlertaPendente) => void;

let ouvinte: OuvinteAlerta | null = null;

// Chamado pelo HostAlerta ao montar/desmontar.
export function registrarHostAlerta(novoOuvinte: OuvinteAlerta | null) {
  ouvinte = novoOuvinte;
}

export function alertar(
  titulo: string,
  mensagem?: string,
  botoes?: AlertButton[],
  opcoes?: AlertOptions
) {
  if (Platform.OS !== 'web' || !ouvinte) {
    Alert.alert(titulo, mensagem, botoes, opcoes);
    return;
  }

  ouvinte({
    titulo,
    mensagem,
    botoes: botoes && botoes.length > 0 ? botoes : [{ text: 'OK' }],
  });
}
