// ============================================================
// TELA: Entrar (Login)
// Rota: /(auth)/entrar
// ============================================================

import { useState } from 'react';
import { router } from 'expo-router';
import { Botao } from '@/componentes/Botao';
import { CampoTexto } from '@/componentes/CampoTexto';
import { TelaAutenticacao } from '@/componentes/TelaAutenticacao';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { alertar } from '@/servicos/alerta';
import { mensagemErroApi } from '@/servicos/api';

export default function TelaEntrar() {
  const { entrar } = useAutenticacao();

  const [email, setEmail]             = useState('');
  const [senha, setSenha]             = useState('');
  const [carregando, setCarregando]   = useState(false);
  const [erroEmail, setErroEmail]     = useState('');
  const [erroSenha, setErroSenha]     = useState('');

  function validar(): boolean {
    let valido = true;
    setErroEmail('');
    setErroSenha('');

    if (!email.trim()) {
      setErroEmail('Informe seu e-mail.');
      valido = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErroEmail('E-mail inválido.');
      valido = false;
    }

    if (!senha) {
      setErroSenha('Informe sua senha.');
      valido = false;
    } else if (senha.length < 6) {
      setErroSenha('Senha deve ter ao menos 6 caracteres.');
      valido = false;
    }

    return valido;
  }

  async function aoEntrar() {
    if (!validar()) return;

    setCarregando(true);
    try {
      await entrar({ email: email.trim().toLowerCase(), senha });
      router.replace('/(abas)');
    } catch (erro) {
      // A API explica o motivo (senha errada, muitas tentativas). Sem resposta
      // dela, o problema e de conexao e nao de credencial.
      alertar(
        'Erro ao entrar',
        mensagemErroApi(
          erro,
          'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
        )
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAutenticacao
      frase="Encontre pontos de coleta perto de você"
      titulo="Entrar"
      pergunta="Não tem conta?"
      rotuloLink="Cadastre-se"
      aoTocarLink={() => router.push('/(auth)/cadastrar')}
    >
      <CampoTexto
        rotulo="E-mail"
        icone="email-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        erro={erroEmail}
      />
      <CampoTexto
        rotulo="Senha"
        icone="lock-outline"
        value={senha}
        onChangeText={setSenha}
        placeholder="Sua senha"
        senha
        autoCapitalize="none"
        erro={erroSenha}
      />

      <Botao rotulo="Entrar" carregando={carregando} onPress={aoEntrar} />
    </TelaAutenticacao>
  );
}
