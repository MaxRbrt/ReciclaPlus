// Tela "Minha conta".
// Editar o nome, trocar a senha, sair e excluir a conta.

import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Botao } from '@/componentes/Botao';
import { CabecalhoTela } from '@/componentes/CabecalhoTela';
import { CampoTexto } from '@/componentes/CampoTexto';
import { Icone } from '@/componentes/Icone';
import { Pressionavel } from '@/componentes/Pressionavel';
import { Texto } from '@/componentes/Texto';
import { cores, espaco, raios, sombras, tamanhos } from '@/constantes/tema';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { alterarSenha } from '@/servicos/autenticacao';
import { alertar } from '@/servicos/alerta';
import { mensagemErroApi } from '@/servicos/api';
import { Usuario } from '@/tipos/usuario';

const SENHA_MINIMA = 6;
const ERRO_CONEXAO = 'Não foi possível conectar ao servidor. Tente novamente.';

export default function TelaPerfil() {
  const { usuario } = useAutenticacao();

  // Sem usuario: sessao ainda sendo restaurada, ou conta recem-saida/excluida
  // (o GuardaDeRotas leva ao login). O formulario so e montado com o usuario
  // em maos, para o campo de nome ja nascer preenchido.
  if (!usuario) return null;

  return <FormularioPerfil usuario={usuario} />;
}

function FormularioPerfil({ usuario }: { usuario: Usuario }) {
  const { sair, atualizarNome, excluirConta } = useAutenticacao();

  const [nome, setNome] = useState(usuario.nome);
  const [salvandoNome, setSalvandoNome] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // A exclusao so aparece depois que o usuario pede; exige a senha de novo.
  const [excluindoAberto, setExcluindoAberto] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  const nomeLimpo = nome.trim();
  const nomeMudou = nomeLimpo !== usuario.nome;

  async function aoSalvarNome() {
    if (nomeLimpo.length < 3) {
      alertar('Nome', 'O nome deve ter ao menos 3 caracteres.');
      return;
    }

    setSalvandoNome(true);
    try {
      await atualizarNome(nomeLimpo);
      alertar('Pronto!', 'Seu nome foi atualizado.');
    } catch (erro) {
      alertar('Erro', mensagemErroApi(erro, ERRO_CONEXAO));
    } finally {
      setSalvandoNome(false);
    }
  }

  async function aoTrocarSenha() {
    if (!senhaAtual) {
      alertar('Senha', 'Informe sua senha atual.');
      return;
    }
    if (novaSenha.length < SENHA_MINIMA) {
      alertar('Senha', `A nova senha deve ter ao menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (novaSenha !== confirmarSenha) {
      alertar('Senha', 'A confirmação não é igual à nova senha.');
      return;
    }

    setSalvandoSenha(true);
    try {
      await alterarSenha(senhaAtual, novaSenha);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      alertar('Pronto!', 'Sua senha foi alterada.');
    } catch (erro) {
      alertar('Erro', mensagemErroApi(erro, ERRO_CONEXAO));
    } finally {
      setSalvandoSenha(false);
    }
  }

  function aoSair() {
    alertar('Sair da conta', 'Deseja mesmo sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  // Acao sem volta: confirma duas vezes (senha + dialogo).
  function aoConfirmarExclusao() {
    if (!senhaExclusao) {
      alertar('Excluir conta', 'Informe sua senha para confirmar.');
      return;
    }

    alertar(
      'Excluir conta',
      'Sua conta, os pontos que você cadastrou e seus favoritos serão apagados. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir tudo',
          style: 'destructive',
          onPress: async () => {
            setExcluindo(true);
            try {
              await excluirConta(senhaExclusao);
            } catch (erro) {
              alertar('Erro', mensagemErroApi(erro, ERRO_CONEXAO));
              setExcluindo(false);
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CabecalhoTela
        titulo="Minha conta"
        subtitulo={usuario.email}
        aoVoltar={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Nome ---------- */}
        <View style={estilos.cartao}>
          <Texto variante="subtitulo">Dados pessoais</Texto>

          <CampoTexto
            rotulo="Nome"
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            maxLength={120}
            dica="É o nome que aparece na Comunidade para quem vê seus pontos."
          />

          <Botao
            rotulo="Salvar nome"
            carregando={salvandoNome}
            desabilitado={!nomeMudou}
            onPress={aoSalvarNome}
          />

          <Pressionavel
            style={estilos.link}
            escala={0.98}
            onPress={() =>
              router.push({ pathname: '/pessoa/[id]', params: { id: String(usuario.id) } })
            }
          >
            <Icone nome="account-group" cor={cores.primaria} />
            <Texto variante="corpoForte" style={estilos.flexivel}>
              Ver meu perfil na comunidade
            </Texto>
            <Icone nome="chevron-right" cor={cores.tintaFraca} />
          </Pressionavel>
        </View>

        {/* ---------- Senha ---------- */}
        <View style={estilos.cartao}>
          <Texto variante="subtitulo">Trocar senha</Texto>

          <CampoTexto
            rotulo="Senha atual"
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            placeholder="Sua senha atual"
            senha
            autoCapitalize="none"
            maxLength={72}
          />
          <CampoTexto
            rotulo="Nova senha"
            value={novaSenha}
            onChangeText={setNovaSenha}
            placeholder={`Mínimo ${SENHA_MINIMA} caracteres`}
            senha
            autoCapitalize="none"
            maxLength={72}
          />
          <CampoTexto
            rotulo="Confirmar nova senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Repita a nova senha"
            senha
            autoCapitalize="none"
            maxLength={72}
          />

          <Botao
            rotulo="Trocar senha"
            carregando={salvandoSenha}
            onPress={aoTrocarSenha}
          />
        </View>

        {/* ---------- Sair ---------- */}
        <Botao
          variante="contorno"
          icone="logout"
          rotulo="Sair da conta"
          onPress={aoSair}
        />

        {/* ---------- Excluir conta ---------- */}
        <View style={[estilos.cartao, estilos.cartaoPerigo]}>
          <Texto variante="subtitulo" cor={cores.erro}>
            Excluir conta
          </Texto>
          <Texto variante="detalhe" cor={cores.tintaSuave}>
            Apaga sua conta, todos os pontos que você cadastrou e seus
            favoritos. Não dá para desfazer.
          </Texto>

          {excluindoAberto ? (
            <>
              <CampoTexto
                rotulo="Confirme com sua senha"
                value={senhaExclusao}
                onChangeText={setSenhaExclusao}
                placeholder="Sua senha"
                senha
                autoCapitalize="none"
                maxLength={72}
              />
              <Botao
                variante="perigo"
                rotulo="Excluir minha conta"
                carregando={excluindo}
                onPress={aoConfirmarExclusao}
              />
              <Botao
                variante="contorno"
                rotulo="Cancelar"
                desabilitado={excluindo}
                onPress={() => {
                  setExcluindoAberto(false);
                  setSenhaExclusao('');
                }}
              />
            </>
          ) : (
            <Botao
              variante="perigoSuave"
              rotulo="Quero excluir minha conta"
              onPress={() => setExcluindoAberto(true)}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  flexivel: { flex: 1 },
  conteudo: {
    gap: espaco.md,
    padding: espaco.xl,
    paddingBottom: espaco.xxxl,
  },
  cartao: {
    gap: espaco.md,
    padding: espaco.md,
    borderRadius: raios.lg,
    backgroundColor: cores.superficie,
    ...sombras.baixa,
  },
  cartaoPerigo: {
    borderWidth: tamanhos.borda,
    borderColor: cores.erroFundo,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    minHeight: tamanhos.toque,
  },
});
