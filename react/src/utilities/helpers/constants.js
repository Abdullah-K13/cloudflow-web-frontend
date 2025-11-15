export const Roles = {
    DRIVER: 1,
    COMPANY_ADMIN: 2,
    RESTAURANT_ADMIN: 3,
    BRANCH_ADMIN: 4,
    INSPECTOR: 5,
    TESTER: 6,
    ADMIN: 7,
}

export const UploadMap = {
    RouteTypes: {
        PROFILE_PICTURE: 1,
        SCHEDULE_IMAGES: 2,
        SCHEDULE_VIDEOS: 3,
        DRIVER_DOCUMENTS: 4,
        RESTAURANT_DOCUMENTS: 5,
        COMPANY_DOCUMENTS: 6,
        VERIFIER_DOCUMENTS: 7,
        ADMIN_DOCUMENTS: 8,
        TESTER_DOCUMENTS: 9,
    },
    Upload: {
        Types: {
            IMAGE: 1,
            FILE: 2,
            VIDEO: 3,
        },
        Keys: {
            IMAGE: 'images',
            FILE: 'files',
            VIDEO: 'videos',
        }
    }
}