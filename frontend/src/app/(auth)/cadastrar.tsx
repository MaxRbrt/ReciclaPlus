// ============================================================
// TELA: Cadastrar (Registro)
// Rota: /(auth)/cadastrar
// ============================================================

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as servicoAuth from '@/servicos/autenticacao';
import { Cores, Fontes, Espacamento, Bordas, Sombra } from '@/constantes/tema';

export default function TelaCadastrar() {
  const [nome, setNome]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [senha, setSenha]                     = useState('');
  const [confirmarSenha, setConfirmarSenha]   = useState('');
  const [senhaVisivel, setSenhaVisivel]       = useState(false);
  const [confirmarVisivel, setConfirmarVisivel] = useState(false);
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
      setErroEmail('Informe um e-mail valido.');
      valido = false;
    }
    if (senha.length < 6) {
      setErroSenha('Senha deve ter ao menos 6 caracteres.');
      valido = false;
    }
    if (senha !== confirmarSenha) {
      setErroConfirmar('As senhas nao coincidem.');
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
      Alert.alert(
        'Conta criada!',
        'Seu cadastro foi realizado. Faca login para continuar.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/entrar') }]
      );
    } catch {
      Alert.alert('Erro ao cadastrar', 'Este e-mail ja esta em uso ou ocorreu um erro. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecalho */}
        <View style={estilos.cabecalho}>
          <TouchableOpacity onPress={() => router.back()} style={estilos.voltarBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Cores.primaria} />
          </TouchableOpacity>
          <View style={estilos.logoIcone}>
            <MaterialCommunityIcons name="recycle" size={36} color={Cores.branco} />
          </View>
          <Text style={estilos.logoNome}>Recicla+</Text>
          <Text style={estilos.logoSlogan}>Crie sua conta e comece a reciclar</Text>
        </View>

        {/* Formulario */}
        <View style={estilos.formulario}>
          <Text style={estilos.tituloFormulario}>Criar Conta</Text>

          {/* Nome */}
          <View style={estilos.campoGrupo}>
            <Text style={estilos.label}>Nome completo</Text>
            <View style={[estilos.inputContainer, erroNome ? estilos.inputErro : null]}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={erroNome ? Cores.erro : Cores.cinzaMedio}
                style={estilos.inputIcone}
              />
              <TextInput
                style={estilos.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome"
                placeholderTextColor={Cores.cinzaMedio}
                autoCapitalize="words"
              />
            </View>
            {erroNome ? <Text style={estilos.textoErro}>{erroNome}</Text> : null}
          </View>

          {/* E-mail */}
          <View style={estilos.campoGrupo}>
            <Text style={estilos.label}>E-mail</Text>
            <View style={[estilos.inputContainer, erroEmail ? estilos.inputErro : null]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={erroEmail ? Cores.erro : Cores.cinzaMedio}
                style={estilos.inputIcone}
              />
              <TextInput
                style={estilos.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={Cores.cinzaMedio}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {erroEmail ? <Text style={estilos.textoErro}>{erroEmail}</Text> : null}
          </View>

          {/* Senha */}
          <View style={estilos.campoGrupo}>
            <Text style={estilos.label}>Senha</Text>
            <View style={[estilos.inputContainer, erroSenha ? estilos.inputErro : null]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={erroSenha ? Cores.erro : Cores.cinzaMedio}
                style={estilos.inputIcone}
              />
              <TextInput
                style={estilos.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Minimo 6 caracteres"
                placeholderTextColor={Cores.cinzaMedio}
                secureTextEntry={!senhaVisivel}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)} style={estilos.olhoBtn}>
                <MaterialCommunityIcons
                  name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Cores.cinzaMedio}
                />
              </TouchableOpacity>
            </View>
            {erroSenha ? <Text style={estilos.textoErro}>{erroSenha}</Text> : null}
          </View>

          {/* Confirmar senha */}
          <View style={estilos.campoGrupo}>
            <Text style={estilos.label}>Confirmar senha</Text>
            <View style={[estilos.inputContainer, erroConfirmar ? estilos.inputErro : null]}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={20}
                color={erroConfirmar ? Cores.erro : Cores.cinzaMedio}
                style={estilos.inputIcone}
              />
              <TextInput
                style={estilos.input}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Repita sua senha"
                placeholderTextColor={Cores.cinzaMedio}
                secureTextEntry={!confirmarVisivel}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setConfirmarVisivel(!confirmarVisivel)} style={estilos.olhoBtn}>
                <MaterialCommunityIcons
                  name={confirmarVisivel ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Cores.cinzaMedio}
                />
              </TouchableOpacity>
            </View>
            {erroConfirmar ? <Text style={estilos.textoErro}>{erroConfirmar}</Text> : null}
          </View>

          {/* Botao cadastrar */}
          <TouchableOpacity
            style={[estilos.botao, carregando && estilos.botaoDesabilitado]}
            onPress={aoCadastrar}
            disabled={carregando}
            activeOpacity={0.85}
          >
            {carregando
              ? <ActivityIndicator color={Cores.branco} size="small" />
              : <Text style={estilos.botaoTexto}>Criar Conta</Text>
            }
          </TouchableOpacity>

          {/* Link login */}
          <View style={estilos.rodape}>
            <Text style={estilos.rodapeTexto}>Ja tem conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/entrar')}>
              <Text style={estilos.rodapeLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: Cores.cinzaClaro,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Espacamento.lg,
  },

  // Cabecalho
  cabecalho: {
    alignItems: 'center',
    marginBottom: Espacamento.xl,
  },
  voltarBtn: {
    alignSelf: 'flex-start',
    marginBottom: Espacamento.md,
    padding: Espacamento.xs,
  },
  logoIcone: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espacamento.sm,
    ...Sombra.forte,
  },
  logoNome: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.primaria,
    letterSpacing: 1,
  },
  logoSlogan: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    marginTop: Espacamento.xs,
    textAlign: 'center',
  },

  // Formulario
  formulario: {
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raioGrande,
    padding: Espacamento.lg,
    ...Sombra.padrao,
  },
  tituloFormulario: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.negrito,
    color: Cores.preto,
    marginBottom: Espacamento.lg,
  },
  campoGrupo: {
    marginBottom: Espacamento.md,
  },
  label: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
    marginBottom: Espacamento.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raio,
    backgroundColor: Cores.cinzaClaro,
    paddingHorizontal: Espacamento.sm,
  },
  inputErro: {
    borderColor: Cores.erro,
  },
  inputIcone: {
    marginRight: Espacamento.xs,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: Fontes.media,
    color: Cores.preto,
  },
  olhoBtn: {
    padding: Espacamento.xs,
  },
  textoErro: {
    fontSize: Fontes.pequena,
    color: Cores.erro,
    marginTop: 4,
  },

  // Botao
  botao: {
    backgroundColor: Cores.primaria,
    borderRadius: Bordas.raio,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Espacamento.sm,
    ...Sombra.suave,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoTexto: {
    color: Cores.branco,
    fontSize: Fontes.media,
    fontWeight: Fontes.negrito,
  },

  // Rodape
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Espacamento.lg,
  },
  rodapeTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
  },
  rodapeLink: {
    fontSize: Fontes.normal,
    color: Cores.primaria,
    fontWeight: Fontes.negrito,
  },
});
