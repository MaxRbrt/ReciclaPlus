// Cartao de ponto de coleta usado em todas as listas do app.
// A tela escolhe as linhas de texto e o que aparece a direita.

import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { cores, espaco, raios, sombras, tamanhos } from '@/constantes/tema';
import { Categoria } from '@/tipos/categoria';
import { EtiquetaCategoria } from './EtiquetaCategoria';
import { Icone, NomeIcone } from './Icone';
import { MiniaturaPonto } from './MiniaturaPonto';
import { Pressionavel } from './Pressionavel';
import { Texto } from './Texto';

// Limite de selos por cartao; o resto vira "+N".
const MAX_CATEGORIAS = 3;

interface CartaoPontoProps {
  nome: string;
  fotoUrl?: string | null;
  onPress: () => void;
  // Linhas abaixo do nome, da mais para a menos importante.
  linhas?: (string | null | undefined)[];
  // Linha em verde com icone (ex.: horario, quem cadastrou).
  destaque?: string | null;
  iconeDestaque?: NomeIcone;
  // Ja formatada ("1,3 km").
  distancia?: string;
  categorias?: Categoria[];
  // Substitui a seta a direita (ex.: botao de remover favorito).
  acao?: ReactNode;
  iconeMiniatura?: NomeIcone;
  corMiniatura?: string;
}

export function CartaoPonto({
  nome,
  fotoUrl,
  onPress,
  linhas = [],
  destaque,
  iconeDestaque,
  distancia,
  categorias = [],
  acao,
  iconeMiniatura,
  corMiniatura,
}: CartaoPontoProps) {
  const linhasVisiveis = linhas.filter(Boolean);
  const categoriasVisiveis = categorias.slice(0, MAX_CATEGORIAS);
  const restantes = categorias.length - categoriasVisiveis.length;

  return (
    <Pressionavel style={estilos.cartao} onPress={onPress} escala={0.98}>
      <MiniaturaPonto
        fotoUrl={fotoUrl}
        icone={iconeMiniatura}
        corIcone={corMiniatura}
      />

      <View style={estilos.info}>
        <Texto variante="cartao" numberOfLines={1}>
          {nome}
        </Texto>

        {linhasVisiveis.map((linha, indice) => (
          <Texto
            key={indice}
            variante="detalhe"
            cor={cores.tintaSuave}
            numberOfLines={1}
          >
            {linha}
          </Texto>
        ))}

        {destaque ? (
          <View style={estilos.destaque}>
            {iconeDestaque ? (
              <Icone
                nome={iconeDestaque}
                tamanho={tamanhos.iconeMenor}
                cor={cores.primaria}
              />
            ) : null}
            <Texto
              variante="detalhe"
              cor={cores.primaria}
              numberOfLines={1}
              style={estilos.destaqueTexto}
            >
              {destaque}
            </Texto>
          </View>
        ) : null}

        {categoriasVisiveis.length > 0 ? (
          <View style={estilos.categorias}>
            {categoriasVisiveis.map(categoria => (
              <EtiquetaCategoria
                key={categoria.id}
                id={categoria.id}
                nome={categoria.nome}
              />
            ))}
            {restantes > 0 ? (
              <Texto variante="rotulo" cor={cores.tintaSuave}>
                +{restantes}
              </Texto>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={estilos.lateral}>
        {distancia ? (
          <View style={estilos.distancia}>
            <Texto variante="detalhe">{distancia}</Texto>
          </View>
        ) : null}
        {acao ?? <Icone nome="chevron-right" cor={cores.tintaFraca} />}
      </View>
    </Pressionavel>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raios.lg,
    backgroundColor: cores.superficie,
    ...sombras.baixa,
  },
  info: {
    flex: 1,
    gap: espaco.xxs / 2,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xxs,
  },
  destaqueTexto: {
    flexShrink: 1,
  },
  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: espaco.xxs,
    marginTop: espaco.xxs,
  },
  lateral: {
    alignItems: 'flex-end',
    gap: espaco.xs,
  },
  distancia: {
    paddingHorizontal: espaco.xs,
    paddingVertical: espaco.xxs,
    borderRadius: raios.total,
    backgroundColor: cores.lima,
  },
});
