// Desenho das formas organicas no celular, com Skia.
// A versao web (DesenhoFormas.web.tsx) desenha as mesmas formas em SVG.

import { Canvas, Group, Path, fitbox, rect } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FormaOrganica, QUADRO_FORMAS } from '@/constantes/formas';

export function DesenhoFormas({ formas }: { formas: FormaOrganica[] }) {
  const [area, setArea] = useState({ largura: 0, altura: 0 });

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={evento =>
        setArea({
          largura: evento.nativeEvent.layout.width,
          altura: evento.nativeEvent.layout.height,
        })
      }
    >
      {area.largura > 0 && area.altura > 0 ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Group
            transform={fitbox(
              'cover',
              rect(0, 0, QUADRO_FORMAS.largura, QUADRO_FORMAS.altura),
              rect(0, 0, area.largura, area.altura)
            )}
          >
            {formas.map((forma, indice) => (
              <Group
                key={indice}
                transform={[
                  { translateX: forma.x },
                  { translateY: forma.y },
                  { rotate: (forma.rotacao * Math.PI) / 180 },
                  { scale: forma.escala },
                ]}
              >
                <Path path={forma.d} color={forma.cor} opacity={forma.opacidade} />
              </Group>
            ))}
          </Group>
        </Canvas>
      ) : null}
    </View>
  );
}
