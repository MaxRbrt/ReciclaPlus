// ============================================================
// TELA: Entrar (Login)
// Rota: /(auth)/entrar
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
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { Cores, Fontes, Espacamento, Bordas, Sombra } from '@/constantes/tema';

export default function TelaEntrar() {
  const { entrar } = useAutenticacao();

  const [email, setEmail]             = useState('');
  const [senha, setSenha]             = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
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
      setErroEmail('E-mail invalido.');
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
    } catch {
      Alert.alert('Erro ao entrar', 'E-mail ou senha incorretos. Tente novamente.');
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
        {/* Logo */}
        <View style={estilos.logoArea}>
          <View style={estilos.logoIcone}>
            <MaterialCommunityIcons name="recycle" size={48} color={Cores.branco} />
          </View>
          <Text style={estilos.logoNome}>Recicla+</Text>
          <Text style={estilos.logoSlogan}>Encontre pontos de coleta perto de voce</Text>
        </View>

        {/* Formulario */}
        <View style={estilos.formulario}>
          <Text style={estilos.tituloFormulario}>Entrar</Text>

          {/* Campo e-mail */}
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

          {/* Campo senha */}
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
                placeholder="Sua senha"
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

          {/* Botao entrar */}
          <TouchableOpacity
            style={[estilos.botao, carregando && estilos.botaoDesabilitado]}
            onPress={aoEntrar}
            disabled={carregando}
            activeOpacity={0.85}
          >
            {carregando
              ? <ActivityIndicator color={Cores.branco} size="small" />
              : <Text style={estilos.botaoTexto}>Entrar</Text>
            }
          </TouchableOpacity>

          {/* Link cadastro */}
          <View style={estilos.rodape}>
            <Text style={estilos.rodapeTexto}>Nao tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/cadastrar')}>
              <Text style={estilos.rodapeLink}>Cadastre-se</Text>
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

  // Logo
  logoArea: {
    alignItems: 'center',
    marginBottom: Espacamento.xl,
  },
  logoIcone: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espacamento.md,
    ...Sombra.forte,
  },
  logoNome: {
    fontSize: Fontes.tituloGrande,
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
