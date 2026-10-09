// Moldura das telas de Login e Cadastro: topo verde com folhas e a marca,
// folha branca com o formulario e, no fim, o link para a outra tela.

import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FORMAS_DESTAQUE } from '@/constantes/formas';
import { cores, espaco, raios, tamanhos } from '@/constantes/tema';
import { BotaoIcone } from './BotaoIcone';
import { FundoOrganico } from './FundoOrganico';
import { Icone } from './Icone';
import { Pressionavel } from './Pressionavel';
import { Texto } from './Texto';

interface TelaAutenticacaoProps {
  frase: string;
  titulo: string;
  // Rodape: "Não tem conta?" + link "Cadastre-se".
  pergunta: string;
  rotuloLink: string;
  aoTocarLink: () => void;
  aoVoltar?: () => void;
  children: ReactNode;
}

export function TelaAutenticacao({
  frase,
  titulo,
  pergunta,
  rotuloLink,
  aoTocarLink,
  aoVoltar,
  children,
}: TelaAutenticacaoProps) {
  const margens = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FundoOrganico formas={FORMAS_DESTAQUE} animado />

      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          { paddingTop: margens.top + espaco.md },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.topo}>
          {aoVoltar ? (
            <BotaoIcone
              icone="arrow-left"
              rotulo="Voltar"
              variante="translucido"
              onPress={aoVoltar}
              style={estilos.voltar}
            />
          ) : null}
          <View style={estilos.marca}>
            <Icone nome="recycle" tamanho={tamanhos.botao - espaco.md} cor={cores.tinta} />
          </View>
          <Texto variante="display" cor={cores.sobreEscuro}>
            Recicla+
          </Texto>
          <Texto cor={cores.sobreEscuroSuave}>{frase}</Texto>
        </View>

        <View
          style={[estilos.folha, { paddingBottom: margens.bottom + espaco.xl }]}
        >
          <Texto variante="titulo">{titulo}</Texto>

          {children}

          <View style={estilos.rodape}>
            <Texto cor={cores.tintaSuave}>{pergunta}</Texto>
            <Pressionavel onPress={aoTocarLink} accessibilityRole="link" hitSlop={12}>
              <Texto variante="corpoForte" cor={cores.primaria}>
                {rotuloLink}
              </Texto>
            </Pressionavel>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.floresta,
    overflow: 'hidden',
  },
  // A folha branca encosta no fim da tela mesmo com pouco conteudo.
  conteudo: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: espaco.xl,
  },
  topo: {
    gap: espaco.xs,
    paddingHorizontal: espaco.xl,
    paddingTop: espaco.md,
  },
  voltar: {
    marginBottom: espaco.md,
  },
  marca: {
    width: tamanhos.botao + espaco.xs,
    height: tamanhos.botao + espaco.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raios.md,
    borderBottomLeftRadius: raios.sm / 2,
    backgroundColor: cores.lima,
    marginBottom: espaco.xs,
  },
  folha: {
    gap: espaco.md,
    padding: espaco.xl,
    borderTopLeftRadius: raios.lg,
    borderTopRightRadius: raios.lg,
    backgroundColor: cores.fundo,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: espaco.xxs,
    marginTop: espaco.xs,
  },
});
