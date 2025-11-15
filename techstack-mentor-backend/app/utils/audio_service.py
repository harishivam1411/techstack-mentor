"""
Audio service for handling speech-to-text and text-to-speech operations.
Uses OpenAI Whisper for transcription and OpenAI TTS for speech synthesis.
"""

import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional
from openai import AsyncOpenAI
from app.config import get_settings

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)


class AudioService:
    """Service for handling audio transcription and speech synthesis."""

    @staticmethod
    async def transcribe_audio(file_path: str) -> str:
        """
        Transcribe audio file to text using OpenAI Whisper API.

        Args:
            file_path: Path to the audio file to transcribe

        Returns:
            Transcribed text string

        Raises:
            Exception: If transcription fails
        """
        try:
            with open(file_path, "rb") as audio_file:
                transcript = await client.audio.transcriptions.create(
                    model=settings.openai_whisper_model,
                    file=audio_file,
                    response_format="text"
                )

            # Whisper returns a string when response_format="text"
            transcription_text = transcript if isinstance(transcript, str) else transcript.text

            return transcription_text.strip()

        except Exception as e:
            raise Exception(f"Failed to transcribe audio: {str(e)}")

    @staticmethod
    async def text_to_speech(text: str, voice: Optional[str] = None) -> bytes:
        """
        Convert text to speech using OpenAI TTS API.

        Args:
            text: Text to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer).
                   Defaults to config setting.

        Returns:
            Audio data as bytes (MP3 format)

        Raises:
            Exception: If speech synthesis fails
        """
        try:
            selected_voice = voice or settings.openai_tts_voice

            response = await client.audio.speech.create(
                model=settings.openai_tts_model,
                voice=selected_voice,
                input=text,
                response_format="mp3"
            )

            # Get the audio content directly
            audio_data = response.content

            return audio_data

        except Exception as e:
            raise Exception(f"Failed to generate speech: {str(e)}")

    @staticmethod
    async def save_audio_file(
        audio_data: bytes,
        directory: str,
        filename: Optional[str] = None,
        extension: str = ".mp3"
    ) -> str:
        """
        Save audio data to file.

        Args:
            audio_data: Audio data as bytes
            directory: Directory to save the file (recordings or responses)
            filename: Optional filename (without extension). If None, generates UUID.
            extension: File extension (default: .mp3)

        Returns:
            Relative file path to the saved audio

        Raises:
            Exception: If file save fails
        """
        try:
            # Ensure directory exists
            dir_path = Path(directory)
            dir_path.mkdir(parents=True, exist_ok=True)

            # Generate filename if not provided
            if not filename:
                filename = str(uuid.uuid4())

            # Remove extension if already present in filename
            filename = filename.replace(extension, "")

            # Create full file path
            file_path = dir_path / f"{filename}{extension}"

            # Save file asynchronously
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(audio_data)

            # Return relative path
            return str(file_path)

        except Exception as e:
            raise Exception(f"Failed to save audio file: {str(e)}")

    @staticmethod
    async def save_uploaded_file(
        file_data: bytes,
        session_id: str,
        extension: str = ".webm"
    ) -> str:
        """
        Save uploaded audio file from user recording.

        Args:
            file_data: Uploaded file data
            session_id: Session ID for organizing files
            extension: File extension based on upload type

        Returns:
            Relative file path to the saved recording
        """
        filename = f"{session_id}_{uuid.uuid4()}"
        return await AudioService.save_audio_file(
            audio_data=file_data,
            directory=settings.audio_recordings_dir,
            filename=filename,
            extension=extension
        )

    @staticmethod
    async def save_ai_response_audio(
        audio_data: bytes,
        session_id: str,
        question_number: int
    ) -> str:
        """
        Save AI-generated speech audio.

        Args:
            audio_data: TTS audio data
            session_id: Session ID for organizing files
            question_number: Question number for naming

        Returns:
            Relative file path to the saved AI audio
        """
        filename = f"{session_id}_q{question_number}"
        return await AudioService.save_audio_file(
            audio_data=audio_data,
            directory=settings.audio_responses_dir,
            filename=filename,
            extension=".mp3"
        )

    @staticmethod
    def get_audio_url(file_path: str) -> str:
        """
        Generate URL for accessing audio file.

        Args:
            file_path: Relative file path

        Returns:
            URL path for the audio file
        """
        # Extract just the filename from the full path
        filename = Path(file_path).name

        # Determine if it's a recording or response based on directory
        if "recordings" in file_path:
            return f"/api/interview/audio/recordings/{filename}"
        else:
            return f"/api/interview/audio/responses/{filename}"

    @staticmethod
    def validate_audio_file_size(file_size: int) -> bool:
        """
        Validate that audio file size is within limits.

        Args:
            file_size: File size in bytes

        Returns:
            True if valid, False otherwise
        """
        max_size_bytes = settings.max_audio_file_size_mb * 1024 * 1024
        return file_size <= max_size_bytes

    @staticmethod
    def validate_audio_format(filename: str) -> bool:
        """
        Validate that audio file format is supported.

        Args:
            filename: Name of the file

        Returns:
            True if format is supported, False otherwise
        """
        file_extension = Path(filename).suffix.lower()
        return file_extension in settings.supported_audio_formats


# Create singleton instance
audio_service = AudioService()
