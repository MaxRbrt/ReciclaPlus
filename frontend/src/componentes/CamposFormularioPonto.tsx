import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Cores, Fontes, Espacamento, Bordas } from '@/constantes/tema';

interface CamposFormularioPontoProps {
  nome: string;
  descricao: string;
  endereco: string;
  bairro: string;
  cidade: string;
  horario: string;
  setNome: (valor: string) => void;
  setDescricao: (valor: string) => void;
  setEndereco: (valor: string) => void;
  setBairro: (valor: string) => void;
  setCidade: (valor: string) => void;
  setHorario: (valor: string) => void;
}

export function CamposFormularioPonto({
  nome,
  descricao,
  endereco,
  bairro,
  cidade,
  horario,
  setNome,
  setDescricao,
  setEndereco,
  setBairro,
  setCidade,
  setHorario,
}: CamposFormularioPontoProps) {
  return (
    <>
      <View style={estilos.grupo}>
        <Text style={estilos.label}>Nome do ponto *</Text>
        <TextInput
          style={estilos.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Ecoponto Centro"
          placeholderTextColor={Cores.cinzaMedio}
        />
      </View>

      <View style={estilos.grupo}>
        <Text style={estilos.label}>Descrição</Text>
        <TextInput
          style={[estilos.input, estilos.inputMultilinha]}
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Informações adicionais sobre o ponto..."
          placeholderTextColor={Cores.cinzaMedio}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={estilos.grupo}>
        <Text style={estilos.label}>Endereço *</Text>
        <TextInput
          style={estilos.input}
          value={endereco}
          onChangeText={setEndereco}
          placeholder="Rua, número"
          placeholderTextColor={Cores.cinzaMedio}
        />
      </View>

      <View style={estilos.grupo}>
        <Text style={estilos.label}>Bairro *</Text>
        <TextInput
          style={estilos.input}
          value={bairro}
          onChangeText={setBairro}
          placeholder="Nome do bairro"
          placeholderTextColor={Cores.cinzaMedio}
        />
      </View>

      <View style={estilos.grupo}>
        <Text style={estilos.label}>Cidade *</Text>
        <TextInput
          style={estilos.input}
          value={cidade}
          onChangeText={setCidade}
          placeholder="Nome da cidade"
          placeholderTextColor={Cores.cinzaMedio}
        />
      </View>

      <View style={estilos.grupo}>
        <Text style={estilos.label}>Horário de funcionamento</Text>
        <TextInput
          style={estilos.input}
          value={horario}
          onChangeText={setHorario}
          placeholder="Ex: Seg a Sex, 08:00 - 18:00"
          placeholderTextColor={Cores.cinzaMedio}
        />
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  grupo: { marginBottom: Espacamento.md },
  label: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
    marginBottom: Espacamento.xs,
  },
  input: {
    backgroundColor: Cores.branco,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raio,
    paddingHorizontal: Espacamento.md,
    height: 48,
    fontSize: Fontes.normal,
    color: Cores.preto,
  },
  inputMultilinha: {
    height: 90,
    paddingTop: Espacamento.sm,
  },
});
