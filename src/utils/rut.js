const cleanRut = (value = '') => String(value).replace(/[^0-9kK]/g, '').toUpperCase();

export const normalizeRut = (value = '') => cleanRut(value);

export const formatRut = (value = '') => {
    const normalized = cleanRut(value);
    if (normalized.length < 2) {
        return normalized;
    }

    const body = normalized.slice(0, -1);
    const verifier = normalized.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${verifier}`;
};

export const isValidRut = (value = '') => {
    const normalized = cleanRut(value);
    if (!/^\d{7,8}[\dK]$/.test(normalized)) {
        return false;
    }

    const body = normalized.slice(0, -1);
    const verifier = normalized.slice(-1);

    let sum = 0;
    let multiplier = 2;

    for (let index = body.length - 1; index >= 0; index -= 1) {
        sum += Number(body[index]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expected = 11 - (sum % 11);
    const expectedVerifier = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
    return verifier === expectedVerifier;
};

export const formatRutInput = (value = '') => formatRut(value);
