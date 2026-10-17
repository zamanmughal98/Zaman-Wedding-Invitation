// Original vector artwork. Uses CSS theme colours, so it changes with the theme.
export function botanical(className = '') {
  return /* HTML */ `
    <svg class="botanical ${className}" viewBox="0 0 180 300" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="1.1">
        <path
          d="M26 292C65 243 52 192 94 139C115 111 137 74 150 17M66 218C42 191 32 167 34 144M87 151C61 123 56 96 60 67M105 120C137 113 155 98 167 72M137 62C121 46 116 30 120 9"
        />
        <path
          d="M57 240C27 239 16 224 11 207C32 206 51 218 57 240ZM67 211C91 204 104 184 100 166C79 174 67 191 67 211ZM85 165C61 168 42 154 35 133C59 130 81 142 85 165ZM99 135C121 138 143 124 146 105C120 104 106 117 99 135ZM117 100C97 99 80 78 83 59C102 64 117 80 117 100ZM133 65C151 63 168 47 169 29C151 33 136 46 133 65ZM145 34C132 24 134 11 143 2C153 14 153 23 145 34Z"
          fill="currentColor"
          fill-opacity=".12"
        />
        <circle cx="34" cy="138" r="4" />
        <circle cx="60" cy="61" r="3" />
        <circle cx="166" cy="68" r="3" />
      </g>
      <g fill="currentColor" fill-opacity=".7">
        <ellipse cx="40" cy="188" rx="3" ry="7" transform="rotate(-33 40 188)" />
        <ellipse cx="98" cy="189" rx="3" ry="7" transform="rotate(32 98 189)" />
      </g>
    </svg>
  `;
}

export function scene(kind = 'palace', className = '') {
  const garden = kind === 'garden';
  const building = `<g stroke="currentColor" stroke-width="1.4" fill="none"><path d="M108 245V139H292V245M125 139V103H275V139M145 103C145 74 179 70 200 42C221 70 255 74 255 103ZM200 42V22M194 27H206M88 245V94H108M292 94H312V245M85 94H111L98 74ZM289 94H315L302 74Z"/><path d="M176 245V171Q176 151 200 136Q224 151 224 171V245M126 196V164Q138 145 150 164V196ZM250 196V164Q262 145 274 164V196Z"/><path d="M80 245H320M70 254H330M62 263H338M125 139H275M145 103H255"/><path d="M158 127V114M175 127V114M192 127V114M209 127V114M226 127V114M243 127V114"/></g>`;
  const arch = `<g stroke="currentColor" fill="none"><path stroke-width="2" d="M110 263V152C110 104 158 83 200 39C242 83 290 104 290 152V263Z"/><path stroke-width="1" d="M123 263V154C123 113 167 93 200 58C233 93 277 113 277 154V263M140 263V163C140 130 174 113 200 85C226 113 260 130 260 163V263"/><path d="M106 263H294M98 272H302M90 281H310M110 190H123M277 190H290"/><path d="M188 170Q200 153 212 170V203H188Z"/><path d="M200 203V227M182 227H218"/></g>`;
  const trees = `<g stroke="currentColor" stroke-width="1" fill="currentColor" fill-opacity=".07"><path d="M42 256V170M42 239C13 228 14 210 42 201C65 210 70 227 42 239ZM42 209C20 197 22 183 42 176C61 184 64 197 42 209ZM358 256V170M358 239C330 227 335 210 358 201C386 210 387 228 358 239ZM358 209C336 197 339 184 358 176C378 183 380 197 358 209Z"/></g>`;
  return /* HTML */ `
    <svg class="scene ${className}" viewBox="0 0 400 300" fill="none" aria-hidden="true">
      <circle cx="200" cy="128" r="106" fill="currentColor" fill-opacity=".035" />
      <circle cx="200" cy="128" r="95" stroke="currentColor" stroke-opacity=".12" />
      ${kind === 'arch' ? arch : building}${trees}${garden ? '<g stroke="currentColor" stroke-width="1"><path d="M120 278Q200 251 280 278Q200 300 120 278ZM200 279V264M193 271Q200 249 207 271"/><path d="M50 273H100M300 273H350"/></g>' : ''}
      <g fill="currentColor">
        <path d="M66 96l2-6 2 6 6 2-6 2-2 6-2-6-6-2ZM332 119l2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" />
        <circle cx="320" cy="63" r="2" />
        <circle cx="80" cy="135" r="1.5" />
      </g>
    </svg>
  `;
}

export function flourish() {
  return '<div class="flourish" aria-hidden="true"><span></span><svg viewBox="0 0 24 24"><path d="M12 1C12 8 16 12 23 12C16 12 12 16 12 23C12 16 8 12 1 12C8 12 12 8 12 1Z" fill="currentColor"/></svg><span></span></div>';
}
