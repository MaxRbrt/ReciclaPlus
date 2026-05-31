import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const OPCOES_IMAGEM = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3] as [number, number],
  quality: 0.8,
};

function extrairUri(resultado: ImagePicker.ImagePickerResult): string | null {
  if (resultado.canceled || !resultado.assets?.[0]) {
    return null;
  }

  return resultado.assets[0].uri;
}

export async function capturarFotoPonto(): Promise<string | null> {
  const permissao = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissao.granted) {
    Alert.alert(
      'Permissao negada',
      'Permita acesso a camera nas configuracoes do app.'
    );
    return null;
  }

  const resultado = await ImagePicker.launchCameraAsync(OPCOES_IMAGEM);
  return extrairUri(resultado);
}

export async function escolherFotoPontoDaGaleria(): Promise<string | null> {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    Alert.alert(
      'Permissao negada',
      'Permita acesso a galeria nas configuracoes do app.'
    );
    return null;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync(OPCOES_IMAGEM);
  return extrairUri(resultado);
}
