// Векторные значки снаряжения (13 семейств предметов, редкость включает слои через переменные CSS --r1..--r3).
// Стили классов gx-* лежат в src/app/magic.css. Строка статическая и пишется в коде, не приходит от пользователей.
export const GEAR_SYMBOLS = `
<symbol id="gx-sword" viewBox="0 0 100 100" overflow="visible">
  <path class="gx-a" d="M50 4 L59 22 V64 H41 V22Z"/><path class="gx-b" d="M50 4 L59 22 V64 H50Z"/>
  <rect class="gx-sh" x="48.500" y="18" width="3" height="42" rx="1.500"/>
  <g class="gx-r3"><rect class="gx-g" x="49.400" y="12" width="1.200" height="48"/><path class="gx-g" d="M80 18l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="gx-g" d="M18 36l1.500 4.500 4.500 1.500-4.500 1.500-1.500 4.500-1.500-4.500-4.500-1.500 4.500-1.500z"/></g>
  <g class="gx-r2"><path class="gx-a" d="M30 66 Q14 62 8 46 Q22 52 34 60Z"/><path class="gx-a" d="M70 66 Q86 62 92 46 Q78 52 66 60Z"/><path class="gx-b" d="M70 66 Q86 62 92 46 Q78 52 66 60Z" opacity=".5"/></g>
  <path class="gx-au" d="M28 64 H72 L68 73 H32Z"/><path class="gx-au2" d="M50 64 H72 L68 73 H50Z"/>
  <g class="gx-r1"><circle class="gx-g" cx="50" cy="68.500" r="3.500"/><circle class="gx-wh" cx="49" cy="67" r="1.200"/></g>
  <rect class="gx-lt" x="46" y="73" width="8" height="15" rx="3"/><rect class="gx-wh" x="46" y="77" width="8" height="1.500"/><rect class="gx-wh" x="46" y="82" width="8" height="1.500"/>
  <circle class="gx-au" cx="50" cy="91" r="5"/>
</symbol>
<symbol id="gx-hammer" viewBox="0 0 100 100" overflow="visible">
  <rect class="gx-wd" x="46" y="38" width="8" height="52" rx="3"/><rect class="gx-wd2" x="50" y="38" width="4" height="52"/>
  <rect class="gx-au" x="45" y="70" width="10" height="3"/><rect class="gx-au" x="45" y="77" width="10" height="3"/>
  <circle class="gx-au" cx="50" cy="92" r="4.500"/>
  <rect class="gx-b" x="14" y="18" width="10" height="20" rx="3"/><rect class="gx-b" x="76" y="18" width="10" height="20" rx="3"/>
  <g class="gx-r2"><path class="gx-a" d="M30 14 L35 2 L40 14Z"/><path class="gx-a" d="M60 14 L65 2 L70 14Z"/><path class="gx-b" d="M65 2 L70 14 H65Z"/></g>
  <rect class="gx-a" x="22" y="14" width="56" height="28" rx="6"/>
  <path class="gx-b" d="M50 14 H72 Q78 14 78 20 V36 Q78 42 72 42 H50Z"/>
  <rect class="gx-wh" x="27" y="17" width="38" height="3" rx="1.500"/>
  <rect class="gx-au" x="44" y="38" width="12" height="6" rx="2"/>
  <g class="gx-r1"><circle class="gx-g" cx="50" cy="28" r="6"/><circle class="gx-wh" cx="48" cy="26" r="2"/></g>
  <g class="gx-r3"><path class="gx-gs" d="M28 20 L36 27 L31 33 L40 40" stroke-width="2"/><path class="gx-gs" d="M72 20 L64 27 L69 33 L60 40" stroke-width="2"/><path class="gx-g" d="M86 6l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="gx-g" d="M8 56l1.500 4.500 4.500 1.500-4.500 1.500-1.500 4.500-1.500-4.500-4.500-1.500 4.500-1.500z"/></g>
</symbol>
<symbol id="gx-staff" viewBox="0 0 100 100" overflow="visible">
  <rect class="gx-wd" x="47" y="34" width="6" height="58" rx="3"/><rect class="gx-wd2" x="50" y="34" width="3" height="58"/>
  <circle class="gx-au" cx="50" cy="94" r="3.500"/>
  <g class="gx-r2"><path class="gx-a" d="M36 46 Q20 44 12 28 Q28 30 38 40Z"/><path class="gx-a" d="M64 46 Q80 44 88 28 Q72 30 62 40Z"/><path class="gx-b" d="M64 46 Q80 44 88 28 Q72 30 62 40Z" opacity=".5"/></g>
  <path d="M33 22 Q33 44 50 44 Q67 44 67 22" fill="none" stroke="#f2c46b" stroke-width="4.500" stroke-linecap="round"/>
  <g class="gx-r1"><circle class="gx-a" cx="34" cy="40" r="3"/><circle class="gx-a" cx="66" cy="40" r="3"/></g>
  <circle class="gx-g" cx="50" cy="24" r="13"/><circle class="gx-a" cx="50" cy="24" r="6" opacity=".4"/><circle class="gx-wh" cx="45" cy="19" r="4.500"/>
  <g class="gx-r3"><ellipse class="gx-gs" cx="50" cy="24" rx="26" ry="8" stroke-width="2"/><path class="gx-g" d="M82 6l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="gx-g" d="M14 10l1.500 4.500 4.500 1.500-4.500 1.500-1.500 4.500-1.500-4.500-4.500-1.500 4.500-1.500z"/></g>
</symbol>
<symbol id="gx-brush" viewBox="0 0 100 100" overflow="visible">
  <g transform="rotate(28 50 50)">
    <path class="gx-wd" d="M45.500 44 H54.500 L56 92 Q50 98 44 92Z"/><path class="gx-wd2" d="M50 44 H54.500 L56 92 Q53 95 50 96Z"/>
    <rect class="gx-b" x="44" y="32" width="12" height="15" rx="2"/><rect class="gx-a" x="44" y="36" width="12" height="3"/><rect class="gx-au" x="44" y="42" width="12" height="2"/>
    <path class="gx-g" d="M44 32 Q41 12 50 0 Q59 12 56 32Z"/><path class="gx-wh" d="M47 28 Q45 14 50 6 Q49 18 49.500 28Z"/>
  </g>
  <g class="gx-r1"><circle class="gx-g" cx="82" cy="26" r="4.500"/><circle class="gx-g" cx="90" cy="44" r="3"/><circle class="gx-a" cx="14" cy="72" r="3"/></g>
  <g class="gx-r2"><path class="gx-gs" d="M72 84 Q88 74 80 60 Q72 52 64 60" stroke-width="3"/><circle class="gx-au" cx="58" cy="52" r="3"/></g>
  <g class="gx-r3"><path class="gx-g" d="M20 20l2.500 7 7 2.500-7 2.500-2.500 7-2.500-7-7-2.500 7-2.500z"/><path class="gx-au" d="M86 76l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>
</symbol>
<symbol id="gx-banner" viewBox="0 0 100 100" overflow="visible">
  <rect class="gx-wd" x="26" y="10" width="5" height="82" rx="2"/><rect class="gx-wd2" x="29" y="10" width="2" height="82"/>
  <path class="gx-au" d="M28.500 -2 L33.500 10 H23.500Z"/><circle class="gx-au" cx="28.500" cy="94" r="3.500"/>
  <g class="gx-r2"><path class="gx-a" d="M31 58 H66 L58 66 L66 74 H31Z"/><path class="gx-b" d="M48 58 H66 L58 66 L66 74 H48Z" opacity=".6"/></g>
  <path class="gx-b" d="M31 14 H84 L72 30 L84 46 H31Z"/><path class="gx-a" d="M31 14 H84 L80 19 H31Z"/><path class="gx-sh" d="M31 40 H78 L84 46 H31Z"/>
  <path class="gx-au" d="M52 21 L54.800 27 L61.400 27.800 L56.500 32.300 L57.800 38.800 L52 35.500 L46.200 38.800 L47.500 32.300 L42.600 27.800 L49.200 27Z"/>
  <g class="gx-r1"><rect class="gx-au" x="37" y="46" width="2" height="9"/><rect class="gx-au" x="52" y="46" width="2" height="9"/><rect class="gx-au" x="67" y="46" width="2" height="7"/></g>
  <g class="gx-r3"><path class="gx-gs" d="M72 22 V38 M66 30 H78" stroke-width="2"/><path class="gx-g" d="M90 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="gx-g" d="M80 62l1.500 4.500 4.500 1.500-4.500 1.500-1.500 4.500-1.500-4.500-4.500-1.500 4.500-1.500z"/></g>
</symbol>
<symbol id="gx-armor" viewBox="0 0 100 100" overflow="visible">
  <g class="gx-r3"><path class="gx-g" d="M12 24 Q-4 56 10 96 L28 72Z" opacity=".55"/><path class="gx-g" d="M88 24 Q104 56 90 96 L72 72Z" opacity=".55"/><path class="gx-g" d="M92 6l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>
  <g class="gx-r2"><path class="gx-a" d="M14 24 L6 6 L24 16Z"/><path class="gx-a" d="M86 24 L94 6 L76 16Z"/><path class="gx-b" d="M86 24 L94 6 L76 16Z"/></g>
  <ellipse class="gx-a" cx="19" cy="28" rx="14" ry="11"/><ellipse class="gx-b" cx="81" cy="28" rx="14" ry="11"/>
  <path class="gx-a" d="M26 16 L40 12 Q50 20 60 12 L74 16 L78 44 L72 50 L70 90 H30 L28 50 L22 44Z"/>
  <path class="gx-b" d="M50 20 L60 12 L74 16 L78 44 L72 50 L70 90 H50Z"/>
  <path class="gx-sh" d="M38 12 Q50 32 62 12 L56 12 Q50 22 44 12Z"/>
  <path class="gx-wh" d="M32 20 L42 17 L40 42 L34 44Z"/>
  <rect class="gx-au" x="28" y="64" width="44" height="9" rx="2"/><rect class="gx-au2" x="46" y="62" width="8" height="13" rx="2"/>
  <path class="gx-au" d="M50 28 L59 38 L50 52 L41 38Z"/>
  <g class="gx-r1"><circle class="gx-g" cx="50" cy="39" r="4"/><circle class="gx-wh" cx="49" cy="37.500" r="1.400"/><circle class="gx-g" cx="34" cy="68.500" r="2"/><circle class="gx-g" cx="66" cy="68.500" r="2"/></g>
</symbol>
<symbol id="gx-shield" viewBox="0 0 100 100" overflow="visible">
  <g class="gx-r3"><circle class="gx-gs" cx="50" cy="50" r="52" stroke-width="2" opacity=".6"/><path class="gx-g" d="M96 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="gx-g" d="M2 84l1.500 4.500 4.500 1.500-4.500 1.500-1.500 4.500-1.500-4.500-4.500-1.500 4.500-1.500z"/></g>
  <g class="gx-r2"><path class="gx-a" d="M24 24 Q6 20 -2 2 Q18 6 30 16Z"/><path class="gx-b" d="M76 24 Q94 20 102 2 Q82 6 70 16Z"/></g>
  <path class="gx-a" d="M50 6 L84 16 V50 Q84 80 50 94 Q16 80 16 50 V16Z"/>
  <path class="gx-b" d="M50 6 L84 16 V50 Q84 80 50 94Z"/>
  <path class="gx-wh" d="M22 22 L46 13 V80 Q28 70 22 50Z"/>
  <path class="gx-aus" d="M50 15 L76 23 V50 Q76 72 50 85 Q24 72 24 50 V23Z"/>
  <path class="gx-au" d="M50 32 L54.500 44 L67 45 L57.500 53 L60.500 66 L50 59 L39.500 66 L42.500 53 L33 45 L45.500 44Z"/>
  <g class="gx-r1"><circle class="gx-g" cx="50" cy="50" r="5.500"/><circle class="gx-wh" cx="48" cy="48" r="1.800"/></g>
</symbol>
<symbol id="gx-helm" viewBox="0 0 100 100" overflow="visible">
  <g class="gx-r2"><path class="gx-a" d="M22 46 Q4 42 2 16 Q18 22 28 40Z"/><path class="gx-b" d="M78 46 Q96 42 98 16 Q82 22 72 40Z"/></g>
  <g class="gx-r1"><path class="gx-g" d="M50 14 Q66 -4 90 4 Q70 10 64 28Z"/></g>
  <path class="gx-a" d="M20 56 Q20 16 50 14 Q80 16 80 56 V68 Q80 78 72 78 H64 V62 H36 V78 H28 Q20 78 20 68Z"/>
  <path class="gx-b" d="M50 14 Q80 16 80 56 V68 Q80 78 72 78 H64 V62 H50Z"/>
  <rect class="gx-sh" x="31" y="43" width="38" height="10" rx="3" style="opacity:.7"/>
  <g class="gx-r3"><rect class="gx-g" x="36" y="45.500" width="10" height="5" rx="2"/><rect class="gx-g" x="54" y="45.500" width="10" height="5" rx="2"/></g>
  <rect class="gx-au" x="46.500" y="14" width="7" height="28" rx="2"/>
  <rect class="gx-au" x="20" y="58" width="60" height="4" rx="2"/>
  <path class="gx-wh" d="M26 40 Q28 24 44 19 L42 36Z"/>
  <g class="gx-r3"><path class="gx-g" d="M94 40l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="gx-g" d="M6 70l1.500 4.500 4.500 1.500-4.500 1.500-1.500 4.500-1.500-4.500-4.500-1.500 4.500-1.500z"/></g>
</symbol>
<symbol id="gx-crown" viewBox="0 0 100 100" overflow="visible">
  <g class="gx-r3"><ellipse class="gx-gs" cx="50" cy="20" rx="36" ry="8" stroke-width="2.500"/><path class="gx-g" d="M94 36l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="gx-g" d="M4 30l1.500 4.500 4.500 1.500-4.500 1.500-1.500 4.500-1.500-4.500-4.500-1.500 4.500-1.500z"/></g>
  <g class="gx-r2"><path class="gx-a" d="M18 68 Q2 62 -2 44 Q14 46 22 60Z"/><path class="gx-b" d="M82 68 Q98 62 102 44 Q86 46 78 60Z"/></g>
  <path class="gx-a" d="M18 64 L16 30 L34 48 L50 20 L66 48 L84 30 L82 64Z"/><path class="gx-b" d="M50 20 L66 48 L84 30 L82 64 H50Z"/>
  <path class="gx-au" d="M16 78 H84 L82 62 H18Z"/><path class="gx-au2" d="M50 62 H82 L84 78 H50Z"/>
  <circle class="gx-au" cx="16" cy="28" r="4.500"/><circle class="gx-au" cx="50" cy="17" r="5"/><circle class="gx-au" cx="84" cy="28" r="4.500"/>
  <g class="gx-r1"><path class="gx-g" d="M50 38 L59 52 L50 64 L41 52Z"/><path class="gx-wh" d="M50 38 L45 50 L50 52Z"/><circle class="gx-g" cx="30" cy="70" r="3.500"/><circle class="gx-g" cx="70" cy="70" r="3.500"/></g>
</symbol>
<symbol id="gx-boots" viewBox="0 0 100 100" overflow="visible">
  <g class="gx-r3"><path class="gx-gs" d="M2 62 H20 M0 72 H16 M4 82 H18" stroke-width="2.500"/><path class="gx-g" d="M90 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>
  <g class="gx-r1"><path class="gx-g" d="M32 30 Q14 28 6 10 Q24 12 34 24Z"/></g>
  <g class="gx-r2"><path class="gx-g" d="M32 40 Q16 40 8 26 Q24 26 34 34Z" opacity=".75"/><circle class="gx-g" cx="46" cy="16" r="3.500"/><path class="gx-au" d="M24 84 L14 90 L26 92Z"/></g>
  <path class="gx-a" d="M32 10 H60 V50 Q60 56 68 58 L88 64 Q96 68 94 78 V86 H30Z"/>
  <path class="gx-b" d="M70 60 L88 64 Q96 68 94 78 V86 H70Z"/>
  <path class="gx-sh" d="M30 74 H94 V86 H30Z" style="opacity:.2"/>
  <path class="gx-sole" d="M28 86 H96 V93 H28Z"/>
  <rect class="gx-au" x="30" y="10" width="30" height="12" rx="3"/>
  <path class="gx-aus" d="M38 30 H54 M38 38 H54 M38 46 H54" stroke-width="2"/>
  <rect class="gx-wh" x="35" y="52" width="5" height="22" rx="2"/>
</symbol>
<symbol id="gx-sandals" viewBox="0 0 100 100" overflow="visible">
  <g class="gx-r3"><path class="gx-gs" d="M0 72 H14 M-4 82 H12" stroke-width="2.500"/><path class="gx-g" d="M90 24l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>
  <g class="gx-r2"><path class="gx-a" d="M32 44 Q18 36 14 18 Q30 22 38 38Z"/></g>
  <g class="gx-r1"><path class="gx-g" d="M30 58 Q12 58 2 44 Q20 42 34 52Z" opacity=".85"/></g>
  <path class="gx-g" d="M28 52 Q12 50 4 32 Q22 32 34 44Z"/>
  <path class="gx-a" d="M30 56 Q30 44 42 44 H56 L68 56 H88 Q96 58 96 68 V76 H30Z"/>
  <path class="gx-b" d="M78 56 H88 Q96 58 96 68 V76 H78Z"/>
  <path class="gx-sole" d="M28 74 H98 V82 H28Z"/>
  <path class="gx-au" d="M44 44 L50 56 H60 L56 44Z"/>
  <rect class="gx-wh" x="34" y="48" width="18" height="3" rx="1.500"/>
</symbol>
<symbol id="gx-amulet" viewBox="0 0 100 100" overflow="visible">
  <path d="M14 4 Q50 44 86 4" fill="none" stroke="#f2c46b" stroke-width="3" stroke-linecap="round"/>
  <g class="gx-r1"><circle class="gx-g" cx="28" cy="16" r="3.200"/><circle class="gx-g" cx="72" cy="16" r="3.200"/></g>
  <g class="gx-r3"><path class="gx-gs" d="M50 30 V22 M24 54 L16 48 M76 54 L84 48 M28 80 L20 86 M72 80 L80 86" stroke-width="2.500"/><path class="gx-g" d="M90 70l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>
  <g class="gx-r2"><path class="gx-a" d="M33 58 Q16 54 8 38 Q26 38 38 50Z"/><path class="gx-b" d="M67 58 Q84 54 92 38 Q74 38 62 50Z"/></g>
  <path class="gx-g" d="M50 40 L68 56 L50 94 L32 56Z"/>
  <path class="gx-wh" d="M50 40 L32 56 L50 64Z"/><path class="gx-sh" d="M50 64 L68 56 L50 94Z" style="opacity:.25"/>
  <path class="gx-aus" d="M50 40 L68 56 L50 94 L32 56Z" stroke-width="3.500"/>
  <circle class="gx-aus" cx="50" cy="35" r="4"/>
</symbol>
<symbol id="gx-medal" viewBox="0 0 100 100" overflow="visible">
  <path class="gx-b" d="M34 2 L50 38 L66 2 H58 L50 20 L42 2Z"/><path class="gx-a" d="M42 2 L50 20 L58 2Z" style="opacity:.55"/>
  <g class="gx-r3"><path class="gx-gs" d="M50 24 V16 M88 62 H96 M4 62 H12 M50 100 V108 M78 34 L84 28 M22 34 L16 28 M78 90 L84 96 M22 90 L16 96" stroke-width="2.500"/><path class="gx-g" d="M92 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>
  <g class="gx-r2"><path class="gx-a" d="M22 58 Q8 54 2 40 Q18 40 26 50Z"/><path class="gx-b" d="M78 58 Q92 54 98 40 Q82 40 74 50Z"/></g>
  <circle class="gx-au" cx="50" cy="64" r="30"/><path class="gx-au2" d="M50 34 A30 30 0 0 1 50 94Z"/>
  <circle class="gx-a" cx="50" cy="64" r="22"/><path class="gx-b" d="M50 42 A22 22 0 0 1 50 86Z"/>
  <path class="gx-g" d="M50 50 L54 60 L65 61 L57 68 L59 79 L50 73 L41 79 L43 68 L35 61 L46 60Z"/>
  <g class="gx-r1"><circle class="gx-wh" cx="50" cy="39" r="2"/><circle class="gx-wh" cx="73" cy="51" r="2"/><circle class="gx-wh" cx="73" cy="77" r="2"/><circle class="gx-wh" cx="50" cy="89" r="2"/><circle class="gx-wh" cx="27" cy="77" r="2"/><circle class="gx-wh" cx="27" cy="51" r="2"/></g>
</symbol>
<symbol id="gx-lute" viewBox="0 0 100 100" overflow="visible">
  <g transform="rotate(30 50 60)">
    <rect class="gx-wd" x="46" y="8" width="8" height="48" rx="2"/><rect class="gx-wd2" x="42" y="0" width="16" height="13" rx="3"/>
    <circle class="gx-au" cx="40" cy="4" r="2.200"/><circle class="gx-au" cx="60" cy="4" r="2.200"/>
    <ellipse class="gx-au" cx="50" cy="70" rx="25" ry="28"/><ellipse class="gx-a" cx="50" cy="70" rx="19" ry="22"/>
    <path class="gx-b" d="M50 48 A19 22 0 0 1 50 92Z"/>
    <circle class="gx-sh" cx="50" cy="68" r="7"/><circle class="gx-aus" cx="50" cy="68" r="10" stroke-width="2"/>
    <path d="M49 10 V92 M51 10 V92" stroke="#fff" stroke-opacity=".6" stroke-width=".8" fill="none"/>
    <g class="gx-r1"><circle class="gx-g" cx="50" cy="52" r="3.500"/></g>
  </g>
  <g class="gx-r2"><circle class="gx-g" cx="12" cy="40" r="4"/><rect class="gx-g" x="14.500" y="18" width="2.500" height="22"/><path class="gx-g" d="M17 18 Q26 20 27 28 Q22 24 17 24Z"/></g>
  <g class="gx-r3"><path class="gx-g" d="M86 14l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="gx-g" d="M90 70l1.500 4.500 4.500 1.500-4.500 1.500-1.500 4.500-1.500-4.500-4.500-1.500 4.500-1.500z"/></g>
</symbol>
`;
