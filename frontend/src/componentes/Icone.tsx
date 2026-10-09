import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { cores, tamanhos } from '@/constantes/tema';

export type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface IconeProps {
  nome: NomeIcone;
  tamanho?: number;
  cor?: string;
}

export function Icone({
  nome,
  tamanho = tamanhos.icone,
  cor = cores.tinta,
}: IconeProps) {
  return <MaterialCommunityIcons name={nome} size={tamanho} color={cor} />;
}
