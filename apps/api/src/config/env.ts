import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    API_PORT: z.coerce.number().default(4000),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    INTERNAL_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
