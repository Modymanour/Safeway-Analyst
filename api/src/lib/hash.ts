import crypto from "crypto"

export const hash_password = (password: string) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 100_000;
        const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
        return `pbkdf2$${iterations}$${salt}$${hash}`;
};

export const verify_password = (user_password: string, password: string) => {
    const [algorithm, iterationText, salt, storedHash] = user_password.split('$');
    const iterations = Number(iterationText);
    if (algorithm !== 'pbkdf2' || !salt || !storedHash || !Number.isInteger(iterations) || iterations < 1) {
        return false;
    }
    const actualHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
    const expectedHash = Buffer.from(storedHash, 'hex');
    return actualHash.length === expectedHash.length && crypto.timingSafeEqual(actualHash, expectedHash);
};