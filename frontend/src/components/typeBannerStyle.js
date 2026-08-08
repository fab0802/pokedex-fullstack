import { typeColors } from "./typeColors";
import { typeBanners } from "./typeBanners";
import { typeBannerOverlays } from "./typeBannerOverlays";

// Baut den Hintergrund-Style fuer Typ-Banner (Detail) und Listenkarten.
//
// Die Typ-SVGs (typeBanners) sind deckend: sie malen die Typ-Farbe selbst
// ueber die ganze Flaeche. Fuer Dual-Typen wuerde ein Verlauf darunter also
// verdeckt. Darum:
//   Einzeltyp -> Typ-Farbe + deckendes Typ-SVG (wie gehabt).
//   Dual-Typ  -> Verlauf zwischen beiden Typ-Farben, darueber das transparente
//                Muster-Overlay (Muster + Vignette) des ersten Typs. So sieht
//                die Karte gemustert aus wie die Einzeltypen und traegt beide
//                Typ-Farben.
// Bei mehreren background-image-Layern liegt der erste oben.
export function typeBannerStyle(types) {
  const colorA = typeColors[types[0]];
  const colorB = types[1] ? typeColors[types[1]] : null;

  if (colorB) {
    const overlay = typeBannerOverlays[types[0]];
    const blend = `linear-gradient(135deg, ${colorA} 0%, ${colorB} 100%)`;
    return {
      backgroundColor: colorA,
      backgroundImage: overlay ? `url("${overlay}"), ${blend}` : blend,
    };
  }

  const banner = typeBanners[types[0]];
  return {
    backgroundColor: colorA,
    backgroundImage: banner ? `url("${banner}")` : undefined,
  };
}
