import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers'
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { audio_url, filename } = body;

            if (!audio_url) {
                return new NextResponse(JSON.stringify({ error: 'audio_url is required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            console.log('Starting upload for:', audio_url);
            
            const uploadInfo = await (await sunoApi((await cookies()).toString())).uploadAudio(
                audio_url,
                filename
            );

            console.log('Upload completed:', uploadInfo);

            return new NextResponse(JSON.stringify(uploadInfo), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        } catch (error: any) {
            console.error('Error uploading audio:', error.message || error);
            console.error('Error stack:', error.stack);
            
            // Handle specific error types
            if (error.message?.includes('Unauthorized')) {
                return new NextResponse(JSON.stringify({ error: 'Unauthorized - please check your SUNO_COOKIE configuration' }), {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }
            
            if (error.response?.status === 402) {
                return new NextResponse(JSON.stringify({ error: error.response.data.detail || 'Insufficient credits' }), {
                    status: 402,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }
            
            if (error.response?.status === 404) {
                return new NextResponse(JSON.stringify({ error: 'Upload endpoint not found - API may have changed' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }
            
            return new NextResponse(JSON.stringify({ 
                error: 'Internal server error: ' + (error.response?.data?.detail || error.message || 'Unknown error') 
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    } else {
        return new NextResponse('Method Not Allowed', {
            headers: {
                Allow: 'POST',
                ...corsHeaders
            },
            status: 405
        });
    }
}

export async function OPTIONS(request: Request) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders
    });
} 