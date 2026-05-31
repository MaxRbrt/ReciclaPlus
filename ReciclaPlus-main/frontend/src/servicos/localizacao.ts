// Geocodificacao reversa para sugerir endereco e bairro.
// Usa Nominatim porque o geocoder nativo costuma omitir bairro no Android.

interface EnderecoPorCoordenadas {
  endereco?: string;
  bairro?: string;
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
  };
}

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';

export async function obterEnderecoPorCoordenadas(
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

    if (!endereco && !bairro) return null;

    return {
      endereco: endereco || undefined,
      bairro: bairro || undefined,
    };
  } catch {
    return null;
  }
}

export async function preencherEnderecoSeVazio(
  latitude: number,
  longitude: number,
  setEndereco: AtualizarCampoTexto,
  setBairro: AtualizarCampoTexto
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
}
