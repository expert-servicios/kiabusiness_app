# KIA avatar response system — Sprint 4

## Goal

Turn the contextual KIA avatar into a restrained animated copilot using only lightweight CSS motion. The avatar should feel responsive without becoming distracting, theatrical or childlike.

## Motion contract

Motion is derived exclusively from the already-resolved visual state. It never changes the operational decision, tool permissions, authentication, `company_id`, case selection or any other backend behavior.

| Avatar state | Motion | Behavior |
| --- | --- | --- |
| `pensando` | `thinking` | Slow 1 px / 1.5% loop while work is in flight. |
| `exito` | `confirm` | One-shot 1 px / 2% lift and settle. |
| `celebracion` | `celebrate` | One-shot 1 px / 2.5% lift and soft settle. |
| `aviso` | `attention` | One-shot 1.5% scale pulse, no shake. |
| `alerta_fiscal` | `attention` | Same restrained attention motion; severity comes from expression/text, not stronger movement. |
| all others | `static` | Only the existing 160 ms image state transition. |

## Scope

Only surfaces that explicitly pass `animateOnChange` receive motion. The persistent copilot header and launcher already opt in. Avatars attached to individual chat messages remain static.

This keeps a long conversation visually quiet while still making the live KIA presence responsive.

## Accessibility

`prefers-reduced-motion: reduce` disables:

- state transition;
- thinking loop;
- confirmation motion;
- celebration motion;
- attention motion.

The text remains fully self-contained and no meaning depends on movement.

## Deliberately excluded

- GIF/video assets;
- lipsync;
- audio/autoplay;
- blinking or permanent breathing loops;
- shaking for warnings;
- stronger animation for fiscal severity;
- user emotional profiling;
- any DDL or persistence change.

## QA

Use `data-kia-avatar-motion` to verify the live profile in browser tools:

- `static`
- `thinking`
- `confirm`
- `celebrate`
- `attention`

Smoke-test desktop and mobile with normal motion and OS/browser reduced-motion enabled.

Refs #171, #174, #176, #178, #188.
