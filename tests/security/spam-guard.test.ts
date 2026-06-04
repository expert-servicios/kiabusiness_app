import { describe, it, expect, beforeEach } from 'vitest';
import { checkSpam, checkRateLimit } from '@/lib/utils/spam-guard';

describe('checkSpam', () => {
  it('permite email y nombre limpios', () => {
    const result = checkSpam({ name: 'Ana García', email: 'ana@empresa.es', message: 'Hola, quiero informacion.' });
    expect(result.isSpam).toBe(false);
  });

  it('detecta dominio de email desechable', () => {
    const result = checkSpam({ email: 'test@mailinator.com' });
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe('disposable_email');
  });

  it('detecta URL en el nombre', () => {
    const result = checkSpam({ name: 'http://spam.com' });
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe('url_in_name');
  });

  it('detecta keyword de spam en mensaje', () => {
    const result = checkSpam({ message: 'Buy casino chips now!' });
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe('spam_keyword');
  });

  it('detecta multiples URLs en mensaje', () => {
    const result = checkSpam({ message: 'Check https://a.com and also https://b.com for deals' });
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe('multiple_urls_in_message');
  });

  it('detecta caracteres repetidos', () => {
    const result = checkSpam({ message: 'aaaaaahello' });
    expect(result.isSpam).toBe(true);
    expect(result.reason).toBe('repeated_chars');
  });
});

describe('checkRateLimit', () => {
  // Use unique keys per test to avoid state leakage between runs
  let keyBase: string;

  beforeEach(() => {
    keyBase = `test:${Math.random().toString(36).slice(2)}`;
  });

  it('permite las primeras 5 peticiones', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(`${keyBase}:a`)).toBe(true);
    }
  });

  it('bloquea la 6a peticion de la misma IP', () => {
    const key = `${keyBase}:b`;
    for (let i = 0; i < 5; i++) checkRateLimit(key);
    expect(checkRateLimit(key)).toBe(false);
  });

  it('permite IPs distintas de forma independiente', () => {
    const key1 = `${keyBase}:ip1`;
    const key2 = `${keyBase}:ip2`;
    for (let i = 0; i < 5; i++) checkRateLimit(key1);
    // ip2 no ha llegado al límite
    expect(checkRateLimit(key2)).toBe(true);
  });
});
