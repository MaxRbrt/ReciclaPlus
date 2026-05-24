// ============================================================
// CONTEXTO: Autenticacao
// Gerencia o estado global do usuario logado.
// Disponibiliza para todas as telas:
//   - usuario: dados do usuario logado (ou null se deslogado)
//   - carregando: true enquanto verifica se ha sessao salva
//   - entrar(): realiza o login
//   - sair(): realiza o logout
//
// Como usar nas telas:
//   const { usuario, entrar, sair } = useContext(AutenticacaoContexto);
// Ou usar o hook useAutenticacao() que ja faz isso.
// ============================================================

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, DadosLogin } from '@/tipos/usuario';
import * as servicoAuth from '@/servicos/autenticacao';
import { registrarAoNaoAutorizado } from '@/servicos/api';

// Define o formato do contexto (o que vai estar disponivel nas telas)
interface AutenticacaoContextoTipo {
  usuario: Usuario | null;   // null = nao logado
  carregando: boolean;       // true = ainda verificando sessao salva
  entrar: (dados: DadosLogin) => Promise<void>;
  sair: () => Promise<void>;
}

// Cria o contexto com valor padrao vazio
export const AutenticacaoContexto = createContext<AutenticacaoContextoTipo>(
  {} as AutenticacaoContextoTipo
);

// Provider: envolve o app inteiro e fornece o estado de autenticacao
export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Ao iniciar o app, verifica se ja existe sessao salva no AsyncStorage
  useEffect(() => {
    async function verificarSessao() {
      const usuarioSalvo = await servicoAuth.recuperarUsuarioLocal();
      setUsuario(usuarioSalvo);
      setCarregando(false);
    }
    verificarSessao();
  }, []);

  useEffect(() => {
    registrarAoNaoAutorizado(() => setUsuario(null));
    return () => registrarAoNaoAutorizado(null);
  }, []);

  // Realiza login: chama a API, salva dados e atualiza o estado
  async function entrar(dados: DadosLogin) {
    const resposta = await servicoAuth.entrar(dados);
    setUsuario(resposta.usuario);
  }

  // Realiza logout: limpa AsyncStorage e zera o estado
  async function sair() {
    await servicoAuth.sair();
    setUsuario(null);
  }

  return (
    <AutenticacaoContexto.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AutenticacaoContexto.Provider>
  );
}
