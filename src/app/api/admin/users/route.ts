import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        // 1. Auth & Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        if (!adminProfile?.is_admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Build Query
        let query = supabase
            .from("profiles")
            .select("id, email, first_name, last_name, avatar_url, is_admin, created_at, age_range, gender, location", { count: "exact" });

        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: users, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            users: users || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        });
    } catch (error: any) {
        console.error("Admin users error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { userId, updates } = await req.json();

        // 1. Auth & Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        if (!adminProfile?.is_admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Update User
        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin user update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
