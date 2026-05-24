// ============================================================
// CONTEXTO: Localizacao
// Gerencia o estado global da localizacao GPS do usuario.
// Disponibiliza para todas as telas:
//   - localizacao: { latitude, longitude } ou null
//   - carregando: true enquanto busca o GPS
//   - erro: mensagem de erro se GPS nao disponivel
//   - atualizarLocalizacao(): solicita nova leitura do GPS
// ============================================================

import React, { createContext, useState, ReactNode } from 'react';
import * as ExpoLocation from 'expo-location';

interface Coordenadas {
  latitude: number;
  longitude: number;
}

interface LocalizacaoContextoTipo {
  localizacao: Coordenadas | null;
  carregando: boolean;
  erro: string | null;
  atualizarLocalizacao: () => Promise<void>;
}

export const LocalizacaoContexto = createContext<LocalizacaoContextoTipo>(
  {} as LocalizacaoContextoTipo
);

export function LocalizacaoProvider({ children }: { children: ReactNode }) {
  const [localizacao, setLocalizacao] = useState<Coordenadas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Solicita permissao e captura localizacao atual
  async function atualizarLocalizacao() {
    setCarregando(true);
    setErro(null);

    // Solicita permissao de localizacao ao usuario
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErro('Permissao de localizacao negada.');
      setCarregando(false);
      return;
    }

    // Captura posicao atual (accuracy: Balanced = boa precisao sem gastar muita bateria)
    const posicao = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });

    setLocalizacao({
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
    });
    setCarregando(false);
  }

  return (
    <LocalizacaoContexto.Provider value={{ localizacao, carregando, erro, atualizarLocalizacao }}>
      {children}
    </LocalizacaoContexto.Provider>
  );
}
