import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers'
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    if (req.method === 'GET') {
        try {
            const { searchParams } = new URL(req.url);
            const upload_id = searchParams.get('upload_id');

            if (!upload_id) {
                return new NextResponse(JSON.stringify({ error: 'upload_id is required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            const statusInfo = await (await sunoApi((await cookies()).toString())).getUploadStatus(upload_id);

            return new NextResponse(JSON.stringify(statusInfo), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        } catch (error: any) {
            console.error('Error getting upload status:', error.message || error);
            
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
                Allow: 'GET',
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