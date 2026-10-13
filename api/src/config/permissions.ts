export const permissions = {
    admin: {
        can: ['create', 'read', 'update', 'delete', 'delete_user', "change_permissions", "set_category", "create_category", "set_issue", "set_issue_comment"],
    },
    user: {
        can: ['read', 'delete_user', "create_category", "set_issue", "set_issue_comment"],
    },
}

export const checkPermission = (role: string, action: string) => {
    const rolePermissions = permissions[role as keyof typeof permissions];

    if (!rolePermissions) {
        return false;
    }

    return rolePermissions.can.includes(action);
}