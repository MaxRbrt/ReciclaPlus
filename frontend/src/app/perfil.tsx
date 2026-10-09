// Tela "Minha conta".
// Editar o nome, trocar a senha, sair e excluir a conta.

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { alterarSenha } from '@/servicos/autenticacao';
import { alertar } from '@/servicos/alerta';
import { mensagemErroApi } from '@/servicos/api';
import { Bordas, Cores, Espacamento, Fontes, Sombra } from '@/constantes/tema';
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
      <View style={estilos.header}>
        <TouchableOpacity
          style={estilos.voltarBtn}
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Cores.branco} />
        </TouchableOpacity>
        <View style={estilos.headerInfo}>
          <Text style={estilos.headerTitulo}>Minha conta</Text>
          <Text style={estilos.headerSub} numberOfLines={1}>
            {usuario.email}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Nome ---------- */}
        <View style={estilos.cartao}>
          <Text style={estilos.cartaoTitulo}>Dados pessoais</Text>

          <Text style={estilos.label}>Nome</Text>
          <TextInput
            style={estilos.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome"
            placeholderTextColor={Cores.cinzaMedio}
            maxLength={120}
          />
          <Text style={estilos.dica}>
            É o nome que aparece na Comunidade para quem vê seus pontos.
          </Text>

          <TouchableOpacity
            style={[
              estilos.btnPrimario,
              (!nomeMudou || salvandoNome) && estilos.btnDesabilitado,
            ]}
            onPress={aoSalvarNome}
            disabled={!nomeMudou || salvandoNome}
            activeOpacity={0.85}
          >
            {salvandoNome ? (
              <ActivityIndicator size="small" color={Cores.branco} />
            ) : (
              <Text style={estilos.btnPrimarioTexto}>Salvar nome</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.linkLinha}
            onPress={() =>
              router.push({ pathname: '/pessoa/[id]', params: { id: String(usuario.id) } })
            }
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={Cores.primaria}
            />
            <Text style={estilos.linkTexto}>Ver meu perfil na comunidade</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={Cores.cinzaMedio}
            />
          </TouchableOpacity>
        </View>

        {/* ---------- Senha ---------- */}
        <View style={estilos.cartao}>
          <Text style={estilos.cartaoTitulo}>Trocar senha</Text>

          <Text style={estilos.label}>Senha atual</Text>
          <TextInput
            style={estilos.input}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            placeholder="Sua senha atual"
            placeholderTextColor={Cores.cinzaMedio}
            secureTextEntry
            autoCapitalize="none"
            maxLength={72}
          />

          <Text style={estilos.label}>Nova senha</Text>
          <TextInput
            style={estilos.input}
            value={novaSenha}
            onChangeText={setNovaSenha}
            placeholder={`Mínimo ${SENHA_MINIMA} caracteres`}
            placeholderTextColor={Cores.cinzaMedio}
            secureTextEntry
            autoCapitalize="none"
            maxLength={72}
          />

          <Text style={estilos.label}>Confirmar nova senha</Text>
          <TextInput
            style={estilos.input}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Repita a nova senha"
            placeholderTextColor={Cores.cinzaMedio}
            secureTextEntry
            autoCapitalize="none"
            maxLength={72}
          />

          <TouchableOpacity
            style={[estilos.btnPrimario, salvandoSenha && estilos.btnDesabilitado]}
            onPress={aoTrocarSenha}
            disabled={salvandoSenha}
            activeOpacity={0.85}
          >
            {salvandoSenha ? (
              <ActivityIndicator size="small" color={Cores.branco} />
            ) : (
              <Text style={estilos.btnPrimarioTexto}>Trocar senha</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ---------- Sair ---------- */}
        <TouchableOpacity
          style={estilos.btnSair}
          onPress={aoSair}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout" size={20} color={Cores.cinzaEscuro} />
          <Text style={estilos.btnSairTexto}>Sair da conta</Text>
        </TouchableOpacity>

        {/* ---------- Excluir conta ---------- */}
        <View style={[estilos.cartao, estilos.cartaoPerigo]}>
          <Text style={[estilos.cartaoTitulo, estilos.textoPerigo]}>Excluir conta</Text>
          <Text style={estilos.dica}>
            Apaga sua conta, todos os pontos que você cadastrou e seus
            favoritos. Não dá para desfazer.
          </Text>

          {excluindoAberto ? (
            <>
              <Text style={estilos.label}>Confirme com sua senha</Text>
              <TextInput
                style={estilos.input}
                value={senhaExclusao}
                onChangeText={setSenhaExclusao}
                placeholder="Sua senha"
                placeholderTextColor={Cores.cinzaMedio}
                secureTextEntry
                autoCapitalize="none"
                maxLength={72}
              />
              <View style={estilos.botoesLinha}>
                <TouchableOpacity
                  style={estilos.btnSecundario}
                  onPress={() => {
                    setExcluindoAberto(false);
                    setSenhaExclusao('');
                  }}
                  disabled={excluindo}
                  activeOpacity={0.85}
                >
                  <Text style={estilos.btnSecundarioTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[estilos.btnPerigo, excluindo && estilos.btnDesabilitado]}
                  onPress={aoConfirmarExclusao}
                  disabled={excluindo}
                  activeOpacity={0.85}
                >
                  {excluindo ? (
                    <ActivityIndicator size="small" color={Cores.branco} />
                  ) : (
                    <Text style={estilos.btnPerigoTexto}>Excluir minha conta</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={estilos.btnPerigoContorno}
              onPress={() => setExcluindoAberto(true)}
              activeOpacity={0.85}
            >
              <Text style={estilos.btnPerigoContornoTexto}>Quero excluir minha conta</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Cores.cinzaClaro },

  header: {
    backgroundColor: Cores.primaria,
    paddingTop: 56,
    paddingBottom: Espacamento.lg,
    paddingHorizontal: Espacamento.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
  },
  voltarBtn: { padding: Espacamento.xs },
  headerInfo: { flex: 1 },
  headerTitulo: {
    fontSize: Fontes.grande,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.branco,
  },
  headerSub: {
    fontSize: Fontes.pequena,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  scroll: { padding: Espacamento.lg, paddingBottom: Espacamento.xxl },

  cartao: {
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raioGrande,
    padding: Espacamento.md,
    marginBottom: Espacamento.md,
    ...Sombra.suave,
  },
  cartaoPerigo: {
    borderWidth: 1,
    borderColor: Cores.erroFundo,
  },
  cartaoTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
    marginBottom: Espacamento.sm,
  },
  textoPerigo: { color: Cores.erro },

  label: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
    marginTop: Espacamento.sm,
    marginBottom: Espacamento.xs,
  },
  input: {
    backgroundColor: Cores.branco,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raio,
    paddingHorizontal: Espacamento.md,
    height: 48,
    fontSize: Fontes.normal,
    color: Cores.preto,
  },
  dica: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    lineHeight: 18,
    marginTop: Espacamento.xs,
  },

  btnPrimario: {
    backgroundColor: Cores.primaria,
    borderRadius: Bordas.raio,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Espacamento.md,
  },
  btnPrimarioTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.branco,
  },
  btnDesabilitado: { opacity: 0.5 },

  linkLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    marginTop: Espacamento.md,
    paddingTop: Espacamento.md,
    borderTopWidth: 1,
    borderTopColor: Cores.cinzaClaro,
  },
  linkTexto: {
    flex: 1,
    fontSize: Fontes.normal,
    fontWeight: Fontes.medio_peso,
    color: Cores.preto,
  },

  btnSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raio,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    height: 48,
    marginBottom: Espacamento.md,
  },
  btnSairTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.cinzaEscuro,
  },

  botoesLinha: {
    flexDirection: 'row',
    gap: Espacamento.sm,
    marginTop: Espacamento.md,
  },
  btnSecundario: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Bordas.raio,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
  },
  btnSecundarioTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.cinzaEscuro,
  },
  btnPerigo: {
    flex: 1.4,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Bordas.raio,
    backgroundColor: Cores.erro,
  },
  btnPerigoTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.branco,
  },
  btnPerigoContorno: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Bordas.raio,
    borderWidth: 1.5,
    borderColor: Cores.erro,
    marginTop: Espacamento.md,
  },
  btnPerigoContornoTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.erro,
  },
});
