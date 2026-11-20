import { CLASS_HERO_ART } from './classHeroArt';

/** Портрет класса в полный рост: воин, маг, бард или паладин. */
export function ClassHero({ cls, width = 140 }: { cls: 'w' | 'm' | 'b' | 'p'; width?: number }) {
  const a = CLASS_HERO_ART[cls];
  return <svg className="class-hero" role="img" aria-label={a.label} width={width} height={Math.round((width * 380) / 240)} viewBox="0 0 240 380" dangerouslySetInnerHTML={{ __html: a.svg }} />;
}
