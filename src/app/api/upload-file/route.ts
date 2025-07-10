import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers'
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        // Parse multipart form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return new NextResponse(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`Starting file upload for: ${file.name} (${buffer.length} bytes)`);

        // Upload using the existing uploadAudioBuffer method
        const uploadResult = await (await sunoApi((await cookies()).toString())).uploadAudioBuffer(buffer, file.name);

        console.log('File upload completed:', uploadResult);

        return new NextResponse(JSON.stringify(uploadResult), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });

    } catch (error: any) {
        console.error('Error uploading file:', error.message || error);
        console.error('Error stack:', error.stack);
        
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
}

export async function OPTIONS(request: Request) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders
    });
} 