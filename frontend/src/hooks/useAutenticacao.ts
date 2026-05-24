// ============================================================
// HOOK: useAutenticacao
// Atalho para acessar o AutenticacaoContexto nas telas.
// Em vez de: useContext(AutenticacaoContexto)
// Usar:       useAutenticacao()
// ============================================================

import { useContext } from 'react';
import { AutenticacaoContexto } from '@/contextos/AutenticacaoContexto';

export function useAutenticacao() {
  return useContext(AutenticacaoContexto);
}
