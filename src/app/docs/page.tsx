'use client';

import React from 'react';
import Swagger from '../components/Swagger';
import spec from './swagger-suno-api.json'; // 直接导入JSON文件
import Section from '../components/Section';
import Markdown from 'react-markdown';


export default function Docs() {
    const downloadPostmanCollection = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spec, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "suno-api-postman.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <>
            <Section className="my-10">
                <article className="prose lg:prose-lg max-w-3xl pt-10">
                    <h1 className=' text-center text-indigo-900'>
                        API Docs
                    </h1>
                    <Markdown>
                        {`                     
---
\`gcui-art/suno-api\` currently mainly implements the following APIs:

\`\`\`bash
- \`/api/generate\`: Generate music
- \`/v1/chat/completions\`: Generate music - Call the generate API in a format 
  that works with OpenAI's API.
- \`/api/custom_generate\`: Generate music (Custom Mode, support setting lyrics, 
  music style, title, etc.)
- \`/api/generate_lyrics\`: Generate lyrics based on prompt
- \`/api/get\`: Get music information based on the id. Use "," to separate multiple 
    ids.  If no IDs are provided, all music will be returned.
- \`/api/get_limit\`: Get quota Info
- \`/api/extend_audio\`: Extend audio length
- \`/api/generate_stems\`: Make stem tracks (separate audio and music track)
- \`/api/generate_all_stems\`: Generate all 12 instrument stems (Vocals, Drums, Bass, Guitar, etc.)
- \`/api/get_aligned_lyrics\`: Get list of timestamps for each word in the lyrics
- \`/api/clip\`:  Get clip information based on ID passed as query parameter \`id\`
- \`/api/concat\`: Generate the whole song from extensions
- \`/api/persona\`: Get persona information and clips based on ID and page number
- \`/api/upload\`: Upload audio from URL - provide audio_url and optional filename
- \`/api/upload-file\`: Upload audio file directly - multipart/form-data with file field
- \`/api/upload_status\`: Check upload status - provide upload_id parameter
\`\`\`

Feel free to explore the detailed API parameters and conduct tests on this page.
                        `}
                    </Markdown>
                </article>
            </Section>

            <Section className="my-10">
                <article className='prose lg:prose-lg max-w-3xl py-5'>
                    <h2 className='text-center'>
                        Import to Postman
                    </h2>
                    <div className='text-center space-y-4'>
                        <p className='text-gray-600'>
                            Easily import all API endpoints into Postman for testing
                        </p>
                        <button 
                            onClick={downloadPostmanCollection}
                            className='bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors duration-200'
                        >
                            📥 Download for Postman
                        </button>
                        <div className='text-sm text-gray-500 max-w-md mx-auto'>
                            <p><strong>How to import:</strong></p>
                            <ol className='text-left space-y-1'>
                                <li>1. Click the download button above</li>
                                <li>2. Open Postman</li>
                                <li>3. Click &quot;Import&quot; → &quot;Upload Files&quot;</li>
                                <li>4. Select the downloaded JSON file</li>
                                <li>5. All endpoints will be imported! 🚀</li>
                            </ol>
                        </div>
                    </div>
                </article>
            </Section>

            <Section className="my-10">
                <article className='prose lg:prose-lg max-w-3xl py-5'>
                    <h2 className='text-center'>
                        Copy API Info for AI Agents
                    </h2>
                    <div className='text-center space-y-4'>
                        <p className='text-gray-600'>
                            Complete API endpoint information for easy copy-paste to AI agents
                        </p>
                        <div className='bg-gray-50 p-4 rounded-lg border'>
                            <textarea
                                className='w-full h-96 p-3 text-xs font-mono bg-white border rounded resize-y'
                                readOnly
                                value={`SUNO API ENDPOINTS:

POST /api/generate
Body: {"prompt": "string", "make_instrumental": boolean, "model": "string", "wait_audio": boolean}
Response: Array of AudioInfo objects

POST /api/custom_generate  
Body: {"prompt": "string", "tags": "string", "title": "string", "make_instrumental": boolean, "model": "string", "wait_audio": boolean, "negative_tags": "string"}
Response: Array of AudioInfo objects

POST /api/generate_lyrics
Body: {"prompt": "string"}
Response: Generated lyrics object

POST /api/generate_stems
Body: {"audio_id": "string"}
Response: AudioInfo object with stem information

POST /api/generate_all_stems
Body: {"audio_id": "string", "title": "string", "wait_audio": boolean}
Response: Array of AudioInfo objects with all 12 instrument stems

POST /api/extend_audio
Body: {"audio_id": "string", "prompt": "string", "continue_at": number, "tags": "string", "negative_tags": "string", "title": "string", "model": "string", "wait_audio": boolean}
Response: Array of AudioInfo objects

POST /api/concat
Body: {"clip_id": "string"}
Response: AudioInfo object

GET /api/get
Query: ids (comma-separated), page
Response: Array of AudioInfo objects

GET /api/clip
Query: id (required)
Response: AudioInfo object

GET /api/persona
Query: id (required), page
Response: Persona information object

GET /api/get_limit
Response: {"credits_left": number, "period": "string", "monthly_limit": number, "monthly_usage": number}

GET /api/get_aligned_lyrics
Query: song_id (required)
Response: Lyric alignment object

POST /api/upload
Body: {"audio_url": "string", "filename": "string"}
Response: {"clip_id": "string", "audio_id": "string", "upload_id": "string", "status": "string", "filename": "string"}

POST /api/upload-file
Body: multipart/form-data with file field
Response: {"clip_id": "string", "audio_id": "string", "upload_id": "string", "status": "string", "filename": "string"}

GET /api/upload_status
Query: upload_id (required)
Response: {"status": "string", "error_message": "string"}

AudioInfo Schema: {"id": "string", "title": "string", "image_url": "string", "lyric": "string", "audio_url": "string", "video_url": "string", "created_at": "string", "model_name": "string", "gpt_description_prompt": "string", "prompt": "string", "status": "string", "type": "string", "tags": "string", "negative_tags": "string", "duration": "string", "error_message": "string"}

Common Response Codes: 200 (Success), 400 (Bad Request), 401 (Unauthorized), 402 (Payment Required), 500 (Internal Server Error)
Authentication: Cookie-based (SUNO_COOKIE env var)
Base URL: http://localhost:3000`}
                                onClick={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.select();
                                    navigator.clipboard.writeText(target.value);
                                }}
                            />
                        </div>
                        <p className='text-sm text-gray-500'>
                            💡 Click the text area above to select all and copy to clipboard
                        </p>
                    </div>
                </article>
            </Section>

            <Section className="my-10">
                <article className='prose lg:prose-lg max-w-3xl py-10'>
                    <h2 className='text-center'>
                        Details of the API and testing it online
                    </h2>
                    <p className='text-red-800 italic'>
                        This is just a demo, bound to a test account. Please do not use it frequently, so that more people can test online.
                    </p>
                </article>

                <div className=' border p-4 rounded-2xl shadow-xl hover:shadow-none duration-200'>
                    <Swagger spec={spec} />
                </div>

            </Section>
        </>

    );
}
