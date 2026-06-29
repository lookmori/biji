/**
 * undraw 风格插画 SVG 组件
 * 使用品牌绿色系，支持 currentColor 动态着色
 * 生产环境请替换为从 https://undraw.co/illustrations 下载的真实 SVG
 */

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 背景装饰圆 */}
      <circle cx="400" cy="80" r="120" fill="#E4F0E9" opacity="0.6" />
      <circle cx="100" cy="300" r="80" fill="#E4F0E9" opacity="0.4" />

      {/* 笔记本/平板设备 */}
      <rect
        x="120"
        y="60"
        width="260"
        height="200"
        rx="16"
        fill="white"
        stroke="#1F6F54"
        strokeWidth="2.5"
      />
      {/* 屏幕内容区 */}
      <rect x="136" y="76" width="228" height="140" rx="8" fill="#F7F8F3" />
      {/* 文字行 */}
      <rect x="152" y="92" width="160" height="8" rx="4" fill="#D8DFD8" />
      <rect x="152" y="110" width="196" height="6" rx="3" fill="#DCE3DC" />
      <rect x="152" y="124" width="140" height="6" rx="3" fill="#DCE3DC" />
      <rect x="152" y="138" width="180" height="6" rx="3" fill="#DCE3DC" />
      {/* 思维导图节点 */}
      <circle cx="200" cy="170" r="14" fill="#1F6F54" />
      <circle cx="250" cy="150" r="10" fill="#173E31" />
      <circle cx="260" cy="180" r="10" fill="#173E31" />
      <circle cx="245" cy="195" r="10" fill="#173E31" />
      <line x1="212" y1="168" x2="242" y2="152" stroke="#1F6F54" strokeWidth="1.5" />
      <line x1="212" y1="172" x2="252" y2="180" stroke="#1F6F54" strokeWidth="1.5" />
      <line x1="210" y1="176" x2="237" y2="194" stroke="#1F6F54" strokeWidth="1.5" />
      {/* 底部控制栏 */}
      <rect x="136" y="222" width="228" height="22" rx="6" fill="#EEF2ED" />
      <circle cx="160" cy="233" r="4" fill="#65726D" />
      <circle cx="176" cy="233" r="4" fill="#65726D" />
      <circle cx="192" cy="233" r="4" fill="#65726D" />

      {/* 钢笔/手写笔 */}
      <g transform="translate(370, 240) rotate(-30)">
        <rect x="0" y="0" width="12" height="100" rx="4" fill="#173E31" />
        <polygon points="0,100 12,100 6,128" fill="#1F6F54" />
        <rect x="2" y="20" width="8" height="30" rx="2" fill="#3D9E7A" opacity="0.5" />
      </g>

      {/* 悬浮气泡 */}
      <circle cx="420" cy="280" r="22" fill="#173E31" />
      <rect x="413" y="273" width="14" height="3" rx="1.5" fill="white" />
      <rect x="413" y="280" width="10" height="3" rx="1.5" fill="white" />
      <rect x="413" y="287" width="14" height="3" rx="1.5" fill="white" />
    </svg>
  );
}

export function DrawingIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 画布背景 */}
      <rect x="20" y="20" width="260" height="160" rx="12" fill="#EEF2ED" />
      {/* 网格线 */}
      <line x1="20" y1="60" x2="280" y2="60" stroke="#D8DFD8" strokeWidth="0.5" />
      <line x1="20" y1="100" x2="280" y2="100" stroke="#D8DFD8" strokeWidth="0.5" />
      <line x1="20" y1="140" x2="280" y2="140" stroke="#D8DFD8" strokeWidth="0.5" />
      <line x1="60" y1="20" x2="60" y2="180" stroke="#D8DFD8" strokeWidth="0.5" />
      <line x1="100" y1="20" x2="100" y2="180" stroke="#D8DFD8" strokeWidth="0.5" />
      <line x1="140" y1="20" x2="140" y2="180" stroke="#D8DFD8" strokeWidth="0.5" />
      <line x1="180" y1="20" x2="180" y2="180" stroke="#D8DFD8" strokeWidth="0.5" />
      <line x1="220" y1="20" x2="220" y2="180" stroke="#D8DFD8" strokeWidth="0.5" />
      <line x1="260" y1="20" x2="260" y2="180" stroke="#D8DFD8" strokeWidth="0.5" />
      {/* 手绘曲线 */}
      <path
        d="M50 120 Q 80 70, 110 100 T 160 80 T 210 110 T 250 60"
        stroke="#1F6F54"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* 矩形 */}
      <rect x="140" y="40" width="50" height="36" rx="3" stroke="#173E31" strokeWidth="2" fill="none" />
      {/* 圆形 */}
      <circle cx="80" cy="45" r="20" stroke="#173E31" strokeWidth="2" fill="none" />
      {/* 箭头 */}
      <line x1="180" y1="130" x2="230" y2="100" stroke="#B94B3F" strokeWidth="2" />
      <polygon points="228,96 236,102 226,104" fill="#B94B3F" />
      {/* 文字 */}
      <circle cx="60" cy="160" r="3" fill="#65726D" />
      <rect x="68" y="156" width="24" height="4" rx="2" fill="#65726D" />
      <rect x="96" y="156" width="36" height="4" rx="2" fill="#65726D" />
    </svg>
  );
}

