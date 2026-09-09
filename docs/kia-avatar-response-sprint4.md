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

There are two explicit motion surfaces:

- persistent header / launcher surfaces use `animateOnChange`; they may transition between avatar images and keep the slow `pensando` loop, but semantic one-shot motions (`confirm`, `celebrate`, `attention`) are suppressed there;
- the avatar attached to a newly visible assistant response uses `animateResponse`; that is the only live chat surface where semantic one-shot motion is allowed.

The copilot panel stays mounted while hidden, so closing and reopening it does not remount historical message avatars or replay an old one-shot. A new response is first scrolled into view and then enabled for response motion on the next animation frame. Historical responses therefore remain visually quiet and a short one-shot is not consumed off-screen during automatic scrolling.

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

Smoke-test desktop and mobile with normal motion and OS/browser reduced-motion enabled. Also verify that:

- opening/closing KIA does not replay previous response motion;
- a fresh `exito`, `celebracion`, `aviso` or `alerta_fiscal` response animates once after it is visible;
- long conversations scroll to the new response before the one-shot starts.

Refs #171, #174, #176, #178, #188.