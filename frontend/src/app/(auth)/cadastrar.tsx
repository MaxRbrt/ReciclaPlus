// ============================================================
// TELA: Cadastrar (Registro)
// Rota: /(auth)/cadastrar
// ============================================================

import { useState } from 'react';
import { router } from 'expo-router';
import { Botao } from '@/componentes/Botao';
import { CampoTexto } from '@/componentes/CampoTexto';
import { TelaAutenticacao } from '@/componentes/TelaAutenticacao';
import * as servicoAuth from '@/servicos/autenticacao';
import { alertar } from '@/servicos/alerta';
import { mensagemErroApi } from '@/servicos/api';

export default function TelaCadastrar() {
  const [nome, setNome]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [senha, setSenha]                     = useState('');
  const [confirmarSenha, setConfirmarSenha]   = useState('');
  const [carregando, setCarregando]           = useState(false);

  const [erroNome, setErroNome]               = useState('');
  const [erroEmail, setErroEmail]             = useState('');
  const [erroSenha, setErroSenha]             = useState('');
  const [erroConfirmar, setErroConfirmar]     = useState('');

  function validar(): boolean {
    let valido = true;
    setErroNome(''); setErroEmail(''); setErroSenha(''); setErroConfirmar('');

    if (!nome.trim() || nome.trim().length < 3) {
      setErroNome('Nome deve ter ao menos 3 caracteres.');
      valido = false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErroEmail('Informe um e-mail válido.');
      valido = false;
    }
    if (senha.length < 6) {
      setErroSenha('Senha deve ter ao menos 6 caracteres.');
      valido = false;
    }
    if (senha !== confirmarSenha) {
      setErroConfirmar('As senhas não coincidem.');
      valido = false;
    }

    return valido;
  }

  async function aoCadastrar() {
    if (!validar()) return;

    setCarregando(true);
    try {
      await servicoAuth.cadastrar({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
      });
      alertar(
        'Conta criada!',
        'Seu cadastro foi realizado. Faça login para continuar.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/entrar') }]
      );
    } catch (erro) {
      alertar(
        'Erro ao cadastrar',
        mensagemErroApi(
          erro,
          'Não foi possível criar a conta. Verifique sua conexão e tente novamente.'
        )
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAutenticacao
      frase="Crie sua conta e comece a reciclar"
      titulo="Criar Conta"
      pergunta="Já tem conta?"
      rotuloLink="Entrar"
      aoTocarLink={() => router.replace('/(auth)/entrar')}
      aoVoltar={() => router.back()}
    >
      <CampoTexto
        rotulo="Nome completo"
        icone="account-outline"
        value={nome}
        onChangeText={setNome}
        placeholder="Seu nome"
        autoCapitalize="words"
        erro={erroNome}
      />
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
        placeholder="Mínimo 6 caracteres"
        senha
        autoCapitalize="none"
        erro={erroSenha}
      />
      <CampoTexto
        rotulo="Confirmar senha"
        icone="lock-check-outline"
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        placeholder="Repita sua senha"
        senha
        autoCapitalize="none"
        erro={erroConfirmar}
      />

      <Botao rotulo="Criar Conta" carregando={carregando} onPress={aoCadastrar} />
    </TelaAutenticacao>
  );
}
