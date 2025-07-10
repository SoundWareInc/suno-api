import { createSwaggerSpec } from 'next-swagger-doc'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Suno API',
    version: '1.0.0',
    description: 'A simple API for interacting with Suno.com',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  paths: {
    "/api/generate": {
      "post": {
        "summary": "Generate a song",
        "description": "Generate a song using Suno's AI",
        "tags": ["Generate"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "prompt": {
                    "type": "string",
                    "description": "Prompt for song generation"
                  },
                  "make_instrumental": {
                    "type": "boolean",
                    "description": "Whether to make instrumental",
                    "default": false
                  },
                  "model": {
                    "type": "string",
                    "description": "Model to use for generation"
                  },
                  "wait_audio": {
                    "type": "boolean",
                    "description": "Whether to wait for audio generation to complete",
                    "default": false
                  }
                },
                "required": ["prompt"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Songs generated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/AudioInfo"
                  }
                }
              }
            }
          },
          "400": {
            "description": "Bad request - missing prompt"
          },
          "401": {
            "description": "Unauthorized - invalid cookie"
          },
          "402": {
            "description": "Payment required - insufficient credits"
          },
          "500": {
            "description": "Internal server error"
          }
        }
      }
    },
    "/api/custom_generate": {
      "post": {
        "summary": "Generate a custom song",
        "description": "Generate a custom song with specific tags and title",
        "tags": ["Generate"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "prompt": {
                    "type": "string",
                    "description": "Prompt for song generation"
                  },
                  "tags": {
                    "type": "string",
                    "description": "Style tags for the song"
                  },
                  "title": {
                    "type": "string",
                    "description": "Title of the song"
                  },
                  "make_instrumental": {
                    "type": "boolean",
                    "description": "Whether to make instrumental",
                    "default": false
                  },
                  "model": {
                    "type": "string",
                    "description": "Model to use for generation"
                  },
                  "wait_audio": {
                    "type": "boolean",
                    "description": "Whether to wait for audio generation to complete",
                    "default": false
                  },
                  "negative_tags": {
                    "type": "string",
                    "description": "Negative tags to avoid in the song"
                  }
                },
                "required": ["prompt", "tags", "title"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Custom songs generated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/AudioInfo"
                  }
                }
              }
            }
          },
          "400": {
            "description": "Bad request - missing required fields"
          },
          "401": {
            "description": "Unauthorized - invalid cookie"
          },
          "402": {
            "description": "Payment required - insufficient credits"
          },
          "500": {
            "description": "Internal server error"
          }
        }
      }
    },
    "/api/get_limit": {
      "get": {
        "summary": "Get user credits",
        "description": "Get the current user's credit information",
        "tags": ["Credits"],
        "responses": {
          "200": {
            "description": "Credits retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "credits_left": {
                      "type": "number",
                      "description": "Remaining credits"
                    },
                    "period": {
                      "type": "string",
                      "description": "Billing period"
                    },
                    "monthly_limit": {
                      "type": "number",
                      "description": "Monthly credit limit"
                    },
                    "monthly_usage": {
                      "type": "number",
                      "description": "Monthly credit usage"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized - invalid cookie"
          },
          "500": {
            "description": "Internal server error"
          }
        }
      }
    },
    "/api/get/{songIds}": {
      "get": {
        "summary": "Get song information",
        "description": "Get information about specific songs",
        "tags": ["Songs"],
        "parameters": [
          {
            "name": "songIds",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Comma-separated list of song IDs"
          }
        ],
        "responses": {
          "200": {
            "description": "Song information retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/AudioInfo"
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized - invalid cookie"
          },
          "500": {
            "description": "Internal server error"
          }
        }
      }
    },
    "/api/upload": {
      "post": {
        "summary": "Upload audio from URL",
        "description": "Upload an audio file from a URL to Suno",
        "tags": ["Upload"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "audio_url": {
                    "type": "string",
                    "description": "URL of the audio file to upload"
                  },
                  "filename": {
                    "type": "string",
                    "description": "Optional filename for the uploaded audio"
                  }
                },
                "required": ["audio_url"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Audio uploaded successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "clip_id": {
                      "type": "string",
                      "description": "ID of the created audio clip"
                    },
                    "audio_id": {
                      "type": "string", 
                      "description": "ID of the uploaded audio"
                    },
                    "upload_id": {
                      "type": "string",
                      "description": "ID of the upload process"
                    },
                    "status": {
                      "type": "string",
                      "description": "Upload status"
                    },
                    "filename": {
                      "type": "string",
                      "description": "Filename of the uploaded audio"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Bad request - missing audio_url"
          },
          "401": {
            "description": "Unauthorized - invalid cookie"
          },
          "402": {
            "description": "Payment required - insufficient credits"
          },
          "500": {
            "description": "Internal server error"
          }
        }
      }
    },
    "/api/upload-file": {
      "post": {
        "summary": "Upload audio file directly",
        "description": "Upload an audio file directly to Suno via multipart form data",
        "tags": ["Upload"],
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "file": {
                    "type": "string",
                    "format": "binary",
                    "description": "Audio file to upload (supports MP3, WAV, etc.)"
                  }
                },
                "required": ["file"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Audio file uploaded successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "clip_id": {
                      "type": "string",
                      "description": "ID of the created audio clip"
                    },
                    "audio_id": {
                      "type": "string", 
                      "description": "ID of the uploaded audio"
                    },
                    "upload_id": {
                      "type": "string",
                      "description": "ID of the upload process"
                    },
                    "status": {
                      "type": "string",
                      "description": "Upload status"
                    },
                    "filename": {
                      "type": "string",
                      "description": "Filename of the uploaded audio"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Bad request - no file provided"
          },
          "401": {
            "description": "Unauthorized - invalid cookie"
          },
          "402": {
            "description": "Payment required - insufficient credits"
          },
          "500": {
            "description": "Internal server error"
          }
        }
      }
    },
    "/api/upload_status": {
      "get": {
        "summary": "Get upload status",
        "description": "Check the status of an audio upload",
        "tags": ["Upload"],
        "parameters": [
          {
            "name": "upload_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "ID of the upload to check"
          }
        ],
        "responses": {
          "200": {
            "description": "Upload status retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string",
                      "description": "Upload status (processing, complete, error)"
                    },
                    "error_message": {
                      "type": "string",
                      "description": "Error message if status is error"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Bad request - missing upload_id"
          },
          "401": {
            "description": "Unauthorized - invalid cookie"
          },
          "500": {
            "description": "Internal server error"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      AudioInfo: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the audio'
          },
          title: {
            type: 'string',
            description: 'Title of the audio'
          },
          image_url: {
            type: 'string',
            description: 'URL of the image associated with the audio'
          },
          lyric: {
            type: 'string',
            description: 'Lyrics of the audio'
          },
          audio_url: {
            type: 'string',
            description: 'URL of the audio file'
          },
          video_url: {
            type: 'string',
            description: 'URL of the video associated with the audio'
          },
          created_at: {
            type: 'string',
            description: 'Date and time when the audio was created'
          },
          model_name: {
            type: 'string',
            description: 'Name of the model used for audio generation'
          },
          gpt_description_prompt: {
            type: 'string',
            description: 'Prompt for GPT description'
          },
          prompt: {
            type: 'string',
            description: 'Prompt for audio generation'
          },
          status: {
            type: 'string',
            description: 'Status of the audio'
          },
          type: {
            type: 'string',
            description: 'Type of the audio'
          },
          tags: {
            type: 'string',
            description: 'Genre of music'
          },
          negative_tags: {
            type: 'string',
            description: 'Negative tags of music'
          },
          duration: {
            type: 'string',
            description: 'Duration of the audio'
          },
          error_message: {
            type: 'string',
            description: 'Error message if any'
          }
        }
      }
    }
  }
}

export const getApiDocs = () => createSwaggerSpec({
  definition: swaggerDefinition,
  apiFolder: 'src/app/api',
}) 