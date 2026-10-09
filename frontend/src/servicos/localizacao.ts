// Localizacao do usuario, distancias e geocodificacao reversa (endereco,
// bairro e cidade a partir de coordenadas).
// Usa Nominatim porque o geocoder nativo costuma omitir bairro no Android.

import * as Location from 'expo-location';

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

// Minusculas e sem acentos, para comparar nomes digitados com os gravados
// ("sao paulo" x "São Paulo", "consolacao" x "Consolação").
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

// Distancia em linha reta (formula de Haversine).
export function distanciaKm(origem: Coordenadas, destino: Coordenadas): number {
  const RAIO_TERRA_KM = 6371;
  const emRadianos = (graus: number) => (graus * Math.PI) / 180;

  const dLat = emRadianos(destino.latitude - origem.latitude);
  const dLng = emRadianos(destino.longitude - origem.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(emRadianos(origem.latitude)) *
      Math.cos(emRadianos(destino.latitude)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(a));
}

// "350 m", "1,2 km", "12 km".
export function formatarDistancia(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

// A posicao e reaproveitada entre as telas por alguns minutos, para nao
// acionar o GPS (nem o pedido de permissao) a cada aba aberta.
const VALIDADE_POSICAO_MS = 3 * 60 * 1000;
let posicaoEmCache: { promessa: Promise<Coordenadas | null>; obtidaEm: number } | null = null;

async function lerPosicaoDoGps(): Promise<Coordenadas | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const posicao = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
    };
  } catch {
    return null;
  }
}

// null quando o usuario nega a permissao ou o GPS falha.
export function obterPosicaoUsuario(): Promise<Coordenadas | null> {
  const agora = Date.now();
  if (posicaoEmCache && agora - posicaoEmCache.obtidaEm < VALIDADE_POSICAO_MS) {
    return posicaoEmCache.promessa;
  }

  const promessa = lerPosicaoDoGps();
  posicaoEmCache = { promessa, obtidaEm: agora };
  // Sem posicao (permissao negada): nao guarda, para tentar de novo depois.
  promessa.then(posicao => {
    if (!posicao && posicaoEmCache?.promessa === promessa) posicaoEmCache = null;
  });
  return promessa;
}

// Cidade onde o usuario esta. Guardada junto com a posicao que a originou.
let cidadeEmCache: { posicao: Coordenadas; cidade: string } | null = null;

export async function obterCidadeDaPosicao(posicao: Coordenadas): Promise<string | null> {
  if (cidadeEmCache && distanciaKm(cidadeEmCache.posicao, posicao) < 1) {
    return cidadeEmCache.cidade;
  }

  const endereco = await obterEnderecoPorCoordenadas(posicao.latitude, posicao.longitude);
  if (!endereco?.cidade) return null;

  cidadeEmCache = { posicao, cidade: endereco.cidade };
  return endereco.cidade;
}

interface EnderecoPorCoordenadas {
  endereco?: string;
  bairro?: string;
  cidade?: string;
}

type AtualizarCampoTexto = (atualizador: (valorAtual: string) => string) => void;

interface RespostaNominatim {
  address?: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
}

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';

async function obterEnderecoPorCoordenadas(
  latitude: number,
  longitude: number
): Promise<EnderecoPorCoordenadas | null> {
  try {
    const url =
      `${URL_NOMINATIM}?format=jsonv2&addressdetails=1&accept-language=pt-BR` +
      `&lat=${latitude}&lon=${longitude}`;

    // Evita que o auto-preenchimento trave a tela em rede lenta.
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), 8000);

    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'ReciclaPlus/1.0 (app educacional de reciclagem)',
        Accept: 'application/json',
      },
      signal: controlador.signal,
    });
    clearTimeout(timer);

    if (!resposta.ok) return null;

    const dados = (await resposta.json()) as RespostaNominatim;
    const a = dados.address ?? {};

    const endereco = [a.road ?? a.pedestrian ?? a.footway, a.house_number]
      .map(parte => (parte ? String(parte).trim() : ''))
      .filter(Boolean)
      .join(', ');

    // suburb/neighbourhood/quarter sao mais confiaveis que city_district.
    const bairro = (a.suburb ?? a.neighbourhood ?? a.quarter ?? '')
      .toString()
      .trim();

    // O Nominatim usa city, town ou village conforme o porte do municipio.
    const cidade = (a.city ?? a.town ?? a.village ?? a.municipality ?? '')
      .toString()
      .trim();

    if (!endereco && !bairro && !cidade) return null;

    return {
      endereco: endereco || undefined,
      bairro: bairro || undefined,
      cidade: cidade || undefined,
    };
  } catch {
    return null;
  }
}

export async function preencherEnderecoSeVazio(
  latitude: number,
  longitude: number,
  setEndereco: AtualizarCampoTexto,
  setBairro: AtualizarCampoTexto,
  setCidade: AtualizarCampoTexto
): Promise<void> {
  const enderecoEncontrado = await obterEnderecoPorCoordenadas(latitude, longitude);
  if (!enderecoEncontrado) return;

  if (enderecoEncontrado.endereco) {
    setEndereco(valorAtual =>
      valorAtual.trim() ? valorAtual : enderecoEncontrado.endereco ?? valorAtual
    );
  }
  if (enderecoEncontrado.bairro) {
    setBairro(valorAtual =>
      valorAtual.trim() ? valorAtual : enderecoEncontrado.bairro ?? valorAtual
    );
  }
  if (enderecoEncontrado.cidade) {
    setCidade(valorAtual =>
      valorAtual.trim() ? valorAtual : enderecoEncontrado.cidade ?? valorAtual
    );
  }
}
