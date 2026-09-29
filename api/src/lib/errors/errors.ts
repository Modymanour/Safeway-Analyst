export class ValidationError extends Error {// statud: 400
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {// status: 404
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends Error{// status: 401
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error{// status: 403
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}