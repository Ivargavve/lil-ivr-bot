#!/usr/bin/env python3
"""
Lyrics Formatter Script for Lil IVR Bot

This script helps reformat lyrics files to create better quotes:
- Combines short lines into meaningful phrases
- Ensures each line has sufficient context
- Removes empty lines and formatting artifacts
- Creates consistent line lengths for better quote extraction

Usage: python3 format_lyrics.py
"""

import os
import glob
import re

def format_lyrics_file(file_path):
    """Format a single lyrics file for better quote extraction."""
    print(f"📝 Processing: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into lines and clean
    lines = [line.strip() for line in content.split('\n')]

    # Remove empty lines, comments, and section headers
    cleaned_lines = []
    for line in lines:
        if line and not line.startswith('#') and not line.startswith('[') and not line.endswith(']'):
            # Remove unwanted characters and patterns
            line = clean_lyric_line(line)
            # Remove standalone words that are too short
            if len(line.strip()) > 3:
                cleaned_lines.append(line.strip())

    # Combine short lines into better phrases
    formatted_lines = []
    i = 0

    while i < len(cleaned_lines):
        current_line = cleaned_lines[i]

        # If current line is short (less than 20 chars), try to combine with next
        if len(current_line) < 20 and i + 1 < len(cleaned_lines):
            next_line = cleaned_lines[i + 1]
            # Combine if the result isn't too long
            if len(current_line + " " + next_line) < 80:
                combined = current_line + " " + next_line
                formatted_lines.append(combined)
                i += 2  # Skip next line since we combined it
                continue

        # If line is reasonable length or we can't combine, keep as is
        if len(current_line) >= 10:  # Only keep lines with meaningful content
            formatted_lines.append(current_line)

        i += 1

    return formatted_lines

def clean_lyric_line(line):
    """Clean a lyric line by removing unwanted characters and patterns."""
    # Remove parentheses and their content
    line = re.sub(r'\([^)]*\)', '', line)

    # Remove square brackets and their content
    line = re.sub(r'\[[^\]]*\]', '', line)

    # Remove extra whitespace
    line = re.sub(r'\s+', ' ', line)

    # Remove leading/trailing whitespace
    line = line.strip()

    # Remove lines that are just punctuation or numbers
    if re.match(r'^[^\w\såäöÅÄÖ]*$', line):
        return ""

    return line

def main():
    """Process all lyrics files in the lyrics directory."""
    lyrics_dir = 'lyrics'

    if not os.path.exists(lyrics_dir):
        print(f"❌ Lyrics directory '{lyrics_dir}' not found!")
        return

    # Find all .txt files
    txt_files = glob.glob(os.path.join(lyrics_dir, '*.txt'))

    if not txt_files:
        print(f"❌ No .txt files found in '{lyrics_dir}'!")
        return

    print(f"🎤 Found {len(txt_files)} lyrics files to format")

    total_original_lines = 0
    total_formatted_lines = 0

    for file_path in txt_files:
        # Read original
        with open(file_path, 'r', encoding='utf-8') as f:
            original_lines = len([line for line in f.readlines() if line.strip()])

        # Format the file
        formatted_lines = format_lyrics_file(file_path)

        # Write formatted version directly (no backup)
        with open(file_path, 'w', encoding='utf-8') as f:
            for line in formatted_lines:
                f.write(line + '\n')

        print(f"✅ {os.path.basename(file_path)}: {original_lines} → {len(formatted_lines)} lines")

        total_original_lines += original_lines
        total_formatted_lines += len(formatted_lines)

    print(f"\n🎉 Formatting complete!")
    print(f"📊 Total lines: {total_original_lines} → {total_formatted_lines}")
    print(f"🔄 Restart the server to load new formatted lyrics")

if __name__ == "__main__":
    main()