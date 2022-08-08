export { }

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            AUTH_SERVER_PORT: string
            APP_SERVER_PORT: string
            ACCESS_TOKEN_SECRET: string
            REFRESH_TOKEN_SECRET: string
            DATABASE_URL: string
        }
    }
}