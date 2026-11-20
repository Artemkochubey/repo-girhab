// Портреты четырёх классов (воин, маг, бард, паладин) в полный рост. Статические строки из кода.
export const CLASS_HERO_ART: Record<'w' | 'm' | 'b' | 'p', { label: string; svg: string }> = {
  w: { label: "Воин в стальных доспехах с мечом и круглым щитом", svg: `
<ellipse cx="120" cy="364" rx="92" ry="12" fill="#e8574a" opacity=".4"/>
      <path d="M94 246 H118 L116 338 H90 Z" fill="#2c2060"/><path d="M122 246 H146 L150 338 H124 Z" fill="#2c2060"/>
      <path d="M84 332 H118 V358 H76 Q74 340 84 332Z" fill="#7f8db0"/><path d="M122 332 H156 Q166 340 164 358 H122 Z" fill="#7f8db0"/>
      <path d="M84 332 H118 V342 H84Z" fill="#b8c4de"/><path d="M122 332 H156 V342 H122Z" fill="#b8c4de"/>
      <path d="M92 188 H148 L152 262 L120 276 L88 262 Z" fill="#e8574a"/><path d="M120 188 H148 L152 262 L120 276 Z" fill="#a02a22"/>
      <path d="M114 196 H126 V270 H114 Z" fill="#f2c46b"/>
      <rect x="110" y="110" width="20" height="26" fill="#e8b48c"/>
      <path d="M86 130 H154 L160 192 Q120 210 80 192 Z" fill="#b8c4de"/><path d="M120 130 H154 L160 192 Q140 203 120 206 Z" fill="#7f8db0"/>
      <rect x="80" y="188" width="80" height="11" rx="5" fill="#f2c46b"/>
      <path d="M120 142 L133 156 L120 176 L107 156 Z" fill="#e8574a"/><path d="M120 142 L133 156 L120 176 Z" fill="#a02a22"/>
      <circle cx="120" cy="92" r="28" fill="#f6c9a0"/>
      <circle cx="110" cy="96" r="2.6" fill="#2a1a4a"/><circle cx="130" cy="96" r="2.6" fill="#2a1a4a"/>
      <path d="M112 106 Q120 112 128 106" stroke="#b5654a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M88 98 Q84 54 120 50 Q156 54 152 98 L144 98 L142 78 H98 L96 98 Z" fill="#b8c4de"/>
      <path d="M120 50 Q156 54 152 98 L144 98 L142 78 H120 Z" fill="#7f8db0"/>
      <rect x="118" y="70" width="5" height="24" rx="2" fill="#7f8db0"/>
      <path d="M120 50 Q142 24 174 34 Q154 40 144 62 Z" fill="#e8574a"/>
      <ellipse cx="82" cy="136" rx="21" ry="15" fill="#b8c4de"/><ellipse cx="158" cy="136" rx="21" ry="15" fill="#b8c4de"/>
      <path d="M82 121 A21 15 0 0 1 103 136 H82Z" fill="#7f8db0" opacity=".0"/>
      <path d="M80 140 L58 186 L76 196 L96 150 Z" fill="#7f8db0"/>
      <circle cx="58" cy="196" r="9" fill="#f6c9a0"/>
      <circle cx="42" cy="208" r="42" fill="#7f8db0"/><circle cx="42" cy="208" r="34" fill="#e8574a"/>
      <path d="M42 174 A34 34 0 0 1 76 208 H42Z" fill="#a02a22"/><circle cx="42" cy="208" r="11" fill="#f2c46b"/><circle cx="42" cy="208" r="5" fill="#ffe39a"/>
      <path d="M160 140 L196 188 L180 200 L150 152 Z" fill="#7f8db0"/>
      <rect x="186" y="74" width="11" height="110" rx="2" fill="#dfe8ff"/><path d="M186 74 L191.500 50 L197 74 Z" fill="#dfe8ff"/>
      <rect x="191.500" y="74" width="5.500" height="110" fill="#9fb0d8"/><path d="M191.500 50 L197 74 H191.500Z" fill="#9fb0d8"/>
      <rect x="172" y="182" width="40" height="8" rx="3" fill="#f2c46b"/><rect x="188" y="190" width="7" height="14" fill="#5a2f8f"/><circle cx="191.500" cy="208" r="5" fill="#f2c46b"/>
      <circle cx="190" cy="194" r="8.500" fill="#f6c9a0"/>
      <path class="ch-tw" d="M214 70l2.500 7 7 2.500-7 2.500-2.500 7-2.500-7-7-2.500 7-2.500z" fill="#ffe39a"/>
` },
  m: { label: "Маг в остроконечной шляпе с посохом и светящимся шаром", svg: `
<ellipse cx="120" cy="364" rx="92" ry="12" fill="#9a63ff" opacity=".45"/>
      <ellipse cx="104" cy="352" rx="19" ry="8" fill="#2c2060"/><ellipse cx="138" cy="352" rx="19" ry="8" fill="#2c2060"/>
      <path d="M92 126 H148 L178 262 Q120 294 62 262 Z" fill="#6d4bd6"/><path d="M120 126 H148 L178 262 Q150 280 120 284 Z" fill="#4a31a8"/>
      <path d="M110 128 H130 L138 272 Q120 276 102 272 Z" fill="#8ff0d9" opacity=".2"/>
      <path d="M62 262 Q120 294 178 262" fill="none" stroke="#8ff0d9" stroke-width="5" stroke-linecap="round"/>
      <rect x="90" y="180" width="60" height="9" rx="4" fill="#f2c46b"/><rect x="115" y="177" width="10" height="15" rx="2" fill="#ffe39a"/>
      <path d="M86 128 Q120 152 154 128 L160 148 Q120 174 80 148 Z" fill="#8ff0d9"/>
      <rect x="110" y="112" width="20" height="20" fill="#e8b48c"/>
      <circle cx="120" cy="98" r="26" fill="#f6c9a0"/>
      <path d="M94 100 Q92 78 120 76 Q148 78 146 100 Q138 88 120 88 Q102 88 94 100Z" fill="#6b3b22"/>
      <circle cx="110" cy="102" r="2.6" fill="#2a1a4a"/><circle cx="130" cy="102" r="2.6" fill="#2a1a4a"/>
      <path d="M113 111 Q120 116 127 111" stroke="#b5654a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="76" rx="48" ry="10" fill="#5438c0"/>
      <path d="M86 76 Q100 46 114 20 Q122 2 140 8 Q130 12 130 26 Q132 54 154 76 Z" fill="#7a56e8"/>
      <path d="M120 8 Q130 12 130 26 Q132 54 154 76 H120Z" fill="#5f40c8" opacity=".6"/>
      <path d="M92 68 Q120 78 148 68 L151 76 Q120 87 89 76Z" fill="#f2c46b"/>
      <path d="M118 36 l2.600 7.400 7.400 2.600-7.400 2.600-2.600 7.400-2.600-7.400-7.400-2.600 7.400-2.600z" fill="#ffe39a"/>
      <rect x="64" y="52" width="7" height="304" rx="3" fill="#7a4a24"/><rect x="67.500" y="52" width="3.500" height="304" fill="#5a3416"/>
      <circle cx="67.500" cy="38" r="28" fill="#8ff0d9" opacity=".18"/><circle cx="67.500" cy="38" r="26" fill="none" stroke="#8ff0d9" stroke-width="2" opacity=".6" class="ch-ring"/>
      <path d="M50 42 Q50 62 67.500 62 Q85 62 85 42" fill="none" stroke="#f2c46b" stroke-width="5" stroke-linecap="round"/>
      <circle cx="67.500" cy="38" r="16" fill="#8ff0d9"/><circle cx="62" cy="32" r="5.500" fill="#fff" opacity=".7"/>
      <path d="M92 134 L64 192 L82 202 L106 152 Z" fill="#6d4bd6"/><circle cx="70" cy="198" r="8.500" fill="#f6c9a0"/>
      <path d="M148 134 L184 172 L172 186 L140 152 Z" fill="#6d4bd6"/><circle cx="180" cy="178" r="8.500" fill="#f6c9a0"/>
      <path class="ch-tw" d="M206 148l3 8.500 8.500 3-8.500 3-3 8.500-3-8.500-8.500-3 8.500-3z" fill="#8ff0d9"/>
      <path class="ch-tw2" d="M216 190l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffe39a"/>
      <path class="ch-tw" d="M196 206l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#d9b8ff"/>
` },
  b: { label: "Бард в шляпе с пером и лютней", svg: `
<ellipse cx="120" cy="364" rx="92" ry="12" fill="#ff7ac8" opacity=".4"/>
      <path d="M96 236 H118 L114 338 H92Z" fill="#2e8f88"/><path d="M122 236 H144 L148 338 H124Z" fill="#2e8f88"/>
      <path d="M104 236 H118 L116 338 H108Z" fill="#8ff0d9" opacity=".35"/><path d="M130 236 H144 L146 338 H138Z" fill="#8ff0d9" opacity=".35"/>
      <path d="M88 302 H118 V356 H78 Q76 322 88 302Z" fill="#4b2f8f"/><path d="M122 302 H152 Q164 322 162 356 H122Z" fill="#4b2f8f"/>
      <rect x="86" y="302" width="32" height="9" fill="#f2c46b"/><rect x="122" y="302" width="32" height="9" fill="#f2c46b"/>
      <path d="M78 140 L58 232 Q82 246 98 238 Z" fill="#d9479f"/>
      <path d="M90 128 H150 L166 246 Q120 266 74 246 Z" fill="#ff7ac8"/><path d="M120 128 H150 L166 246 Q144 258 120 262 Z" fill="#d9479f"/>
      <path d="M106 128 L120 182 L134 128 H126 L120 150 L114 128Z" fill="#8ff0d9"/>
      <circle cx="120" cy="196" r="3.500" fill="#f2c46b"/><circle cx="120" cy="214" r="3.500" fill="#f2c46b"/><circle cx="120" cy="232" r="3.500" fill="#f2c46b"/>
      <path d="M80 192 L160 212 L158 226 L78 206Z" fill="#f2c46b"/>
      <rect x="110" y="110" width="20" height="22" fill="#e8b48c"/>
      <circle cx="120" cy="94" r="27" fill="#f6c9a0"/>
      <path d="M93 96 Q88 66 120 64 Q152 66 147 96 Q146 78 120 76 Q96 78 93 96Z" fill="#c0613a"/><path d="M93 96 Q86 112 92 124 Q98 112 96 98Z" fill="#c0613a"/><path d="M147 96 Q154 112 148 124 Q142 112 144 98Z" fill="#c0613a"/>
      <circle cx="110" cy="98" r="2.600" fill="#2a1a4a"/><circle cx="130" cy="98" r="2.600" fill="#2a1a4a"/>
      <path d="M110 107 Q120 116 130 107" stroke="#b5654a" stroke-width="2.400" fill="none" stroke-linecap="round"/>
      <ellipse cx="102" cy="106" rx="5" ry="3" fill="#ff7ac8" opacity=".35"/><ellipse cx="138" cy="106" rx="5" ry="3" fill="#ff7ac8" opacity=".35"/>
      <ellipse cx="118" cy="68" rx="36" ry="14" fill="#ff7ac8" transform="rotate(-12 118 68)"/>
      <path d="M86 78 Q116 90 148 70 L150 78 Q118 98 84 86Z" fill="#8ff0d9"/>
      <path d="M142 62 Q180 36 196 6 Q192 44 154 76 Z" fill="#f2c46b"/><path d="M146 66 Q176 42 194 10" stroke="#fff1c2" stroke-width="2" fill="none"/>
      <g transform="rotate(-28 150 232)">
        <rect x="144" y="92" width="12" height="108" rx="3" fill="#7a4a24"/><rect x="139" y="76" width="22" height="20" rx="5" fill="#5a3416"/>
        <circle cx="136" cy="82" r="3" fill="#f2c46b"/><circle cx="164" cy="82" r="3" fill="#f2c46b"/><circle cx="136" cy="92" r="3" fill="#f2c46b"/><circle cx="164" cy="92" r="3" fill="#f2c46b"/>
        <ellipse cx="150" cy="238" rx="34" ry="40" fill="#e0a73a"/><ellipse cx="150" cy="238" rx="26" ry="32" fill="#c98a1d"/>
        <circle cx="150" cy="236" r="10" fill="#3a2400"/><circle cx="150" cy="236" r="14" fill="none" stroke="#ffe39a" stroke-width="2"/>
        <path d="M148 96 V262 M152 96 V262" stroke="#fff1c2" stroke-width="1" opacity=".7"/>
      </g>
      <path d="M88 136 L116 152 L106 168 L80 150 Z" fill="#ff7ac8"/><circle cx="112" cy="156" r="8.500" fill="#f6c9a0"/>
      <path d="M150 134 L184 214 L168 224 L138 150 Z" fill="#ff7ac8"/><circle cx="174" cy="224" r="8.500" fill="#f6c9a0"/>
      <g class="ch-tw" fill="#8ff0d9"><circle cx="40" cy="150" r="6"/><rect x="44" y="120" width="3.500" height="30"/><path d="M47 120 Q60 124 62 138 Q54 130 47 130Z"/></g>
      <g class="ch-tw2" fill="#ffe39a"><circle cx="206" cy="150" r="5"/><rect x="209.500" y="124" width="3" height="26"/><path d="M212.500 124 Q222 128 223 138 Q217 132 212.500 132Z"/></g>
` },
  p: { label: "Паладин в золотых доспехах с боевым молотом и щитом", svg: `
<ellipse cx="120" cy="364" rx="92" ry="12" fill="#f2c46b" opacity=".45"/>
      <path d="M88 130 H152 L186 304 Q120 334 54 304 Z" fill="#f4efff"/><path d="M120 130 H152 L186 304 Q152 320 120 324 Z" fill="#cfc4ff"/>
      <path d="M96 246 H118 L116 338 H90Z" fill="#e0a73a"/><path d="M122 246 H146 L150 338 H124Z" fill="#e0a73a"/>
      <path d="M84 332 H118 V358 H76 Q74 340 84 332Z" fill="#c98a1d"/><path d="M122 332 H156 Q166 340 164 358 H122Z" fill="#c98a1d"/>
      <path d="M92 190 H148 L150 268 L120 280 L90 268Z" fill="#f4efff"/><path d="M120 190 H148 L150 268 L120 280Z" fill="#dcd2ff"/>
      <rect x="116" y="200" width="8" height="58" rx="2" fill="#5f8fff"/><rect x="104" y="214" width="32" height="8" rx="2" fill="#5f8fff"/>
      <rect x="110" y="110" width="20" height="26" fill="#e8b48c"/>
      <path d="M86 130 H154 L160 192 Q120 210 80 192Z" fill="#f2c46b"/><path d="M120 130 H154 L160 192 Q140 203 120 206Z" fill="#c98a1d"/>
      <rect x="80" y="188" width="80" height="11" rx="5" fill="#fff1c2"/>
      <circle cx="120" cy="160" r="15" fill="#fff1c2"/><circle cx="120" cy="160" r="8" fill="#f2c46b"/>
      <path d="M120 138 V144 M120 176 V182 M98 160 H104 M136 160 H142" stroke="#fff1c2" stroke-width="3" stroke-linecap="round"/>
      <circle cx="120" cy="92" r="28" fill="#f6c9a0"/>
      <circle cx="110" cy="96" r="2.600" fill="#2a1a4a"/><circle cx="130" cy="96" r="2.600" fill="#2a1a4a"/>
      <path d="M112 106 Q120 112 128 106" stroke="#b5654a" stroke-width="2.200" fill="none" stroke-linecap="round"/>
      <path d="M88 98 Q84 54 120 50 Q156 54 152 98 L144 98 L142 78 H98 L96 98 Z" fill="#f2c46b"/>
      <path d="M120 50 Q156 54 152 98 L144 98 L142 78 H120Z" fill="#c98a1d"/>
      <path d="M92 66 Q70 54 56 28 Q84 32 100 56Z" fill="#fff1c2"/><path d="M148 66 Q170 54 184 28 Q156 32 140 56Z" fill="#fff1c2"/>
      <ellipse class="ch-ring" cx="120" cy="34" rx="36" ry="9" fill="none" stroke="#ffe39a" stroke-width="3.500"/>
      <ellipse cx="82" cy="136" rx="22" ry="15" fill="#f2c46b"/><ellipse cx="158" cy="136" rx="22" ry="15" fill="#f2c46b"/>
      <path d="M62 136 H102" stroke="#fff1c2" stroke-width="3" stroke-linecap="round"/><path d="M138 136 H178" stroke="#fff1c2" stroke-width="3" stroke-linecap="round"/>
      <path d="M80 140 L62 184 L80 192 L96 150Z" fill="#c98a1d"/>
      <path d="M26 166 H90 V214 Q90 250 58 268 Q26 250 26 214Z" fill="#f2c46b"/>
      <path d="M35 175 H81 V214 Q81 242 58 256 Q35 242 35 214Z" fill="#f4efff"/>
      <rect x="54" y="182" width="8" height="66" rx="2" fill="#5f8fff"/><rect x="40" y="202" width="36" height="8" rx="2" fill="#5f8fff"/>
      <path d="M160 140 L194 190 L178 202 L150 152Z" fill="#c98a1d"/>
      <rect x="187" y="92" width="9" height="138" rx="3" fill="#7a4a24"/>
      <rect x="160" y="64" width="62" height="34" rx="7" fill="#dfe8ff"/><rect x="191" y="64" width="31" height="34" rx="7" fill="#9fb0d8"/>
      <rect x="154" y="68" width="10" height="26" rx="3" fill="#f2c46b"/><rect x="218" y="68" width="10" height="26" rx="3" fill="#f2c46b"/>
      <circle cx="191.500" cy="81" r="7" fill="#f2c46b"/>
      <circle cx="191.500" cy="196" r="8.500" fill="#f6c9a0"/>
      <path class="ch-tw" d="M30 90l2.500 7 7 2.500-7 2.500-2.500 7-2.500-7-7-2.500 7-2.500z" fill="#fff1c2"/>
      <path class="ch-tw2" d="M214 130l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffe39a"/>
` },
};
