export const permissions = {
    admin: {
        can: ['create', 'read', 'update', 'delete'],
    },
    user: {
        can: ['read'],
    },
}

export const checkPermission = (role: string, action: string) => {
    const rolePermissions = permissions[role as keyof typeof permissions];

    if (!rolePermissions) {
        return false;
    }

    return rolePermissions.can.includes(action);
}