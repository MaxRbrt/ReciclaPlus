// Campo de formulario: rotulo, icone, mensagem de erro ou dica e, para
// senhas, o botao de mostrar/ocultar.

import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { cores, espaco, raios, tamanhos, tipografia } from '@/constantes/tema';
import { BotaoIcone } from './BotaoIcone';
import { Icone, NomeIcone } from './Icone';
import { Texto } from './Texto';

interface CampoTextoProps extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  rotulo: string;
  icone?: NomeIcone;
  erro?: string;
  dica?: string;
  senha?: boolean;
}

export function CampoTexto({
  rotulo,
  icone,
  erro,
  dica,
  senha = false,
  multiline,
  onFocus,
  onBlur,
  ...resto
}: CampoTextoProps) {
  const [focado, setFocado] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  return (
    <View style={estilos.grupo}>
      <Texto variante="corpoForte">{rotulo}</Texto>

      <View
        style={[
          estilos.caixa,
          multiline && estilos.caixaMultilinha,
          focado && estilos.caixaFocada,
          erro ? estilos.caixaErro : null,
        ]}
      >
        {icone ? (
          <Icone nome={icone} cor={erro ? cores.erro : cores.tintaFraca} />
        ) : null}
        <TextInput
          style={[estilos.entrada, multiline && estilos.entradaMultilinha]}
          placeholderTextColor={cores.tintaFraca}
          accessibilityLabel={rotulo}
          secureTextEntry={senha && !senhaVisivel}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={evento => {
            setFocado(true);
            onFocus?.(evento);
          }}
          onBlur={evento => {
            setFocado(false);
            onBlur?.(evento);
          }}
          {...resto}
        />
        {senha ? (
          <BotaoIcone
            icone={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
            rotulo={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
            variante="simples"
            onPress={() => setSenhaVisivel(!senhaVisivel)}
          />
        ) : null}
      </View>

      {erro ? (
        <Texto variante="detalhe" cor={cores.erro}>
          {erro}
        </Texto>
      ) : dica ? (
        <Texto variante="detalhe" cor={cores.tintaSuave}>
          {dica}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: {
    gap: espaco.xxs,
  },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: tamanhos.botao,
    paddingLeft: espaco.md,
    paddingRight: espaco.xxs,
    borderRadius: raios.md,
    borderWidth: tamanhos.borda,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  caixaMultilinha: {
    alignItems: 'flex-start',
    paddingVertical: espaco.sm,
  },
  caixaFocada: {
    borderColor: cores.primaria,
  },
  caixaErro: {
    borderColor: cores.erro,
  },
  entrada: {
    ...tipografia.corpo,
    flex: 1,
    minHeight: tamanhos.toque,
    paddingRight: espaco.sm,
    color: cores.tinta,
    // O anel de foco do navegador daria um segundo contorno dentro da caixa.
    outlineColor: 'transparent',
  },
  entradaMultilinha: {
    minHeight: tamanhos.toque * 2,
  },
});