export function MultimediaIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 图片框 */}
      <rect x="30" y="20" width="100" height="80" rx="10" fill="white" stroke="#1F6F54" strokeWidth="2" />
      {/* 图片内容 — 山景 */}
      <path d="M30 80 L60 50 L80 65 L100 40 L130 80Z" fill="#E4F0E9" />
      <circle cx="90" cy="52" r="8" fill="#F0C96B" />
      {/* 视频播放器 */}
      <rect x="150" y="30" width="120" height="75" rx="10" fill="#173E31" />
      <polygon points="200,52 200,82 228,67" fill="white" />
      <rect x="160" y="85" width="100" height="4" rx="2" fill="#3D9E7A" />
      <circle cx="160" cy="87" r="3" fill="white" opacity="0.6" />
      {/* 音频波形 */}
      <rect x="60" y="120" width="6" height="20" rx="3" fill="#1F6F54" />
      <rect x="72" y="112" width="6" height="28" rx="3" fill="#173E31" />
      <rect x="84" y="106" width="6" height="34" rx="3" fill="#1F6F54" />
      <rect x="96" y="112" width="6" height="28" rx="3" fill="#173E31" />
      <rect x="108" y="118" width="6" height="22" rx="3" fill="#1F6F54" />
      <rect x="120" y="125" width="6" height="15" rx="3" fill="#65726D" />
      {/* 播放按钮 */}
      <circle cx="180" cy="135" r="16" fill="#1F6F54" />
      <polygon points="175,127 175,143 189,135" fill="white" />
      {/* 文件卡片 */}
      <rect x="215" y="115" width="55" height="65" rx="8" fill="white" stroke="#DCE3DC" strokeWidth="1.5" />
      <rect x="225" y="130" width="35" height="4" rx="2" fill="#D8DFD8" />
      <rect x="225" y="140" width="25" height="3" rx="1.5" fill="#DCE3DC" />
      <rect x="225" y="148" width="30" height="3" rx="1.5" fill="#DCE3DC" />
    </svg>
  );
}

export function OrganizationIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 文件夹图标 */}
      <path
        d="M30 40 L30 160 Q30 170 40 170 L260 170 Q270 170 270 160 L270 60 Q270 50 260 50 L150 50 L130 40 Q125 35 118 35 L42 35 Q32 35 30 40Z"
        fill="white"
        stroke="#DCE3DC"
        strokeWidth="2"
      />
      {/* 文件夹标签 */}
      <path d="M30 40 L30 50 L120 50 L108 40Z" fill="#1F6F54" />
      {/* 文件行 */}
      <rect x="50" y="70" width="180" height="5" rx="2.5" fill="#DCE3DC" />
      <rect x="50" y="84" width="140" height="5" rx="2.5" fill="#DCE3DC" />
      <rect x="50" y="98" width="200" height="5" rx="2.5" fill="#DCE3DC" />
      <rect x="50" y="112" width="120" height="5" rx="2.5" fill="#DCE3DC" />
      <rect x="50" y="126" width="160" height="5" rx="2.5" fill="#DCE3DC" />
      <rect x="50" y="140" width="100" height="5" rx="2.5" fill="#DCE3DC" />
      {/* 搜索图标 */}
      <circle cx="230" cy="135" r="16" fill="#173E31" />
      <circle cx="228" cy="133" r="7" stroke="white" strokeWidth="2" />
      <line x1="233" y1="138" x2="239" y2="144" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* 标签 */}
      <rect x="50" y="154" width="44" height="18" rx="9" fill="#E4F0E9" />
      <rect x="56" y="159" width="32" height="3" rx="1.5" fill="#1F6F54" />
      <rect x="100" y="154" width="44" height="18" rx="9" fill="#FFF0CB" />
      <rect x="106" y="159" width="32" height="3" rx="1.5" fill="#F0C96B" />
    </svg>
  );
}
