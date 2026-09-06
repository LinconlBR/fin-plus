import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: Request) {
    const response = await updateSession(request as any);

    return response;
}
