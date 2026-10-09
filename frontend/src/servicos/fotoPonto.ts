import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, URL_API } from './api';
import { alertar } from './alerta';

const OPCOES_IMAGEM: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
};

// Caminho relativo devolvido pela API e gravado no ponto (ex.: /uploads/abc.jpg).
const PREFIXO_FOTO_SERVIDOR = '/uploads/';

// Envio de imagem pode demorar mais que o timeout padrao da API.
const TIMEOUT_UPLOAD_MS = 60000;

function extrairUri(resultado: ImagePicker.ImagePickerResult): string | null {
  if (resultado.canceled || !resultado.assets?.[0]) {
    return null;
  }

  return resultado.assets[0].uri;
}

export async function capturarFotoPonto(): Promise<string | null> {
  const permissao = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissao.granted) {
    alertar(
      'Permissão negada',
      'Permita acesso à câmera nas configurações do app.'
    );
    return null;
  }

  const resultado = await ImagePicker.launchCameraAsync(OPCOES_IMAGEM);
  return extrairUri(resultado);
}

export async function escolherFotoPontoDaGaleria(): Promise<string | null> {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    alertar(
      'Permissão negada',
      'Permita acesso à galeria nas configurações do app.'
    );
    return null;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync(OPCOES_IMAGEM);
  return extrairUri(resultado);
}

// Converte o fotoUrl do ponto em algo que o <Image> consegue abrir.
// Caminho do servidor ganha o endereco da API (que muda com a rede);
// qualquer outro valor (foto local recem-escolhida) e devolvido como esta.
export function montarUrlFoto(fotoUrl: string | null | undefined): string | null {
  const valor = fotoUrl?.trim();
  if (!valor) return null;
  return valor.startsWith(PREFIXO_FOTO_SERVIDOR) ? `${URL_API}${valor}` : valor;
}

function tipoPorExtensao(uri: string): { extensao: string; tipo: string } {
  const extensao = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (extensao === 'png') return { extensao: 'png', tipo: 'image/png' };
  if (extensao === 'webp') return { extensao: 'webp', tipo: 'image/webp' };
  return { extensao: 'jpg', tipo: 'image/jpeg' };
}

// Envia a foto local para a API e devolve o caminho a gravar no ponto.
async function enviarFotoPonto(uriLocal: string): Promise<string> {
  const { extensao, tipo } = tipoPorExtensao(uriLocal);
  const formulario = new FormData();
  if (Platform.OS === 'web') {
    // No navegador a uri e um blob:/data: e o FormData exige o Blob em si.
    const conteudo = await (await fetch(uriLocal)).blob();
    formulario.append('foto', conteudo, 'foto');
  } else {
    // No React Native, o arquivo vai como { uri, name, type }.
    formulario.append('foto', {
      uri: uriLocal,
      name: `foto.${extensao}`,
      type: tipo,
    } as unknown as Blob);
  }

  const resposta = await api.post<{ fotoUrl: string }>('/uploads/fotos', formulario, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: TIMEOUT_UPLOAD_MS,
  });
  return resposta.data.fotoUrl;
}

// Decide o fotoUrl a enviar ao salvar o ponto, a partir do que esta na tela:
// sem foto -> '', foto que ja esta no servidor -> o mesmo caminho,
// foto local (nova ou de cadastro antigo) -> envia e usa o caminho devolvido.
export async function resolverFotoParaSalvar(fotoUri: string | null): Promise<string> {
  if (!fotoUri) return '';

  const prefixoCompleto = `${URL_API}${PREFIXO_FOTO_SERVIDOR}`;
  if (fotoUri.startsWith(prefixoCompleto)) {
    return fotoUri.slice(URL_API.length);
  }
  if (fotoUri.startsWith(PREFIXO_FOTO_SERVIDOR)) {
    return fotoUri;
  }

  return enviarFotoPonto(fotoUri);
}
