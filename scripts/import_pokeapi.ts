import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * Utilitário de Sleep para evitar throttling agressivo na API
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function importItems() {
  console.log('--- Iniciando importação de Itens ---');
  let nextUrl: string | null = `${POKEAPI_BASE_URL}/item?limit=200`;
  let processedCount = 0;

  while (nextUrl) {
    try {
      console.log(`[Itens] Buscando lote: ${nextUrl}`);
      const response = await fetch(nextUrl);
      const data = (await response.json()) as any; // Cast rápido para silenciar o erro

      for (const item of data.results) {
        // Usa o UPSERT: Cria se não existe, atualiza se existir. Impede a inserção de itens duplicados.
        await prisma.item.upsert({
          where: { name: item.name },
          update: {},
          create: {
            name: item.name,
            description: 'Item padrão importado da PokéAPI', // Para pegar a descrição real com base na linguagem, precisaríamos fazer +1 resquest por item. Otimizado por hora.
          },
        });
        processedCount++;
      }

      console.log(`[Itens] Processados ​​até o momento: ${processedCount}. Avançando para próxima página...`);
      nextUrl = data.next;

      // Delay de cortesia para a PokeAPI
      await sleep(200);
    } catch (error) {
      console.error(`❌ Erro crítico ao importar Itens na URL ${nextUrl}:`, error);
      break;
    }
  }
  console.log(`✅ Importação de Itens completa. Total inserido/atualizado: ${processedCount} \n`);
}

async function importPokemons() {
  console.log('--- Iniciando importação de Pokémons ---');
  let nextUrl: string | null = `${POKEAPI_BASE_URL}/pokemon?limit=100`;
  let processedCount = 0;

  while (nextUrl) {
    try {
      console.log(`[Pokémons] Buscando lote: ${nextUrl}`);
      const response = await fetch(nextUrl);
      const data = (await response.json()) as any;

      for (const pkm of data.results) {
        // Para Pokémons precisamos dos detalhes (Base stats e Tipos), que requerem 1 fetch a mais
        const detailResponse = await fetch(pkm.url);
        if (!detailResponse.ok) {
          console.warn(`[Pokémons] ⚠️ Falha ao buscar detalhes do pokémon ${pkm.name}. Pulando...`);
          continue;
        }

        const detailData = await detailResponse.json();

        const pokedexId = detailData.id;
        const name = detailData.name;
        const types = detailData.types.map((t: any) => t.type.name);
        const baseStats = detailData.stats.reduce((acc: any, statInfo: any) => {
          acc[statInfo.stat.name] = statInfo.base_stat;
          return acc;
        }, {});

        // UPSERT para não causar erros de duplicidade ao rodar o script multíplas vezes
        await prisma.pokemon.upsert({
          where: { pokedexId: pokedexId },
          update: {
            name,
            types,
            baseStats,
          },
          create: {
            pokedexId,
            name,
            types,
            baseStats,
          },
        });

        processedCount++;
      }

      console.log(`[Pokémons] Processados ​​até agora: ${processedCount}. Avançando página...`);
      nextUrl = data.next;

    } catch (error) {
      console.error(`❌ Erro ao importar Pokémons na URL ${nextUrl}:`, error);
      break;
    }
  }
  console.log(`✅ Importação de Pokémons completa. Total inserido/atualizado: ${processedCount}`);
}

async function main() {
  console.log('=== 🚀 Iniciando Script Manual de Importação PokéAPI ===\n');

  await importItems();
  await importPokemons();

  console.log('\n=== 🎉 Importação Finalizada com Sucesso! ===');
}

main()
  .catch((e) => {
    console.error('💀 Erro fatal no runner do script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
