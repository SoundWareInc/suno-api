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
                                <li>3. Click "Import" → "Upload Files"</li>
                                <li>4. Select the downloaded JSON file</li>
                                <li>5. All endpoints will be imported! 🚀</li>
                            </ol>
                        </div>
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
