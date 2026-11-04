import type { Locale } from "../../../messages";

export type ExampleId = "article" | "interview" | "financial";

/** Short sample texts for the "Try an example" chips. Each stays under 1,200 characters. */
export const EXAMPLE_TEXTS: Record<ExampleId, Record<Locale, string>> = {
  article: {
    es:
      "La bicicleta vuelve al centro de la ciudad\n\n" +
      "Durante la última década, las grandes ciudades europeas han reducido el espacio dedicado al coche privado y han ampliado la red ciclista. " +
      "En Madrid, los desplazamientos en bicicleta pasaron de 2,1 millones al mes en 2015 a 5,4 millones en 2024, un aumento del 157 %. " +
      "Los carriles protegidos explican buena parte del cambio: donde existen, el uso se triplica en dos años.\n\n" +
      "Los urbanistas señalan tres factores. Primero, la seguridad percibida: los ciclistas prefieren calles con separación física del tráfico. " +
      "Segundo, la intermodalidad: aparcamientos junto a estaciones de metro y tren. Tercero, el coste: una bicicleta eléctrica compartida cuesta al usuario unos 0,07 euros por minuto, frente a los 0,45 de un taxi.\n\n" +
      "Quedan retos. Solo el 18 % de los trayectos al trabajo se hace en bici, y el robo sigue siendo la queja más frecuente. " +
      "Aun así, el 62 % de los vecinos encuestados quiere más carriles.",
    en:
      "The bicycle returns to the city centre\n\n" +
      "Over the past decade, large European cities have reduced the space given to private cars and expanded their cycling networks. " +
      "In Madrid, bicycle trips rose from 2.1 million a month in 2015 to 5.4 million in 2024, an increase of 157%. " +
      "Protected lanes explain much of the change: where they exist, use triples within two years.\n\n" +
      "Urban planners point to three factors. First, perceived safety: cyclists prefer streets physically separated from traffic. " +
      "Second, intermodality: parking next to metro and train stations. Third, cost: a shared electric bike costs the user about 0.07 euros per minute, against 0.45 for a taxi.\n\n" +
      "Challenges remain. Only 18% of commutes are made by bike, and theft is still the most common complaint. " +
      "Even so, 62% of surveyed residents want more lanes.",
  },
  interview: {
    es:
      "Entrevista a Lucía Ferrer, directora de una cooperativa agrícola\n\n" +
      "P: ¿Qué cambió en la cooperativa en los últimos cinco años?\n" +
      "R: Pasamos de 40 a 112 socios y de 300 a 900 hectáreas. Lo más importante fue vender directamente, sin intermediarios.\n\n" +
      "P: ¿Cómo afectó eso a los precios?\n" +
      "R: El agricultor cobra ahora un 35 % más por kilo, y el consumidor paga un 12 % menos que en el supermercado.\n\n" +
      "P: ¿Cuál fue el mayor obstáculo?\n" +
      "R: La logística. Tuvimos que montar una red de reparto con camiones refrigerados y aprender a planificar las cosechas con tres semanas de antelación.\n\n" +
      "P: ¿Y el futuro?\n" +
      "R: Queremos llegar a 200 socios en 2028 y reducir el consumo de agua un 20 % con riego por goteo en todas las parcelas.",
    en:
      "Interview with Lucía Ferrer, director of an agricultural cooperative\n\n" +
      "Q: What changed in the cooperative over the last five years?\n" +
      "A: We went from 40 to 112 members and from 300 to 900 hectares. The most important thing was selling directly, with no intermediaries.\n\n" +
      "Q: How did that affect prices?\n" +
      "A: Farmers now earn 35% more per kilo, and consumers pay 12% less than at the supermarket.\n\n" +
      "Q: What was the biggest obstacle?\n" +
      "A: Logistics. We had to build a delivery network with refrigerated trucks and learn to plan harvests three weeks ahead.\n\n" +
      "Q: And the future?\n" +
      "A: We want to reach 200 members by 2028 and cut water use by 20% with drip irrigation on every plot.",
  },
  financial: {
    es:
      "Resultados anuales 2024 · Norte Energía S.A.\n\n" +
      "Los ingresos del ejercicio ascendieron a 4.820 millones de euros, un 9 % más que en 2023 (4.422 millones). " +
      "El EBITDA fue de 1.376 millones, con un margen del 28,5 % frente al 26,9 % del año anterior. " +
      "El beneficio neto alcanzó los 512 millones, un 14 % más.\n\n" +
      "Por segmentos: renovables aportó 2.050 millones (43 %), distribución 1.690 millones (35 %) y comercialización 1.080 millones (22 %). " +
      "La deuda neta bajó de 3.900 a 3.540 millones, lo que sitúa el apalancamiento en 2,6 veces el EBITDA (2,9 en 2023).\n\n" +
      "La inversión fue de 1.150 millones, el 70 % en capacidad renovable. " +
      "El consejo propone un dividendo de 0,82 euros por acción, un 6 % superior al anterior.",
    en:
      "2024 annual results · Norte Energía S.A.\n\n" +
      "Revenue for the year reached 4,820 million euros, 9% more than in 2023 (4,422 million). " +
      "EBITDA was 1,376 million, with a margin of 28.5% against 26.9% the year before. " +
      "Net profit reached 512 million, 14% higher.\n\n" +
      "By segment: renewables contributed 2,050 million (43%), distribution 1,690 million (35%) and retail 1,080 million (22%). " +
      "Net debt fell from 3,900 to 3,540 million, putting leverage at 2.6 times EBITDA (2.9 in 2023).\n\n" +
      "Investment was 1,150 million, 70% of it in renewable capacity. " +
      "The board proposes a dividend of 0.82 euros per share, 6% above the previous one.",
  },
};

/** Content type each example should pre-select, matching ids in src/mocks/content-types.ts. */
export const EXAMPLE_CONTENT_TYPE: Record<ExampleId, "article" | "interview" | "financial"> = {
  article: "article",
  interview: "interview",
  financial: "financial",
};
