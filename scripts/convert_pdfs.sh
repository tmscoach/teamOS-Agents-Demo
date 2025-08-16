#!/bin/bash

# Use the marker CLI from the pipx venv
MARKER_BIN="$HOME/.local/pipx/venvs/marker-pdf/bin/marker"
total_folders=0
total_pdfs=0

echo "Starting PDF to Markdown conversion..."
echo

# Find all subfolders in 'TMS IP' that contain PDFs
find "TMS IP" -type f -name "*.pdf" | while read -r pdf; do
  dir=$(dirname "$pdf")
  echo "$dir"
done | sort | uniq | while read -r subdir; do
  ((total_folders++))
  # Compute the relative subdir path
  rel_subdir="${subdir#TMS IP/}"
  # Set the output directory in .documentation
  out_dir=".documentation/$rel_subdir"
  mkdir -p "$out_dir"
  echo "Processing folder: $subdir"
  pdfs=("$subdir"/*.pdf)
  pdf_count=${#pdfs[@]}
  echo "  Found $pdf_count PDF(s) in $subdir"
  for pdf_file in "$subdir"/*.pdf; do
    if [ -f "$pdf_file" ]; then
      echo "    Processing PDF: $pdf_file"
    fi
  done
  # Run marker on the subdir
  "$MARKER_BIN" "$subdir"
  for md in "$subdir"/*.md; do
    if [ -f "$md" ]; then
      mv "$md" "$out_dir"
      echo "    Moved: $(basename "$md") -> $out_dir"
      ((total_pdfs++))
    fi
  done
  echo "Processed $subdir -> $out_dir"
  echo
  # Flush output
  sleep 0.1
done

echo "Done! Processed $total_folders folder(s) and $total_pdfs PDF(s)." 