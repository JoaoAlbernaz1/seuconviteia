import type { SVGProps } from "react";

/**
 * Ícones de linha fina (stroke 1.4, cantos redondos) — substituem os glifos
 * unicode. Traço leve/preciso combina com o clima editorial premium.
 */
type IconName =
  | "check"
  | "rsvp"
  | "gift"
  | "camera"
  | "message"
  | "clock"
  | "link"
  | "calendar"
  | "sparkle"
  | "arrow"
  | "heart"
  | "cake"
  | "users"
  | "edit"
  | "globe"
  | "panel"
  | "layers"
  | "share"
  | "palette";

const PATHS: Record<IconName, React.ReactNode> = {
  check: <path d="M4 12.5l5 5L20 6.5" />,
  rsvp: (
    <>
      <path d="M4 6.5h16v12H4z" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  gift: (
    <>
      <path d="M4 11h16v9H4z" />
      <path d="M4 8h16v3H4zM12 8v12" />
      <path d="M12 8S10.5 3.5 8.5 4.2 9.8 8 12 8zM12 8s1.5-4.5 3.5-3.8S14.2 8 12 8z" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5h4l1.5-2h7L17 8.5h4v11H3z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </>
  ),
  message: <path d="M4 5.5h16v11H9l-4 3v-3H4z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M8 12l-2 2a3 3 0 004.2 4.2l2-2" />
      <path d="M16 12l2-2A3 3 0 0013.8 5.8l-2 2" />
    </>
  ),
  calendar: (
    <>
      <path d="M4 6.5h16v14H4z" />
      <path d="M4 10h16M8 4v4M16 4v4" />
    </>
  ),
  sparkle: <path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z" />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  heart: <path d="M12 20s-7-4.6-7-9.5A3.9 3.9 0 0112 8a3.9 3.9 0 017 2.5C19 15.4 12 20 12 20z" />,
  cake: (
    <>
      <path d="M4 20h16M5 20v-7h14v7" />
      <path d="M5 13c1.2 0 1.2 1.2 2.4 1.2S8.6 13 9.8 13s1.2 1.2 2.4 1.2S13.4 13 14.6 13s1.2 1.2 2.4 1.2S18.2 13 19 13" />
      <path d="M12 9.5V5m0 4.5c-.8 0-1.4-.6-1.4-1.4S12 5.4 12 5.4s1.4 1.5 1.4 2.7-.6 1.4-1.4 1.4z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0111 0" />
      <path d="M16 6a3 3 0 010 5.5M20.5 19a5.5 5.5 0 00-4-5.3" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h16" />
      <path d="M14.5 5.5l3 3L9 17l-3.5.5L6 14z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.3-3.6-8.5S9.6 5.8 12 3.5z" />
    </>
  ),
  panel: (
    <>
      <path d="M4 5.5h16v13H4z" />
      <path d="M4 9.5h16M8 9.5v9" />
    </>
  ),
  layers: <path d="M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M8.2 10.9l7.6-3.8M8.2 13.1l7.6 3.8" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 000 17c1.4 0 2-1 2-2 0-1.4 1-2 2.2-2H18a3 3 0 003-3c0-4.7-4-7-9-7z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="11" cy="7.5" r="1" />
      <circle cx="15.5" cy="8.5" r="1" />
    </>
  ),
};

export function Icon({
  name,
  size = 22,
  ...rest
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
