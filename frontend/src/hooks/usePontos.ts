// ============================================================
// HOOK: usePontos
// Gerencia o estado da lista de pontos de coleta.
// Encapsula a logica de busca, loading e erro.
// Usado nas telas: lista.tsx, mapa.tsx
//
// Exemplo de uso:
//   const { pontos, carregando, erro, recarregar } = usePontos();
// ============================================================

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ponto } from '@/tipos/ponto';
import { listarPontos } from '@/servicos/pontos';

interface UsePontosResultado {
  pontos: Ponto[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
}

export function usePontos(categoriaId?: number): UsePontosResultado {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarPontos(categoriaId);
      setPontos(dados);
    } catch {
      setErro('Nao foi possivel carregar os pontos. Verifique sua conexao.');
    } finally {
      setCarregando(false);
    }
  }, [categoriaId]);

  // Recarrega ao abrir a tela para refletir novos pontos e filtros recentes
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return { pontos, carregando, erro, recarregar: carregar };
}
