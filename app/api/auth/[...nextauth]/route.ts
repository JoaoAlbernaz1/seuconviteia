// Rotas do Auth.js v5 (sign-in/out, callbacks, csrf, session).
// Runtime Node (padrao para route handlers) — o provider Credentials usa Prisma/bcrypt.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
