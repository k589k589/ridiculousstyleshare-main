import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not found')
        }

        console.log(`Starting deletion for user: ${user.id}`)

        // Create Admin client to delete user data
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Delete Storage Files (outfit-images bucket)
        // Everything for the user is stored under the {user_id}/ folder in 'outfit-images'
        const { data: files, error: listError } = await supabaseAdmin
            .storage
            .from('outfit-images')
            .list(`${user.id}/`, {
                limit: 100,
                offset: 0,
            })

        if (listError) {
            console.error('Error listing storage files:', listError)
            // Continue even if storage listing fails, to at least delete DB data
        } else if (files && files.length > 0) {
            const filesToDelete = files.map(f => `${user.id}/${f.name}`)
            console.log(`Deleting ${filesToDelete.length} files from storage`)

            const { error: deleteStorageError } = await supabaseAdmin
                .storage
                .from('outfit-images')
                .remove(filesToDelete)

            if (deleteStorageError) {
                console.error('Error deleting files:', deleteStorageError)
            }
        }

        // 2. Delete Database Records (Order matters if cascading is not set up)
        // Dependent tables first
        const tablesToDelete = [
            'outfit_likes',
            'outfit_comments',
            'outfit_bookmarks',
            'outfits', // This has FK to user_id
            'vip_subscriptions',
            'user_follows', // Check both follower and following
            'profiles'
        ]

        for (const table of tablesToDelete) {
            // Handle user_follows specially or just delete where user is involved
            if (table === 'user_follows') {
                await supabaseAdmin.from(table).delete().eq('follower_id', user.id)
                await supabaseAdmin.from(table).delete().eq('following_id', user.id)
            } else {
                const { error: dbError } = await supabaseAdmin
                    .from(table)
                    .delete()
                    .eq(table === 'outfit_bookmarks' ? 'user_id' : 'user_id', user.id)

                if (dbError) {
                    console.error(`Error deleting from ${table}:`, dbError)
                    // If error is about FK constraints, we might have missed a table. 
                    // But we continue to try deleting the rest.
                }
            }
        }

        // 3. Delete user from auth
        // This is the most critical step to prevent login
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
            user.id
        )

        if (deleteError) throw deleteError

        console.log(`Successfully deleted user: ${user.id}`)

        return new Response(
            JSON.stringify({ message: 'User and all data deleted successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Delete user error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
