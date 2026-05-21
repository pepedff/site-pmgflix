// ============================================
// AI Nexus Hub — SVG Icons for each AI Provider
// ============================================

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const ChatGPTIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

export const ClaudeIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M17.308 3.616L12.44 20.384h-2.832L4.692 6.656h2.712l3.504 11.088h.072L14.596 3.616h2.712zM6.396 3.616L12 20.384H9.168L3.564 3.616h2.832zm11.208 0l5.616 16.768h-2.832L14.784 3.616h2.82z" />
  </svg>
);

export const GeminiIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z"/>
  </svg>
);

export const GrokIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M2.04 4.71l6.27 8.87L2 19.29h1.42l5.52-4.99 4.46 4.99H20l-6.63-9.37L19.25 4.71H17.84L12.73 9.3 8.6 4.71H2.04zM4.17 5.79h2.21l11.48 12.42h-2.21L4.17 5.79z" />
  </svg>
);

export const DeepSeekIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-2.2c-1.61-.23-3.07-.97-4.16-2.1l1.42-1.42c.88.88 2.02 1.43 3.24 1.58V9.5H9.5V8h5v1.5h-2v3.86c1.22-.15 2.36-.7 3.24-1.58l1.42 1.42c-1.09 1.13-2.55 1.87-4.16 2.1v2.2H11z" />
  </svg>
);

export const PerplexityIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M12.005 1L5 6.286V12.54l2.995-2.217V7.21L12.005 4l4.005 3.21v3.113L19 12.54V6.286L12.005 1zM19 13.656l-2.99 2.214v3.077L12.005 22l-4.01-3.053v-3.077L5 13.656v6.058L12.005 24 19 19.714v-6.058zM5 12.896L7.995 15.1l4.01-2.967-3-2.219L5 12.896zm7.005 2.207L16.01 18l2.99-2.214-3.995-2.967-4 2.284zM12 10l3 2.219 4.005-2.967L16.01 7.1 12 10zm-4.995-.748l-2.01 1.54L8 12.848l2-1.54-2.995-2.056z"/>
  </svg>
);

export const MistralIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <rect x="1" y="3" width="4" height="4" /><rect x="19" y="3" width="4" height="4" />
    <rect x="1" y="9" width="4" height="4" /><rect x="7" y="9" width="4" height="4" /><rect x="19" y="9" width="4" height="4" />
    <rect x="1" y="15" width="4" height="4" /><rect x="7" y="15" width="4" height="4" /><rect x="13" y="15" width="4" height="4" /><rect x="19" y="15" width="4" height="4" />
    <rect x="13" y="9" width="4" height="4" /><rect x="13" y="3" width="4" height="4" />
  </svg>
);

export const CohereIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M9.533 9.059c1.477 0 4.9-.073 6.594-1.564 1.476-1.297 1.789-3.235 1.789-4.277 0-1.708-1.331-3.218-4.073-3.218H6.845C4.318 0 2 2.217 2 5.116v13.761C2 21.775 4.318 24 6.845 24h.15c2.529 0 4.847-2.225 4.847-5.123v-3.94c0-3.22-1.045-5.878-2.309-5.878zm5.66 6.263c0-1.993 1.547-3.609 3.454-3.609h.003c.748 0 1.35.646 1.35 1.44v5.778C20 21.026 18.412 24 15.38 24h-.128c-.035 0-.059-.027-.059-.062v-8.616z" />
  </svg>
);

export const MidjourneyIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M1.6 1.53l3.32 5.77 2.37-2.5L4.4 1.53H1.6zm5.24 0L12 10l5.16-8.47h-2.8L12 5.63 9.64 1.53H6.84zm11.77 0L15.7 4.8l2.38 2.5 3.32-5.77h-2.8zm-6.6 10.6L8.77 6.4 5.1 10.27l4.15 7.2 2.77-5.34zm0 0l2.76 5.34 4.16-7.2L15.24 6.4l-3.24 5.73zM12 14.78L9.74 19.1c.72.43 1.45.87 2.26 1.37.8-.5 1.54-.94 2.25-1.37L12 14.78z" />
  </svg>
);

export const LeonardoIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.28 8 12 11.82 4.72 8 12 4.18zM4 9.34l7 3.5V19.5l-7-3.5V9.34zm16 0v6.66l-7 3.5v-6.66l7-3.5z" />
  </svg>
);

export const RunwayIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M3 3h18v18H3V3zm2 2v14h14V5H7zm2 3h10v2H7V8zm0 4h7v2H7v-2z" />
  </svg>
);

export const ElevenLabsIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <rect x="9" y="2" width="2.5" height="20" rx="1.25" />
    <rect x="14" y="2" width="2.5" height="20" rx="1.25" />
  </svg>
);

export const SunoIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 14.5v-9l7 4.5-7 4.5z" />
  </svg>
);

// ── Icon Map ──────────────────────────────────────────

export const aiIconMap: Record<string, React.FC<IconProps>> = {
  chatgpt: ChatGPTIcon,
  claude: ClaudeIcon,
  gemini: GeminiIcon,
  grok: GrokIcon,
  deepseek: DeepSeekIcon,
  perplexity: PerplexityIcon,
  mistral: MistralIcon,
  cohere: CohereIcon,
  midjourney: MidjourneyIcon,
  leonardo: LeonardoIcon,
  runway: RunwayIcon,
  elevenlabs: ElevenLabsIcon,
  suno: SunoIcon,
};

export function getAIIcon(slug: string): React.FC<IconProps> {
  return aiIconMap[slug] || ChatGPTIcon;
}
