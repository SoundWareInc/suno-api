import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers'
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { clip_id, wait_for_conversion } = body;

      if (!clip_id) {
        return new NextResponse(JSON.stringify({ error: 'clip_id is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      console.log(`Converting clip ${clip_id} to WAV format...`);
      
      // Use the convenience method that handles both conversion and getting URL
      const wavFileInfo = await (await sunoApi((await cookies()).toString())).getWavFile(
        clip_id, 
        wait_for_conversion !== false // Default to true unless explicitly false
      );

      console.log(`WAV file ready:`, wavFileInfo);

      return new NextResponse(JSON.stringify({
        success: true,
        clip_id,
        wav_file_url: wavFileInfo.wav_file_url,
        message: 'WAV file converted and ready'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      console.error('Error processing WAV file:', error);
      
      if (error.response?.status === 401) {
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
        return new NextResponse(JSON.stringify({ error: 'Clip not found or WAV conversion failed' }), {
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