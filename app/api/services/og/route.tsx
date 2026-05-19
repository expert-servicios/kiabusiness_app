import { ImageResponse } from 'next/og';
import { categories, services } from '@/lib/utils/catalog';

export const runtime = 'edge';

const colors = {
  blue: '#0D1B2A',
  blueSoft: '#162A43',
  cream: '#F8F6F1',
  gold: '#D4A017',
  gray: '#9CA3AF',
  ink: '#23364D'
};

function trimText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? '';
  const variant = searchParams.get('variant') === 'hero' ? 'hero' : 'square';
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    return new Response('Service not found', { status: 404 });
  }

  const category = categories.find((item) => item.slug === service.categoria);
  const isHero = variant === 'hero';
  const width = isHero ? 1600 : 1200;
  const height = isHero ? 900 : 1200;
  const titleSize = service.name.length > 62 ? (isHero ? 58 : 54) : isHero ? 68 : 64;
  const summary = trimText(service.metaDescription ?? service.shortDescription, isHero ? 170 : 150);

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: colors.blue,
          color: colors.cream,
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(212,160,23,0.22) 0%, rgba(13,27,42,0) 34%), linear-gradient(110deg, #0D1B2A 0%, #0D1B2A 57%, #162A43 57%, #162A43 100%)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: isHero ? 94 : 86,
            top: isHero ? 86 : 130,
            width: isHero ? 450 : 440,
            height: isHero ? 610 : 520,
            border: `2px solid ${colors.gold}`,
            background: colors.cream,
            color: colors.blue,
            padding: 34,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 28px 90px rgba(0,0,0,0.30)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ width: 86, height: 7, background: colors.gold }} />
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.25 }}>Expediente preparado con criterio documental</div>
            <div style={{ color: colors.ink, fontSize: 22, lineHeight: 1.45 }}>
              Revisión, formularios, presentación y seguimiento inicial.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {service.officialFee && (
              <div style={{ borderTop: `1px solid ${colors.gold}`, paddingTop: 16, fontSize: 20, color: colors.ink }}>
                {service.officialFee}
              </div>
            )}
            {service.price && (
              <div style={{ background: colors.blue, color: colors.cream, padding: '16px 18px', fontSize: 26, fontWeight: 700 }}>
                {service.price}
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: isHero ? 96 : 76,
            top: isHero ? 82 : 82,
            right: isHero ? 620 : 76,
            bottom: isHero ? 76 : 84,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: isHero ? 30 : 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 48, height: 48, background: colors.gold }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>EXPERT</div>
                <div style={{ fontSize: 17, color: colors.gray }}>expertconsulting.es</div>
              </div>
            </div>
            <div
              style={{
                alignSelf: 'flex-start',
                border: `1px solid ${colors.gold}`,
                color: colors.gold,
                padding: '12px 18px',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 1.6,
                textTransform: 'uppercase'
              }}
            >
              {category?.name ?? 'Servicio profesional'}
            </div>
            <div style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: titleSize, fontWeight: 700, lineHeight: 1.04 }}>
              {service.name}
            </div>
            <div style={{ maxWidth: isHero ? 760 : 820, color: colors.gray, fontSize: isHero ? 28 : 30, lineHeight: 1.35 }}>
              {summary}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: colors.cream, fontSize: 24, fontWeight: 700 }}>
            <div style={{ width: 130, height: 5, background: colors.gold }} />
            <span>Gestión online desde España</span>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height
    }
  );
}
