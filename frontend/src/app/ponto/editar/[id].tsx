// Tela de edicao de ponto.
// Somente quem cadastrou o ponto pode editar (a API tambem valida).

import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { CabecalhoTela } from '@/componentes/CabecalhoTela';
import { EstadoTela } from '@/componentes/EstadoTela';
import { FormularioPonto } from '@/componentes/FormularioPonto';
import { cores } from '@/constantes/tema';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { alertar } from '@/servicos/alerta';
import { montarUrlFoto } from '@/servicos/fotoPonto';
import { buscarPonto, atualizarPonto } from '@/servicos/pontos';
import { DadosCadastroPonto, Ponto } from '@/tipos/ponto';

export default function TelaEditarPonto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAutenticacao();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pontoOriginal, setPontoOriginal] = useState<Ponto | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarPonto() {
      setCarregando(true);
      setErro(null);

      try {
        const dados = await buscarPonto(Number(id));
        if (!ativo) return;

        if (dados.usuarioId !== usuario?.id) {
          setErro('Apenas quem cadastrou este ponto pode editá-lo.');
          return;
        }

        setPontoOriginal(dados);
      } catch {
        if (ativo) {
          setErro('Não foi possível carregar os dados deste ponto.');
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPonto();

    return () => {
      ativo = false;
    };
  }, [id, usuario]);

  if (carregando) {
    return (
      <View style={estilos.raiz}>
        <EstadoTela preencher carregando mensagem="Carregando ponto..." />
      </View>
    );
  }

  if (erro || !pontoOriginal) {
    return (
      <View style={estilos.raiz}>
        <EstadoTela
          preencher
          icone="alert-circle-outline"
          titulo="Não foi possível editar"
          mensagem={erro}
          acao={{ rotulo: 'Voltar', onPress: () => router.back() }}
        />
      </View>
    );
  }

  const ponto = pontoOriginal;

  async function aoSalvar(dados: DadosCadastroPonto) {
    await atualizarPonto(ponto.id, dados);
    alertar('Sucesso!', 'Ponto atualizado com sucesso.', [
      { text: 'OK', onPress: () => router.replace(`/ponto/${ponto.id}`) },
    ]);
  }

  return (
    <View style={estilos.raiz}>
      <CabecalhoTela
        titulo="Editar Ponto"
        subtitulo={ponto.nome}
        aoVoltar={() => router.back()}
      />

      {/* A chave recria o formulario se o ponto carregado mudar. */}
      <FormularioPonto
        key={ponto.id}
        inicial={{
          nome: ponto.nome,
          descricao: ponto.descricao,
          endereco: ponto.endereco,
          bairro: ponto.bairro,
          cidade: ponto.cidade,
          horario: ponto.horarioFuncionamento,
          fotoUri: montarUrlFoto(ponto.fotoUrl),
          latitude: Number(ponto.latitude),
          longitude: Number(ponto.longitude),
          categorias: ponto.categorias?.map(categoria => categoria.id),
        }}
        permiteRemoverFoto
        perguntaFoto="Como você quer atualizar a foto?"
        avisoSemLocalizacao="Capture a localização GPS do ponto."
        ajudaLocalizacao="Toque para substituir pela sua localização atual"
        rotuloSalvar="Salvar Alterações"
        iconeSalvar="content-save"
        erroAoSalvar="Não foi possível atualizar o ponto. Tente novamente."
        aoSalvar={aoSalvar}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
});
