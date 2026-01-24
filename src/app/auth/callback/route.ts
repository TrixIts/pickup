
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'
    const returnTo = searchParams.get('returnTo')

    if (code) {
        const supabase = await createClient()
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if profile is complete
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('age_range')
                    .eq('id', user.id)
                    .single()

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error("Error fetching profile in callback:", profileError);
                }

                // If onboarding is incomplete, redirect to onboarding with returnTo
                if (!profile?.age_range || profile.age_range === "") {
                    console.log("Onboarding incomplete for user:", user.email);
                    const onboardingUrl = returnTo
                        ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}`
                        : next !== '/dashboard'
                            ? `/onboarding?returnTo=${encodeURIComponent(next)}`
                            : '/onboarding';
                    return NextResponse.redirect(`${origin}${onboardingUrl}`)
                }
            }

            // Onboarding complete, go to dashboard or intended page
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error("Exchange code error:", exchangeError.message);
        }
    }

    // If no code or error during exchange, fallback to error page
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
