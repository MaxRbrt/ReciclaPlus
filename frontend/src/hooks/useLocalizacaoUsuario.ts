// ============================================================
// HOOK: useLocalizacaoUsuario
// Posicao do usuario e a cidade onde ele esta, para mostrar distancias
// e os pontos de coleta proximos. Ambos ficam null enquanto carregam,
// se a permissao for negada ou se a cidade nao puder ser identificada.
// ============================================================

import { useEffect, useState } from 'react';
import {
  Coordenadas,
  obterCidadeDaPosicao,
  obterPosicaoUsuario,
} from '@/servicos/localizacao';

interface LocalizacaoUsuario {
  posicao: Coordenadas | null;
  cidade: string | null;
}

export function useLocalizacaoUsuario(): LocalizacaoUsuario {
  const [localizacao, setLocalizacao] = useState<LocalizacaoUsuario>({
    posicao: null,
    cidade: null,
  });

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const posicao = await obterPosicaoUsuario();
      if (!ativo || !posicao) return;
      // A distancia ja pode aparecer enquanto a cidade ainda e consultada.
      setLocalizacao({ posicao, cidade: null });

      const cidade = await obterCidadeDaPosicao(posicao);
      if (ativo && cidade) setLocalizacao({ posicao, cidade });
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  return localizacao;
}
