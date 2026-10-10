(async () => { for (let i = 0; i < 1200 && !window.VAL_RESULT; i++) await new Promise(r => setTimeout(r, 250)); return window.VAL_RESULT ? window.VAL_RESULT.text : 'sin resultado'; })()
