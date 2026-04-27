# EXPERT Branding Assets

Pack mínimo de branding para la web EXPERT.

## Logos

- `/branding/logos/expert-logo.png`
- `/branding/logos/expert-logo-dark.png`
- `/branding/logos/expert-isotipo.png`
- `/branding/logos/expert-favicon.png`

## Avatar

- `/branding/avatars/ksenia-avatar.png`

## Favicon

- `/favicon.png`

## Uso en Next.js

```tsx
import Image from "next/image";

export function BrandLogo() {
  return (
    <Image
      src="/branding/logos/expert-logo.png"
      alt="EXPERT"
      width={180}
      height={80}
      priority
    />
  );
}

export function KseniaAvatar() {
  return (
    <Image
      src="/branding/avatars/ksenia-avatar.png"
      alt="Ksenia Ilicheva"
      width={320}
      height={320}
    />
  );
}
```
